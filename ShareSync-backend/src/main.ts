// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule }   from './app.module';
import { join }        from 'path';
import * as express    from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ← add this:
  app.enableCors({
    origin: true,           // allow all origins (or replace `true` with an array of allowed URLs)
    credentials: true,      // if you ever use cookies
  });

  await app.listen(3000);
}
bootstrap();

