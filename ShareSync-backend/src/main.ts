// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import { join, extname } from 'path';

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

  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Serve uploaded files as static assets.
  // Registered AFTER helmet so uploaded files carry its security headers, and with
  // a setHeaders hook so a stored HTML/SVG file cannot run as a page on the API
  // origin. Images are unaffected: browsers ignore Content-Disposition on <img>
  // loads, and a resource's own CSP does not govern how another page embeds it.
  // ─────────────────────────────────────────────────────────────────────────────
  const UPLOADS_NEVER_INLINE = new Set([
    '.html', '.htm', '.xhtml', '.shtml', '.htc',
    '.xml', '.svg', '.svgz',
    '.js', '.mjs', '.cjs', '.css',
  ]);
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res, filePath) => {
      // Never let the browser second-guess the declared Content-Type.
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // Make a directly-opened upload inert (no script, no same-origin, sandboxed).
      // Images and PDFs still render/download normally.
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      // Active-content types are forced to download instead of rendering inline.
      if (UPLOADS_NEVER_INLINE.has(extname(filePath).toLowerCase())) {
        res.setHeader('Content-Disposition', 'attachment');
      }
    },
  });

  // ✅ CORS: allow production OpenShare domains + localhost dev ports
  const configuredCorsOrigins = configService.get<string>('CORS_ORIGINS', '');

  const allowedList = Array.from(
    new Set(
      [
        'https://openshare.ca',
        'https://www.openshare.ca',
        'https://openshare-frontend.onrender.com',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:54693',
        ...configuredCorsOrigins
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ].filter(Boolean),
    ),
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isLocalhost =
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

      if (isLocalhost || allowedList.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(null, false);
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
    maxAge: 86400,
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
