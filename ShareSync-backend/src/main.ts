// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule }   from './app.module';
import { join }        from 'path';
import * as express    from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // allow CORS from your Vite port:
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // everything in Nest now lives under /api
  app.setGlobalPrefix('api');

  await app.listen(3000);
}
bootstrap();

