import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for the frontend origin
  app.use(cors({
    origin: 'http://localhost:54693',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  console.log('MONGODB_URI in main.ts:', 'mongodb+srv://ClusterZero:NR8P0FLTk0JWLA@cluster0.z7xm8.mongodb.net/sharesync?retryWrites=true&w=majority&appName=Cluster0');
  await app.listen(3000);
}
bootstrap();