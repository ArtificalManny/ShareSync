import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config(); // Load .env file
  console.log('Loaded MONGODB_URI:', process.env.MONGODB_URI); // Debug log
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT || 3000); // Use PORT from .env or default to 3000
}
bootstrap();