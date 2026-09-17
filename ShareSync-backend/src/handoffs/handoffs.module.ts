import {
  Module,
} from '@nestjs/common';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  ModerationModule,
} from '../moderation/moderation.module';

import {
  NotificationsModule,
} from '../notifications/notifications.module';

import {
  ProjectsModule,
} from '../projects/projects.module';

import {
  TasksModule,
} from '../tasks/tasks.module';

import {
  HandoffsController,
} from './handoffs.controller';

import {
  HandoffsService,
} from './handoffs.service';

import {
  Handoff,
  HandoffSchema,
} from './schemas/handoff.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Handoff.name,
        schema: HandoffSchema,
      },
    ]),

    ProjectsModule,
    TasksModule,
    ModerationModule,
    NotificationsModule,
  ],

  controllers: [
    HandoffsController,
  ],

  providers: [
    HandoffsService,
  ],

  exports: [
    HandoffsService,
  ],
})
export class HandoffsModule {}
