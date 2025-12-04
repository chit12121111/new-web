import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // Dashboard
  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // Users Management
  @Get('users')
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.adminService.getAllUsers(parseInt(page), parseInt(limit));
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() updateData: any) {
    return this.adminService.updateUserRole(id, updateData.role);
  }

  @Put('users/:id/credits')
  async updateUserCredits(
    @Param('id') id: string,
    @Body() body: { seoCredits?: number; reelCredits?: number },
  ) {
    return this.adminService.updateUserCredits(id, body.seoCredits, body.reelCredits);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('users/:id/reset-password')
  async resetUserPassword(
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    return this.adminService.resetUserPassword(id, body.password);
  }

  // Plans Management
  @Get('plans')
  async getPlans() {
    return this.adminService.getAllPlans();
  }

  @Put('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() planData: any) {
    return this.adminService.updatePlan(id, planData);
  }

  // Content Management
  @Get('contents')
  async getContents(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.adminService.getAllContents(parseInt(page), parseInt(limit));
  }

  @Delete('contents/:id')
  async deleteContent(@Param('id') id: string) {
    return this.adminService.deleteContent(id);
  }

  // Payments Management
  @Get('payments')
  async getPayments(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.adminService.getPaymentReports(start, end);
  }

  // Webhook Logs
  @Get('webhooks')
  async getWebhooks(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.adminService.getWebhookLogs(parseInt(page), parseInt(limit));
  }

  // Templates Management
  @Get('templates')
  async getTemplates() {
    return this.adminService.getPromptTemplates();
  }

  @Get('templates/:id')
  async getTemplateById(@Param('id') id: string) {
    return this.adminService.getPromptTemplateById(id);
  }

  @Post('templates')
  async createTemplate(@Body() templateData: any) {
    return this.adminService.createPromptTemplate(templateData);
  }

  @Put('templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() templateData: any) {
    return this.adminService.updatePromptTemplate(id, templateData);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return this.adminService.deletePromptTemplate(id);
  }

  // Seed Data (No auth required for initial setup)
  @Post('seed')
  async seedData() {
    return this.adminService.seedData();
  }
}

// Public seed endpoint (no auth required)
@Controller('setup')
export class SetupController {
  constructor(private adminService: AdminService) {}

  @Post('seed')
  async seedData() {
    return this.adminService.seedData();
  }
}
