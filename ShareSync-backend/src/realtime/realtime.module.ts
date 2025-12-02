/**
 * realtime.module.ts
 * Module for all real-time features (cursors, presence, live updates)
 * 
 * Updated with:
 * - MongoDB schemas (Cursor, Presence)
 * - REST controllers (CursorController, PresenceController)
 * - WebSocket gateway
 * - Services
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

// ============================================
// SCHEMAS
// ============================================
import { Cursor, CursorSchema } from './schemas/cursor.schema';
import { Presence, PresenceSchema } from './schemas/presence.schema';

// ============================================
// CONTROLLERS
// ============================================
import { CursorController } from './cursor.controller';
import { PresenceController } from './presence.controller';

// ============================================
// GATEWAYS & SERVICES
// ============================================
import { CursorGateway } from './cursor.gateway';
import { CursorService } from './cursor.service';
import { PresenceService } from './presence.service';

// ============================================
// GUARDS
// ============================================
import { WsJwtGuard } from '../auth/ws-jwt.guard';

@Module({
  imports: [
    // JWT module for WebSocket authentication
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev_secret_change_me',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
    }),
    
    // MongoDB schemas for data persistence
    MongooseModule.forFeature([
      { name: Cursor.name, schema: CursorSchema },
      { name: Presence.name, schema: PresenceSchema },
    ]),
  ],
  
  // REST API Controllers
  controllers: [
    CursorController,
    PresenceController,
  ],
  
  // WebSocket Gateways & Services
  providers: [
    CursorGateway,
    CursorService,
    PresenceService,
    WsJwtGuard,
  ],
  
  // Export services for use in other modules
  exports: [
    CursorService,
    PresenceService,
    MongooseModule, // Export for other modules to access schemas
  ],
})
export class RealtimeModule {}