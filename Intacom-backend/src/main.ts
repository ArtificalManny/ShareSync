import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    await app.listen(3001); // Changed from 3000 to 3001
    console.log('Server running on port 3001');
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1);
  }
}
bootstrap();