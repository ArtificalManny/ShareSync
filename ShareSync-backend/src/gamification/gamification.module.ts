// src/gamification/gamification.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// GAMIFICATION MODULE
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

// Schemas
import { UserStats, UserStatsSchema } from './schemas/user-stats.schema';
import { Achievement, AchievementSchema } from './schemas/achievement.schema';
import { HallOfFameEntry, HallOfFameSchema } from './schemas/hall-of-fame.schema';
import { Ceremony, CeremonySchema } from './schemas/ceremony.schema';

// Services
import { GamificationService } from './gamification.service';
import { XPCalculatorService } from './services/xp-calculator.service';
import { StreakService } from './services/streak.service';
import { BadgeService } from './services/badge.service';
import { LeaderboardService } from './services/leaderboard.service';
import { CeremonyService } from './services/ceremony.service';

// Controller
import { GamificationController } from './gamification.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserStats.name, schema: UserStatsSchema },
      { name: Achievement.name, schema: AchievementSchema },
      { name: HallOfFameEntry.name, schema: HallOfFameSchema },
      { name: Ceremony.name, schema: CeremonySchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [GamificationController],
  providers: [
    GamificationService,
    XPCalculatorService,
    StreakService,
    BadgeService,
    LeaderboardService,
    CeremonyService,
  ],
  exports: [
    GamificationService,
    XPCalculatorService,
    StreakService,
    BadgeService,
    LeaderboardService,
    CeremonyService,
  ],
})
export class GamificationModule {}
