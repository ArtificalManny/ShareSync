import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with credentials
  app.enableCors({
    origin: 'http://localhost:54693',
    credentials: true,
  });

  // Enable body-parser middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Enable cookie-parser middleware
  app.use(cookieParser());

  // Log incoming requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log('Middleware: Incoming request:', req.method, req.url, 'Body:', req.body);
    next();
  });

  // JWT Middleware
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    console.log('JWT Middleware: Processing request for', req.path);
    const jwtService = app.get(JwtService);
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (req.path === '/auth/login' || req.path === '/auth/register' || req.path === '/auth/forgot-password' || req.path === '/auth/reset-password') {
      console.log('JWT Middleware: Skipping authentication for', req.path);
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