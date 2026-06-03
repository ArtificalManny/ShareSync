// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import { join } from 'path';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true,
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  // Serve uploaded files as static assets
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );

  const isProd = process.env.NODE_ENV === 'production';

  const normalizeOrigin = (value?: string | null) =>
    value ? value.trim().replace(/\/+$/, '') : '';

  const defaultCorsOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:54693',
    'https://openshare-frontend.onrender.com',
    'https://openshare.ca',
    'https://www.openshare.ca',
  ];

  const configuredCorsOrigins =
    configService.get<string>('CORS_ORIGINS') ||
    process.env.CORS_ORIGINS ||
    defaultCorsOrigins.join(',');

  const allowedList = configuredCorsOrigins
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  logger.log(`CORS allowed origins: ${allowedList.join(', ')}`);

  app.enableCors({
    origin: (origin, callback) => {
      const normalizedOrigin = normalizeOrigin(origin);

      if (!normalizedOrigin) {
        return callback(null, true);
      }

      const isLocalhost =
        /^http:\/\/localhost:\d+$/.test(normalizedOrigin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(normalizedOrigin);

      if (!isProd && isLocalhost) {
        return callback(null, true);
      }

      if (allowedList.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      logger.warn(`CORS blocked for origin: ${normalizedOrigin}`);

      // Important: do not throw here. Throwing causes Render preflight requests to return HTTP 500.
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      validationError: { target: false, value: false },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.useWebSocketAdapter(new IoAdapter(app));

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ShareSync API')
      .setDescription('ShareSync Project Management API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management')
      .addTag('Projects', 'Project management')
      .addTag('Tasks', 'Task management')
      .addTag('User Context', 'User context & session tracking')
      .addTag('Presence', 'Real-time presence')
      .addTag('Cursors', 'Real-time cursor tracking')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'method',
      },
    });

    logger.log('Swagger documentation available at /api/docs');
  }

  const port = configService.get<number>('PORT', 5050);
  await app.listen(port);

  logger.log(`🚀 ShareSync API running on http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔗 Health Check: http://localhost:${port}/api/health`);
  logger.log(`📁 Static uploads: http://localhost:${port}/uploads/`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
