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
  AsyncCheckInsController,
} from './async-check-ins.controller';

import {
  AsyncCheckInsService,
} from './async-check-ins.service';

import {
  AsyncCheckIn,
  AsyncCheckInSchema,
} from './schemas/async-check-in.schema';

import {
  AsyncCheckInResponse,
  AsyncCheckInResponseSchema,
} from './schemas/async-check-in-response.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AsyncCheckIn.name,
        schema: AsyncCheckInSchema,
      },
      {
        name: AsyncCheckInResponse.name,
        schema:
          AsyncCheckInResponseSchema,
      },
    ]),

    ProjectsModule,
    ModerationModule,
  ],

  controllers: [
    AsyncCheckInsController,
  ],

  providers: [
    AsyncCheckInsService,
  ],

  exports: [
    AsyncCheckInsService,
  ],
})
export class AsyncCheckInsModule {}
