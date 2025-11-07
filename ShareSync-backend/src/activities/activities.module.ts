// backend/src/activities/activities.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from './schemas/activity.schema';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { ProjectModule } from '../projects/project.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotifyModule } from '../notifications/notify.module';   // ← NEW

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Activity.name, schema: ActivitySchema }]),
    forwardRef(() => ProjectModule),
    forwardRef(() => RealtimeModule),
    forwardRef(() => NotifyModule),   // ← NEW (provides NotifyService)
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService, MongooseModule],
})
export class ActivitiesModule {}