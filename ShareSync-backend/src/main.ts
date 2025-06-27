// src/main.ts
import { NestFactory }             from '@nestjs/core';
import { NestExpressApplication }  from '@nestjs/platform-express';
import { join }                    from 'path';
import { AppModule }               from './app.module';

async function bootstrap() {
  // tell Nest we want Express-specific methods
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // serve "/uploads" as static files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api');

  await app.listen(3000);
}
bootstrap();
