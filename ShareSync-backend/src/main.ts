import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as cors from 'cors';
import * as path from 'path';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cors({
    origin: 'http://localhost:54693',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  }));
  app.useGlobalPipes(new ValidationPipe());
  app.use((req, res, next) => {
    res.header('Content-Type', 'application/json');
    next();
  });
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
  await app.listen(3000);
}
bootstrap();