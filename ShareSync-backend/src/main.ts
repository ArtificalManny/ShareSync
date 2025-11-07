// backend/src/main.ts
import * as dotenv from 'dotenv/config';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { Server } from 'socket.io';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ['http://localhost:54693', 'http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads'));

  const port = process.env.PORT ? Number(process.env.PORT) : 5000;
  const httpServer = await app.listen(port);
  console.log(`[Nest] API listening on http://localhost:${port}`);

  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: 'http://localhost:54693',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  if (process.env.REDIS_URL) {
    try {
      const { createAdapter } = await import('@socket.io/redis-adapter');
      const { createClient } = await import('redis');
      const pub = createClient({ url: process.env.REDIS_URL });
      const sub = pub.duplicate();
      await Promise.all([pub.connect(), sub.connect()]);
      io.adapter(createAdapter(pub, sub));
      console.log('[WebSocket] Redis adapter enabled');
    } catch (e) {
      console.warn('[WebSocket] Redis not available – using in‑memory', e);
    }
  }

  // Get gateway using string token
  const realtimeGateway = app.get('REALTIME_GATEWAY');
  realtimeGateway.setServer(io);
}

bootstrap();