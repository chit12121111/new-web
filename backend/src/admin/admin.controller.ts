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

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
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
