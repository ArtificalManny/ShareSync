import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

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

  const app = await NestFactory.create(AppModule);

  // Enable CORS using NestJS's built-in method.
  // From "The Customer Service Revolution": Ensure a frictionless experience by resolving cross-origin issues.
  app.enableCors({
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:54693'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Add logging for all incoming requests to debug CORS.
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