import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with credentials
  app.enableCors({
    origin: 'http://localhost:54693',
    credentials: true,
  });

  // Enable cookie-parser middleware
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // JWT Middleware
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const jwtService = app.get(JwtService);
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (req.path === '/auth/login' || req.path === '/auth/register' || req.path === '/auth/forgot-password' || req.path === '/auth/reset-password') {
      return next();
    }
    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized: No token provided' });
    }
    try {
      const payload = jwtService.verify(token);
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid token' });
    }
  });

  await app.listen(3001);
  console.log('Backend server running on http://localhost:3001');
}
bootstrap();