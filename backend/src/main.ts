import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
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
  const app = await NestFactory.create(AppModule);

  // Enable CORS - Allow all origins for Ngrok/public access
  app.enableCors({
    origin: true, // Allow all origins (for Ngrok/public access)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
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

