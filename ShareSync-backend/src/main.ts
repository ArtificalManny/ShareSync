// src/main.ts
import * as dotenv from 'dotenv/config';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Single, global "/api" prefix for every controller
  app.setGlobalPrefix('api');

  // CORS for your Vite dev server
  app.enableCors({
    origin: 'http://localhost:54693',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Static uploads (if you use them)
  app.useStaticAssets(join(__dirname, '..', 'uploads'));

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`[Nest] API running at http://localhost:${port}`);
}

bootstrap();