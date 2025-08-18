// src/activities/activities.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { RealtimeModule } from '../realtime/realtime.module';

import { ActivitySchema } from './schemas/activity.schema';

@Module({
  imports: [
    RealtimeModule,
    MongooseModule.forFeature([
      { name: 'Activity', schema: ActivitySchema },
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
