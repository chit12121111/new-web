import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Log DATABASE_URL info (without password) for debugging
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const url = new URL(dbUrl);
        const hostInfo = `${url.protocol}//${url.username}@${url.hostname}:${url.port || '5432'}${url.pathname}`;
        this.logger.log(`🔗 Connecting to database: ${hostInfo}`);
        
        // Check if using internal Railway hostname (may not work)
        if (url.hostname.includes('railway.internal')) {
          this.logger.warn('⚠️  WARNING: Using Railway internal hostname. This may not work.');
          this.logger.warn('   If using Railway PostgreSQL, use the public DATABASE_URL from Railway Variables.');
          this.logger.warn('   If using Supabase, use the connection string from Supabase Settings → Database.');
        }
      } catch (e) {
        this.logger.warn('⚠️  Could not parse DATABASE_URL format');
      }
    } else {
      this.logger.error('❌ DATABASE_URL environment variable is not set!');
      return;
    }

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
          this.logger.error('');
          this.logger.error('🔧 Troubleshooting steps:');
          this.logger.error('1. Check DATABASE_URL in Railway → Settings → Variables');
          this.logger.error('2. If using Railway PostgreSQL: Use the DATABASE_URL from Railway Variables (not internal hostname)');
          this.logger.error('3. If using Supabase: Use connection string from Supabase Settings → Database');
          this.logger.error('4. Ensure SSL is enabled: Add ?sslmode=require to DATABASE_URL (for Supabase)');
          this.logger.error('5. Check that database service is running and accessible');
          this.logger.error('6. Verify network/firewall settings allow connections');
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

