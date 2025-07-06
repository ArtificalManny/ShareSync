// src/main.ts
import * as dotenv from 'dotenv/config'
import { join }            from 'path'
import { NestFactory }     from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule }       from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:54693', // exact origin of frontend
    credentials: true, // if using cookies, optional for headers
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(3000);
}
bootstrap()