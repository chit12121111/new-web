import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getUserSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            seoCredits: true,
            reelCredits: true,
          },
        },
      },
    });

    return subscription;
  }

  async createCheckoutSession(userId: string, planName: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { name: planName },
    });

    if (!plan || !plan.stripePriceId) {
      throw new BadRequestException('Invalid plan');
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;

      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${this.configService.get('FRONTEND_URL')}/dashboard?success=true`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        planName: plan.name,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async createCustomerPortalSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeCustomerId) {
      throw new BadRequestException('No active subscription found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.configService.get('FRONTEND_URL')}/dashboard`,
    });

    return {
      url: session.url,
    };
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return { message: 'Subscription will be cancelled at period end' };
  }

  async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    const planName = subscription.metadata.planName;

    if (!userId || !planName) {
      console.error('Missing metadata in subscription');
      return;
    }

    const plan = await this.prisma.plan.findUnique({
      where: { name: planName },
    });

    if (!plan) {
      console.error('Plan not found');
      return;
    }

    const role = planName as UserRole;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        role,
        seoCredits: plan.monthlySeoCredits,
        reelCredits: plan.monthlyReelCredits,
      },
    });

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planType: role,
        status: 'ACTIVE',
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        stripeProductId: subscription.items.data[0].price.product as string,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        monthlySeoCredits: plan.monthlySeoCredits,
        monthlyReelCredits: plan.monthlyReelCredits,
      },
      update: {
        planType: role,
        status: 'ACTIVE',
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        stripeProductId: subscription.items.data[0].price.product as string,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        monthlySeoCredits: plan.monthlySeoCredits,
        monthlyReelCredits: plan.monthlyReelCredits,
      },
    });
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const existingSub = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!existingSub) {
      return;
    }

    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status.toUpperCase() as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const existingSub = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!existingSub) {
      return;
    }

    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELLED',
      },
    });

    await this.prisma.user.update({
      where: { id: existingSub.userId },
      data: {
        role: UserRole.FREE,
        seoCredits: 0,
        reelCredits: 0,
      },
    });
  }

  async handleInvoicePaid(invoice: Stripe.Invoice) {
    if (!invoice.subscription) {
      return;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
      include: { user: true },
    });

    if (!subscription) {
      return;
    }

    // Renew credits
    await this.prisma.user.update({
      where: { id: subscription.userId },
      data: {
        seoCredits: subscription.monthlySeoCredits,
        reelCredits: subscription.monthlyReelCredits,
      },
    });

    // Log payment
    await this.prisma.payment.create({
      data: {
        userId: subscription.userId,
        stripePaymentId: invoice.payment_intent as string,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency,
        status: 'succeeded',
        description: `Subscription payment for ${subscription.planType}`,
      },
    });
  }
}

