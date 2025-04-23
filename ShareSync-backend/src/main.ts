import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module'; // Fixed import path
import * as dotenv from 'dotenv';

// Load environment variables as the very first step
dotenv.config({ path: '.env' });

async function bootstrap() {
  try {
    // Log the MONGODB_URI to verify it's loaded
    console.log('MONGODB_URI in main.ts:', process.env.MONGODB_URI);
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

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