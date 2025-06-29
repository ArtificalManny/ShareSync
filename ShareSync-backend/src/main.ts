// src/main.ts
import { NestFactory }              from '@nestjs/core';
import { NestExpressApplication }   from '@nestjs/platform-express';
 import { join }                     from 'path';
 import { AppModule }                from './app.module';

 async function bootstrap() {
 // tell Nest we want the Express-powered variant
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

   // serve any file in /uploads under http://localhost:3000/uploads/<filename>
   app.useStaticAssets(join(__dirname, '..', 'uploads'), {
     prefix: '/uploads',
   });

   app.enableCors({ origin: true, credentials: true });
   app.setGlobalPrefix('api');
   const port = process.env.PORT || 3000;
   await app.listen(port);
   console.log(`🚀 Running on http://localhost:${port}`);
 }
 bootstrap();
