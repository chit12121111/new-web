import { Controller, Get, Post, Delete, Body, UseGuards, Param, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { SaveApiKeyDto, VerifyApiKeyDto, TestModelDto, SaveSelectedModelDto } from './dto/api-key.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.id);
  }

  @Get('credits')
  async getCredits(@CurrentUser() user: any) {
    return this.usersService.getCredits(user.id);
  }

  @Get('api-keys')
  async getApiKeys(@CurrentUser() user: any) {
    return this.usersService.getApiKeys(user.id);
  }

  @Post('api-keys')
  async saveApiKey(
    @CurrentUser() user: any,
    @Body() dto: SaveApiKeyDto,
  ) {
    return this.usersService.saveApiKey(user.id, dto.type, dto.apiKey);
  }

  @Post('api-keys/verify')
  async verifyApiKey(@Body() dto: VerifyApiKeyDto) {
    return this.usersService.verifyApiKey(dto.type, dto.apiKey);
  }

  @Get('api-keys/models')
  async getAvailableModels(@CurrentUser() user: any) {
    return this.usersService.getAvailableModels(user.id);
  }

  @Post('api-keys/models/test')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async testModel(
    @CurrentUser() user: any,
    @Body() dto: TestModelDto,
  ) {
    return this.usersService.testModel(user.id, dto.type, dto.model);
  }

  @Post('api-keys/models/select')
  async saveSelectedModel(
    @CurrentUser() user: any,
    @Body() dto: SaveSelectedModelDto,
  ) {
    return this.usersService.saveSelectedModel(user.id, dto.type, dto.model);
  }

  @Delete('api-keys/:type')
  async deleteApiKey(
    @CurrentUser() user: any,
    @Param('type') type: string,
  ) {
    if (type !== 'google_gemini' && type !== 'openai' && type !== 'huggingface') {
      throw new BadRequestException('Invalid API key type');
    }
    return this.usersService.deleteApiKey(user.id, type as any);
  }

  @Get('templates')
  async getActiveTemplates(@CurrentUser() user: any) {
    return this.usersService.getActiveTemplates(user.id);
  }

  @Get('templates/store')
  async getStoreTemplates(@CurrentUser() user: any) {
    return this.usersService.getStoreTemplates(user.id);
  }

  @Post('templates/:id/purchase')
  async purchaseTemplate(
    @CurrentUser() user: any,
    @Param('id') templateId: string,
  ) {
    return this.usersService.purchaseTemplate(user.id, templateId);
  }

  @Get('templates/purchased')
  async getPurchasedTemplates(@CurrentUser() user: any) {
    return this.usersService.getPurchasedTemplates(user.id);
  }
}

