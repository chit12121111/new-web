import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContentsService } from './contents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ContentType } from '@prisma/client';

@Controller('contents')
@UseGuards(JwtAuthGuard)
export class ContentsController {
  constructor(private contentsService: ContentsService) {}

  @Get()
  async getUserContents(
    @CurrentUser() user: any,
    @Query('type') type?: ContentType,
  ) {
    return this.contentsService.getUserContents(user.id, type);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    return this.contentsService.getContentStats(user.id);
  }

  @Get(':id')
  async getContentById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contentsService.getContentById(id, user.id);
  }

  @Delete(':id')
  async deleteContent(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contentsService.deleteContent(id, user.id);
  }
}

