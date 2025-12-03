import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-subscription')
  async getMySubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.getUserSubscription(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckoutSession(
    @CurrentUser() user: any,
    @Body() body: { planName: string },
  ) {
    return this.subscriptionsService.createCheckoutSession(user.id, body.planName);
  }

  @UseGuards(JwtAuthGuard)
  @Post('portal')
  async createCustomerPortalSession(@CurrentUser() user: any) {
    return this.subscriptionsService.createCustomerPortalSession(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  async cancelSubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.cancelSubscription(user.id);
  }
}

