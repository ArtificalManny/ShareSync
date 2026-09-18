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
  Task,
  TaskSchema,
} from '../tasks/schemas/task.schema';

import {
  DecisionsController,
} from './decisions.controller';

import {
  DecisionsService,
} from './decisions.service';

import {
  Decision,
  DecisionSchema,
} from './schemas/decision.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Decision.name,
        schema: DecisionSchema,
      },
      {
        name: Task.name,
        schema: TaskSchema,
      },
    ]),

    ProjectsModule,
    ModerationModule,
    NotificationsModule,
  ],

  controllers: [
    DecisionsController,
  ],

  providers: [
    DecisionsService,
  ],

  exports: [
    DecisionsService,
  ],
})
export class DecisionsModule {}
