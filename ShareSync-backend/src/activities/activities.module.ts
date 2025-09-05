// src/activities/activities.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { Activity, ActivitySchema } from './schemas/activity.schema';

import { ProjectModule } from '../projects/project.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotifyModule } from '../notifications/notify.module';  // <-- your renamed module

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Activity.name, schema: ActivitySchema }]),
    forwardRef(() => ProjectModule),   // for ProjectPermissionGuard / ProjectsService
    RealtimeModule,                    // <-- gives us RealtimeGateway
    NotifyModule,                      // <-- gives us NotifyService
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}