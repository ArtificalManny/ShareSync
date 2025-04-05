import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function bootstrap() {
  console.log('MONGODB_URI in main.ts:', process.env.MONGODB_URI);
  console.log('Connecting to MongoDB...');

  // Set Mongoose debug mode to true for detailed logging
  mongoose.set('debug', true);

  // Retry connection on failure
  const connectWithRetry = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
      try {
        if (!process.env.MONGODB_URI) {
          throw new Error('MONGODB_URI is not defined in environment variables');
        }
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log('MongoDB connection successful');
        break;
      } catch (err) {
        console.error(`MongoDB connection attempt ${i + 1} failed:`, err);
        if (i < retries - 1) {
          console.log(`Retrying in ${delay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw err;
        }
      }
    }
  };

  try {
    await connectWithRetry();
  } catch (err) {
    console.error('Failed to connect to MongoDB after retries:', err);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();