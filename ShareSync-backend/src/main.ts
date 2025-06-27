// src/main.ts
import { NestFactory }            from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule }              from './app.module';
import { join }                   from 'path';

async function bootstrap() {
  // ← tell Nest we want the Express‐specific app type
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api');

  // only now call useStaticAssets
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  await app.listen(3000);
}
bootstrap();
