import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GenerateContentDto } from './dto/generate-content.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate-image')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async generateImage(
    @CurrentUser() user: any,
    @Body() dto: GenerateContentDto,
  ) {
    return this.aiService.generateImage(user.id, dto.topic);
  }

  @Post('generate-video')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async generateVideo(
    @CurrentUser() user: any,
    @Body() dto: GenerateContentDto,
  ) {
    return this.aiService.generateVideo(user.id, dto.topic);
  }
}

