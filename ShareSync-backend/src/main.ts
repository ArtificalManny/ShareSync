import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with credentials
  app.enableCors({
    origin: 'http://localhost:54693',
    credentials: true,
  });

  // Enable cookie-parser middleware
  app.use(cookieParser());

  await app.listen(3001);
  console.log('Backend server running on http://localhost:3001');
}
bootstrap();