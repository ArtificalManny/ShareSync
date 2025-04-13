import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

dotenv.config();

async function connectWithRetry() {
  let retries = 5;
  while (retries > 0) {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI!, {});
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
  console.log('Environment variables loaded:');
  console.log('MONGODB_URI:', process.env.MONGODB_URI);
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
  console.log('S3_BUCKET:', process.env.S3_BUCKET);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:54693',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useStaticAssets(join(__dirname, '..', '..', 'ShareSync-frontend', 'dist'), {
    index: 'index.html',
    prefix: '/',
  });

  app.use((req: any, res: any, next: () => void) => {
    console.log('Backend: Request received:', req.method, req.url, 'from origin:', req.headers.origin);
    console.log('Backend: Response headers:', res.getHeaders());
    next();
  });

  app.setGlobalPrefix('auth');

  await connectWithRetry();

  let port = parseInt(process.env.PORT || '3000', 10);
  let currentPort = port;
  let serverStarted = false;

  while (!serverStarted && currentPort < 3100) {
    try {
      await app.listen(currentPort);
      console.log(`Backend server running on http://localhost:${currentPort}`);
      console.log('Serving frontend from:', join(__dirname, '..', '..', 'ShareSync-frontend', 'dist'));
      serverStarted = true;
    } catch (error: any) {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${currentPort} is in use, trying ${currentPort + 1}...`);
        currentPort++;
      } else {
        throw error;
      }
    }
  }

  if (!serverStarted) {
    throw new Error('Could not find an available port between 3000 and 3100');
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start the application:', err);
  process.exit(1);
});