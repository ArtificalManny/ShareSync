import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThreadMessage, ThreadMessageSchema } from './schemas/thread-message.schema';
import { ThreadMessagesService } from './thread-messages.service';
import { ThreadMessagesController } from './thread-messages.controller';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ThreadMessage.name, schema: ThreadMessageSchema },
    ]),
    ModerationModule,
  ],
  controllers: [ThreadMessagesController],
  providers: [ThreadMessagesService],
  exports: [ThreadMessagesService],
})
export class ThreadMessagesModule {}
