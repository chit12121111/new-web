import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // User Management
  async getAllUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        contents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserCredits(
    userId: string,
    seoCredits?: number,
    reelCredits?: number,
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(seoCredits !== undefined && { seoCredits }),
        ...(reelCredits !== undefined && { reelCredits }),
      },
    });

    return user;
  }

  async updateUserRole(userId: string, role: UserRole) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return user;
  }

  async deleteUser(userId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }

  // Plan Management
  async getAllPlans() {
    return this.prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updatePlan(planId: string, data: any) {
    return this.prisma.plan.update({
      where: { id: planId },
      data,
    });
  }

  // Content Management
  async getAllContents(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.content.count(),
    ]);

    return {
      contents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteContent(contentId: string) {
    await this.prisma.content.delete({
      where: { id: contentId },
    });

    return { message: 'Content deleted successfully' };
  }

  // Payment & Billing Reports
  async getPaymentReports(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [payments, totalRevenue, paymentCount] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.payment.aggregate({
        where: { ...where, status: 'succeeded' },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments,
      totalRevenue: totalRevenue._sum.amount || 0,
      paymentCount,
    };
  }

  // Webhook Logs
  async getWebhookLogs(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhookLog.count(),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // AI Prompt Templates
  async getPromptTemplates() {
    return this.prisma.aIPromptTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });
  }

  async getPromptTemplateById(templateId: string) {
    return this.prisma.aIPromptTemplate.findUnique({
      where: { id: templateId },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });
  }

  async createPromptTemplate(data: {
    type: string;
    name: string;
    template: string;
    description?: string;
    thumbnail?: string;
    isPaid?: boolean;
    price?: number;
    priceType?: string;
    category?: string;
    tags?: string[];
    isActive?: boolean;
  }) {
    return this.prisma.aIPromptTemplate.create({
      data: {
        type: data.type as any,
        name: data.name,
        template: data.template,
        description: data.description,
        thumbnail: data.thumbnail,
        isPaid: data.isPaid ?? false,
        price: data.price ?? 0,
        priceType: data.priceType ?? 'credits',
        category: data.category,
        tags: data.tags ?? [],
        isActive: data.isActive ?? true,
      },
    });
  }

  async updatePromptTemplate(templateId: string, data: any) {
    return this.prisma.aIPromptTemplate.update({
      where: { id: templateId },
      data,
    });
  }

  async deletePromptTemplate(templateId: string) {
    return this.prisma.aIPromptTemplate.delete({
      where: { id: templateId },
    });
  }

  // Dashboard Stats
  async getDashboardStats() {
    const [
      totalUsers,
      activeSubscriptions,
      totalRevenue,
      totalContents,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'succeeded' },
        _sum: { amount: true },
      }),
      this.prisma.content.count(),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    return {
      totalUsers,
      activeSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalContents,
      usersByRole,
      recentUsers,
    };
  }
}

