/**
 * realtime.module.ts
 * Module for all real-time features (cursors, presence, focus sessions, live updates)
 * 
 * Includes:
 * - MongoDB schemas (Cursor, Presence, FocusSession)
 * - REST controllers (CursorController, PresenceController, FocusController)
 * - WebSocket gateways (CursorGateway, RealtimeGateway, FocusGateway)
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
import { FocusSession, FocusSessionSchema } from './schemas/focus-session.schema';

// ============================================
// CONTROLLERS
// ============================================
import { CursorController } from './cursor.controller';
import { PresenceController } from './presence.controller';
import { FocusController } from './focus.controller';

// ============================================
// GATEWAYS & SERVICES
// ============================================
import { CursorGateway } from './cursor.gateway';
import { CursorService } from './cursor.service';
import { PresenceService } from './presence.service';
import { FocusService } from './focus.service';
import { FocusGateway } from './focus.gateway';
import { RealtimeGateway } from './realtime.gateway';

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
      { name: FocusSession.name, schema: FocusSessionSchema },
    ]),
  ],
  
  // REST API Controllers
  controllers: [
    CursorController,
    PresenceController,
    FocusController,
  ],
  
  // WebSocket Gateways & Services
  providers: [
    CursorGateway,
    RealtimeGateway,
    FocusGateway,
    CursorService,
    PresenceService,
    FocusService,
    WsJwtGuard,
  ],
  
  // Export services & gateways for use in other modules
  exports: [
    CursorService,
    PresenceService,
    FocusService,
    RealtimeGateway,
    FocusGateway,
    MongooseModule,
  ],
})
export class RealtimeModule {}
