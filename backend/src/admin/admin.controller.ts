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

  // Users
  @Get('users')
  async getAllUsers(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ) {
    return this.adminService.getAllUsers(page, limit);
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id/credits')
  async updateUserCredits(
    @Param('id') id: string,
    @Body() body: { seoCredits?: number; reelCredits?: number },
  ) {
    return this.adminService.updateUserCredits(
      id,
      body.seoCredits,
      body.reelCredits,
    );
  }

  @Put('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: UserRole },
  ) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // Plans
  @Get('plans')
  async getAllPlans() {
    return this.adminService.getAllPlans();
  }

  @Put('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updatePlan(id, data);
  }

  // Contents
  @Get('contents')
  async getAllContents(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ) {
    return this.adminService.getAllContents(page, limit);
  }

  @Delete('contents/:id')
  async deleteContent(@Param('id') id: string) {
    return this.adminService.deleteContent(id);
  }

  // Payments
  @Get('payments')
  async getPaymentReports(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getPaymentReports(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // Webhooks
  @Get('webhooks')
  async getWebhookLogs(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    return this.adminService.getWebhookLogs(page, limit);
  }

  // AI Templates
  @Get('templates')
  async getPromptTemplates() {
    return this.adminService.getPromptTemplates();
  }

  @Get('templates/:id')
  async getPromptTemplateById(@Param('id') id: string) {
    return this.adminService.getPromptTemplateById(id);
  }

  @Post('templates')
  async createPromptTemplate(@Body() data: any) {
    return this.adminService.createPromptTemplate(data);
  }

  @Put('templates/:id')
  async updatePromptTemplate(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updatePromptTemplate(id, data);
  }

  @Delete('templates/:id')
  async deletePromptTemplate(@Param('id') id: string) {
    return this.adminService.deletePromptTemplate(id);
  }
}

