// src/main.ts
import * as dotenv from 'dotenv/config';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // CORS for HTTP + WebSocket
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

  app.useStaticAssets(join(__dirname, '..', 'uploads'));

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`[Nest] API running at http://localhost:${port}`);
}

bootstrap();