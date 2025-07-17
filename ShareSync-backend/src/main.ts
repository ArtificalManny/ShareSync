// src/main.ts
import * as dotenv from 'dotenv/config'
import { join } from 'path'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api'); // ✅ REQUIRED: enables /api/projects, /api/auth, etc.

  app.enableCors({
    origin: 'http://localhost:54693', // exact origin of frontend
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads')); // ✅ if serving profile pics
  await app.listen(3000);
}
bootstrap();