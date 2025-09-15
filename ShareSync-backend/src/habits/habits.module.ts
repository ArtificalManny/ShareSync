// src/habits/habits.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';
import {
  HabitsPrefs, HabitsPrefsSchema,
  Reflection, ReflectionSchema,
  NudgeDismissal, NudgeDismissalSchema
} from './habits.schemas';

import { ActivitiesModule } from '../activities/activities.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'HabitsPrefs', schema: HabitsPrefsSchema },
      { name: 'Reflection', schema: ReflectionSchema },
      { name: 'NudgeDismissal', schema: NudgeDismissalSchema },
    ]),
    forwardRef(() => ActivitiesModule), // gives ActivitiesService + Activity model
    RealtimeModule,                     // gives RealtimeGateway (exported)
  ],
  controllers: [HabitsController],
  providers: [
    HabitsService, // only local provider
  ],
  exports: [HabitsService],
})
export class HabitsModule {}
