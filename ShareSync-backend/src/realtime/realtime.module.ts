/**
 * realtime.module.ts
 * Module for all real-time features (cursors, presence, live updates)
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CursorGateway } from './cursor.gateway';
import { CursorService } from './cursor.service';
import { PresenceService } from './presence.service';
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
    
    // Add MongooseModule.forFeature() when you create schemas
    // MongooseModule.forFeature([
    //   { name: 'CursorPosition', schema: CursorPositionSchema },
    //   { name: 'CursorSession', schema: CursorSessionSchema },
    //   { name: 'UserPresence', schema: UserPresenceSchema },
    // ]),
  ],
  providers: [
    CursorGateway,
    CursorService,
    PresenceService,
    WsJwtGuard,
  ],
  exports: [
    CursorService,
    PresenceService,
  ],
})
export class RealtimeModule {}