import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { AiModule } from './ai/ai.module';
import { ContentsModule } from './contents/contents.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env', './backend/.env'],
      ignoreEnvFile: false,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.AI_RATE_LIMIT_TTL || '60') * 1000,
        limit: parseInt(process.env.AI_RATE_LIMIT_MAX || '10'),
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    PaymentsModule,
    AiModule,
    ContentsModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}

