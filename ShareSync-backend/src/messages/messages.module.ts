// src/messages/messages.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES MODULE
// ⭐ PHASE 2A: Removed MessagesGateway (using global AppGateway instead)
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Message, MessageSchema } from './schemas/message.schema';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

// Note: We no longer need MessagesGateway here because:
// 1. GatewayModule is global and provides AppGateway everywhere
// 2. MessagesService injects AppGateway directly for real-time emissions
// If you have a separate MessagesGateway for message-specific socket events,
// you can uncomment the import and add it back to providers/exports

// import { MessagesGateway } from './messages.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'dev_secret'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
  ],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    // MessagesGateway, // ⭐ Commented out - using global AppGateway instead
  ],
  exports: [
    MessagesService,
    // MessagesGateway, // ⭐ Commented out - using global AppGateway instead
  ],
})
export class MessagesModule {}
