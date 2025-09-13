import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';
import {
  HabitsPrefs, HabitsPrefsSchema,
  Reflection, ReflectionSchema,
  NudgeDismissal, NudgeDismissalSchema
} from './habits.schemas';
import { ActivitiesService } from '../activities/activities.service';
import { SprintsService } from '../sprints/sprints.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'HabitsPrefs', schema: HabitsPrefsSchema },
      { name: 'Reflection', schema: ReflectionSchema },
      { name: 'NudgeDismissal', schema: NudgeDismissalSchema },
    ]),
  ],
  controllers: [HabitsController],
  providers: [HabitsService, ActivitiesService, SprintsService, RealtimeGateway],
  exports: [HabitsService],
})
export class HabitsModule {}
