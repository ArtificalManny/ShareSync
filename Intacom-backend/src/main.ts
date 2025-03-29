import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    await app.listen(3007); // Changed from 3006 to 3007
    console.log('Server running on port 3007');
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1);
  }
}
bootstrap();