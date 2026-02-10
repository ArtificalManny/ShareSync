import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThreadMessage, ThreadMessageSchema } from './schemas/thread-message.schema';
import { ThreadMessagesService } from './thread-messages.service';
import { ThreadMessagesController } from './thread-messages.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ThreadMessage.name, schema: ThreadMessageSchema },
    ]),
  ],
  controllers: [ThreadMessagesController],
  providers: [ThreadMessagesService],
  exports: [ThreadMessagesService],
})
export class ThreadMessagesModule {}
