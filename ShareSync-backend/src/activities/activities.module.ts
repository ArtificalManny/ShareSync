// src/activities/activities.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

import { RealtimeModule } from '../realtime/realtime.module';
import { NotifyModule } from '../notifications/notify.module';

import { ActivitySchema } from './schemas/activity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Activity', schema: ActivitySchema }]),
    forwardRef(() => RealtimeModule),
    NotifyModule, // <-- ensure this is the relative path to the module you just added
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}