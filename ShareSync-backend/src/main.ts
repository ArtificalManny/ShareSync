// src/main.ts
import * as dotenv from 'dotenv/config';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common'; // NEW
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // All routes will be under /api (e.g. /api/auth/register)
  app.setGlobalPrefix('api');

  // CORS for HTTP + WebSocket (Your existing config)
  app.enableCors({
    origin: [
      'http://localhost:54693',
      'http://localhost:5173',
      'http://localhost:4173',
    ],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  });

  // NEW: Global validation pipe (automatically validate DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  // Serve static files (uploads, etc.)
  app.useStaticAssets(join(__dirname, '..', 'uploads'));

  const port = process.env.PORT ? Number(process.env.PORT) : 5050; // Use your port
  await app.listen(port);
  console.log(`[Nest] API running at http://localhost:${port}`);
}

bootstrap();