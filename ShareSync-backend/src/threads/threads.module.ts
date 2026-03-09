// src/threads/threads.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Thread, ThreadSchema } from './schemas/thread.schema';
import { ThreadMessage, ThreadMessageSchema } from './schemas/thread-message.schema';
import { ThreadsService } from './threads.service';
import { ThreadsController } from './threads.controller';
import { ProjectsModule } from '../projects/projects.module';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Thread.name, schema: ThreadSchema },
      { name: ThreadMessage.name, schema: ThreadMessageSchema },
    ]),
    forwardRef(() => ProjectsModule),
    ModerationModule,
  ],
  controllers: [ThreadsController],
  providers: [ThreadsService],
  exports: [ThreadsService],
})
export class ThreadsModule {}
