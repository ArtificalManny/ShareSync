// /src/activities/activities.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

import { RealtimeModule } from '../realtime/realtime.module';

// Use the dedicated Activity schema file you created
import { ActivitySchema } from './schemas/activity.schema';

@Module({
  imports: [
    // Keep the model name 'Activity' to match InjectModel('Activity') in the service
    MongooseModule.forFeature([{ name: 'Activity', schema: ActivitySchema }]),
    forwardRef(() => RealtimeModule),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}