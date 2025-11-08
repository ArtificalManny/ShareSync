// backend/src/main.ts
import * as dotenv from 'dotenv/config';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // CORS – allow pre‑flight + credentials
  app.enableCors({
    origin: ['http://localhost:54693', 'http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads'));

  const port = 5000;
  try {
    await app.listen(port);
    console.log(`[Nest] API listening on http://localhost:${port}`);
  } catch (err: any) {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Nest] Port ${port} in use. Trying ${port + 1}...`);
      await app.listen(port + 1);
      console.log(`[Nest] API listening on http://localhost:${port + 1}`);
    } else {
      throw err;
    }
  }
}

bootstrap();