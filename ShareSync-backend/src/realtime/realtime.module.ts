/**
 * realtime.module.ts
 * Module for all real-time features (cursors, presence, live updates)
 * 
 * Includes:
 * - MongoDB schemas (Cursor, Presence)
 * - REST controllers (CursorController, PresenceController)
 * - WebSocket gateways (CursorGateway, RealtimeGateway)
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
import { RealtimeGateway } from './realtime.gateway'; // ✅ NEW: import gateway

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
    RealtimeGateway,   // ✅ NEW: make gateway a provider
    CursorService,
    PresenceService,
    WsJwtGuard,
  ],
  
  // Export services & gateway for use in other modules
  exports: [
    CursorService,
    PresenceService,
    RealtimeGateway,   // ✅ NEW: export so FilesModule can inject it
    MongooseModule,    // (kept from your original)
  ],
})
export class RealtimeModule {}
