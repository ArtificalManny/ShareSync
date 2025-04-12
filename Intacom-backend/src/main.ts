import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

// From "The Effortless Experience": Ensure seamless integration between frontend and backend.
dotenv.config();

async function connectWithRetry() {
  let retries = 5;
  while (retries > 0) {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI!, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      } as mongoose.ConnectOptions);
      console.log('MongoDB connection successful');
      break;
    } catch (err) {
      console.error(`MongoDB connection attempt ${6 - retries} failed:`, err);
      retries -= 1;
      if (retries === 0) {
        throw err;
      }
      console.log('Retrying in 5 seconds...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function bootstrap() {
  // Load environment variables for debugging.
  console.log('Environment variables loaded:');
  console.log('MONGODB_URI:', process.env.MONGODB_URI);
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
  console.log('S3_BUCKET:', process.env.S3_BUCKET);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from the frontend dist folder.
  app.useStaticAssets(join(__dirname, '..', '..', 'Intacom-frontend', 'dist'), {
    index: 'index.html',
    prefix: '/',
  });

  // Add logging for all incoming requests.
  app.use((req: any, res: any, next: () => void) => {
    console.log('Request received:', req.method, req.url, 'from origin:', req.headers.origin);
    console.log('Response headers:', res.getHeaders());
    next();
  });

  await connectWithRetry();

  await app.listen(3000);
  console.log('Backend server running on http://localhost:3000');
}

bootstrap().catch((err) => {
  console.error('Failed to start the application:', err);
  process.exit(1);
});