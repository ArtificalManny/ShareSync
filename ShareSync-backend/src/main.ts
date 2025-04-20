import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    
    // Global CORS configuration
    app.enableCors({
      origin: 'http://localhost:54693',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    });

    const port = 3001;
    await app.listen(port);
    console.log(`Backend server running on http://localhost:${port}`);
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}
bootstrap();