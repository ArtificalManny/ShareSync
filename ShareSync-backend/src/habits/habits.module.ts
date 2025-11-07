// backend/src/habits/habits.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HabitsService } from './habits.service';
import { HabitsController } from './habits.controller';
import { ActivitiesModule } from '../activities/activities.module';
import { RealtimeModule } from '../realtime/realtime.module';   // ← NEW

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'HabitsPrefs', schema: {} },
      { name: 'Reflection', schema: {} },
      { name: 'NudgeDismissal', schema: {} },
    ]),
    forwardRef(() => ActivitiesModule),
    forwardRef(() => RealtimeModule),   // ← NEW (provides REALTIME_GATEWAY)
  ],
  controllers: [HabitsController],
  providers: [HabitsService],
  exports: [HabitsService],
})
export class HabitsModule {}