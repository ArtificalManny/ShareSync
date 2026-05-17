import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';

import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import {
  DirectMessage,
  DirectMessageSchema,
  MessageAttachment,
  MessageAttachmentSchema,
} from './schemas/direct-message.schema';

import { Message, MessageSchema } from '../message/message.schema';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    ModerationModule,
    JwtModule,
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: DirectMessage.name, schema: DirectMessageSchema },
      { name: Message.name, schema: MessageSchema },
      { name: MessageAttachment.name, schema: MessageAttachmentSchema },
    ]),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService],
})
export class MessagesModule {}
