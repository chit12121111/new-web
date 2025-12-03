import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentType } from '@prisma/client';

@Injectable()
export class ContentsService {
  constructor(private prisma: PrismaService) {}

  async getUserContents(userId: string, type?: ContentType) {
    return this.prisma.content.findMany({
      where: {
        userId,
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContentById(contentId: string, userId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (content.userId !== userId) {
      throw new ForbiddenException('You do not have access to this content');
    }

    return content;
  }

  async deleteContent(contentId: string, userId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (content.userId !== userId) {
      throw new ForbiddenException('You do not have access to this content');
    }

    await this.prisma.content.delete({
      where: { id: contentId },
    });

    return { message: 'Content deleted successfully' };
  }

  async getContentStats(userId: string) {
    const [totalContents, seoArticles, reelScripts] = await Promise.all([
      this.prisma.content.count({ where: { userId } }),
      this.prisma.content.count({
        where: { userId, type: ContentType.SEO_ARTICLE },
      }),
      this.prisma.content.count({
        where: { userId, type: ContentType.REEL_SCRIPT },
      }),
    ]);

    return {
      totalContents,
      seoArticles,
      reelScripts,
    };
  }
}

