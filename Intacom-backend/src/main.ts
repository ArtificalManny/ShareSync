import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    await app.listen(3005); // Changed from 3004 to 3005
    console.log('Server running on port 3005');
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1);
  }
}
bootstrap();