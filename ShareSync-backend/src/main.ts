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

  // CORS for your Vite/preview dev servers (and preflights)
  app.enableCors({
    origin: [
      'http://localhost:54693', // your Vite port
      'http://localhost:5173',  // common Vite default
      'http://localhost:4173',  // vite preview (Lighthouse)
    ],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,  // fine even with bearer tokens
    maxAge: 86400,
  });

  // Static uploads (if you use them)
  app.useStaticAssets(join(__dirname, '..', 'uploads'));

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[Nest] API running at http://localhost:${port}`);
}

bootstrap();
