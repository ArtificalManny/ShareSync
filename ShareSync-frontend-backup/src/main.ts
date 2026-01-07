// src/main.ts
import { config as loadEnv } from 'dotenv';
loadEnv();

import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // All routes under /api (e.g. /api/auth/login)
  app.setGlobalPrefix('api');

  const isProd = process.env.NODE_ENV === 'production';

  // In dev: allow any localhost origin (Vite port changes won't break you)
  app.enableCors({
    origin: isProd ? ['https://your-domain.com'] : true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'));

  // Prefer APP_PORT (from .env), fallback to PORT (for hosts like Render/Heroku), then 5050
  const port = Number(process.env.APP_PORT || process.env.PORT || 5050);

  await app.listen(port);
  console.log(`[Nest] API running at http://localhost:${port}`);
}

bootstrap();
