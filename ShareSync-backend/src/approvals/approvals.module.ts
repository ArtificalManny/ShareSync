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
  Approval,
  ApprovalSchema,
} from './schemas/approval.schema';

import {
  ApprovalsController,
} from './approvals.controller';

import {
  ApprovalsService,
} from './approvals.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Approval.name,
        schema: ApprovalSchema,
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
    ApprovalsController,
  ],

  providers: [
    ApprovalsService,
  ],

  exports: [
    ApprovalsService,
  ],
})
export class ApprovalsModule {}
