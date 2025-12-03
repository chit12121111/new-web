import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private subscriptionsService: SubscriptionsService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async getUserPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Log webhook event
    await this.prisma.webhookLog.create({
      data: {
        eventType: event.type,
        eventId: event.id,
        payload: event as any,
        processed: false,
      },
    });

    try {
      // Handle different event types
      switch (event.type) {
        case 'customer.subscription.created':
          await this.subscriptionsService.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.updated':
          await this.subscriptionsService.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.deleted':
          await this.subscriptionsService.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'invoice.paid':
          await this.subscriptionsService.handleInvoicePaid(
            event.data.object as Stripe.Invoice,
          );
          break;

        case 'invoice.payment_failed':
          console.log('Payment failed:', event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Mark as processed
      await this.prisma.webhookLog.updateMany({
        where: { eventId: event.id },
        data: { processed: true },
      });

      return { received: true };
    } catch (error) {
      // Log error
      await this.prisma.webhookLog.updateMany({
        where: { eventId: event.id },
        data: {
          processed: false,
          error: error.message,
        },
      });

      throw error;
    }
  }
}

