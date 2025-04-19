import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with credentials
  app.enableCors({
    origin: 'http://localhost:54693',
    credentials: true,
  });

  // Enable body-parser middleware
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Enable cookie-parser middleware
  app.use(cookieParser());

  // Enable validation pipe
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Log incoming requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log('Middleware: Incoming request:', req.method, req.url, 'Body:', req.body);
    next();
  });

  await app.listen(3001);
  console.log('Backend server running on http://localhost:3001');
}
bootstrap();