// src/main.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join }            from 'path';
import { AppModule }       from './app.module';

async function bootstrap() {
 const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // serve your /uploads folder at /uploads/<filename>
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api');
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();