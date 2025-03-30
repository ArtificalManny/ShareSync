import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Ensure CORS is enabled for the frontend origin
  await app.listen(process.env.PORT || 3006);
  console.log(`Server running on port ${process.env.PORT || 3006}`);
}
bootstrap();