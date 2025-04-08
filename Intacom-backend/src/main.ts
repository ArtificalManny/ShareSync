import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function connectWithRetry() {
  let retries = 5;
  while (retries > 0) {
    try {
      console.log('Environment variables loaded:');
      console.log('MONGODB_URI:', process.env.MONGODB_URI);
      console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
      console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
      console.log('EMAIL_USER:', process.env.EMAIL_USER);
      console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
      console.log('S3_BUCKET:', process.env.S3_BUCKET);
      console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in the environment variables');
      }

      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connection successful');
      break;
    } catch (err) {
      console.error(`MongoDB connection attempt ${6 - retries} failed:`, err);
      retries -= 1;
      if (retries === 0) {
        throw err;
      }
      console.log('Retrying in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function bootstrap() {
  // Enable Mongoose debug logging
  mongoose.set('debug', true);

  // Connect to MongoDB with retry logic
  await connectWithRetry();

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap().catch(err => {
  console.error('Failed to start the application:', err);
  process.exit(1);
});