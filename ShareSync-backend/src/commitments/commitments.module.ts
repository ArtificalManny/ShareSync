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
  ProjectsModule,
} from '../projects/projects.module';

import {
  Task,
  TaskSchema,
} from '../tasks/schemas/task.schema';

import {
  Commitment,
  CommitmentSchema,
} from './schemas/commitment.schema';

import {
  CommitmentsController,
} from './commitments.controller';

import {
  CommitmentsService,
} from './commitments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Commitment.name,
        schema: CommitmentSchema,
      },
      {
        name: Task.name,
        schema: TaskSchema,
      },
    ]),

    ProjectsModule,
    ModerationModule,
  ],

  controllers: [
    CommitmentsController,
  ],

  providers: [
    CommitmentsService,
  ],

  exports: [
    CommitmentsService,
  ],
})
export class CommitmentsModule {}
