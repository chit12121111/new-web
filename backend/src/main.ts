import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { existsSync } from 'fs';

// Load .env file explicitly - try multiple paths
const envPaths = [
  path.join(__dirname, '../.env'),           // From dist folder
  path.join(process.cwd(), '.env'),          // From current working directory
  path.join(process.cwd(), 'backend/.env'),  // From root, looking in backend
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    console.log(`📄 Loading .env from: ${envPath}`);
    dotenv.config({ path: envPath });
    break;
  }
}

// Also try default location
dotenv.config();

async function bootstrap() {
  // Validate required environment variables
  const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
  const missingVars: string[] = [];
  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('Please set these variables in Railway → Settings → Variables');
    // Don't exit - let the app start and show errors in logs
  } else {
    console.log('✅ All required environment variables are set');
  }

  const app = await NestFactory.create(AppModule);

  // Enable CORS - Allow all origins for Ngrok/public access
  app.enableCors({
    origin: true, // Allow all origins (for Ngrok/public access)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global exception filter for better error handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) =>
          Object.values(error.constraints || {}).join(', '),
        );
        return new HttpException(
          { message: messages.join('; ') },
          HttpStatus.BAD_REQUEST,
        );
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  // Debug: Show loaded env vars
  console.log(`🔍 GOOGLE_GEMINI_API_KEY loaded: ${process.env.GOOGLE_GEMINI_API_KEY ? 'YES' : 'NO'}`);
  
  console.log(`🚀 Backend is running on: http://localhost:${port}`);
  console.log(`📚 API endpoint: http://localhost:${port}/api`);
}

bootstrap();

