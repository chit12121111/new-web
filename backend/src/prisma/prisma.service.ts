import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Retry connection with exponential backoff
    const maxRetries = 5;
    const baseDelay = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('✅ Database connected successfully');
        return;
      } catch (error: any) {
        this.logger.error(
          `❌ Database connection attempt ${attempt}/${maxRetries} failed: ${error.message}`
        );
        
        if (attempt === maxRetries) {
          this.logger.error('❌ Failed to connect to database after all retries');
          this.logger.error('Please check:');
          this.logger.error('1. DATABASE_URL is correctly set in Railway');
          this.logger.error('2. Supabase database is running and accessible');
          this.logger.error('3. Network restrictions allow Railway IPs');
          this.logger.error('4. SSL parameters are included in DATABASE_URL (?sslmode=require)');
          // Don't throw - let the app start and retry later
          return;
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.logger.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

