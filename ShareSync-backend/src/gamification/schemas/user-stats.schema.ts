// src/gamification/schemas/user-stats.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// USER STATS SCHEMA: XP, levels, streaks, achievements tracking
// - Aligns schema with seed + frontend expectations:
//   • streak.activeDays: string[]
//   • streak.lastActivityDate: Date | null (default null)
//   • earnedBadges: EarnedBadge[] (not string[])
//   • Adds FocusSession schema
//   • Keeps backward-compat virtuals + instance methods
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class XPTransaction {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  source: string;

  @Prop()
  sourceId?: string;

  @Prop()
  description?: string;

  @Prop({ type: Date, default: Date.now })
  earnedAt: Date;

  @Prop()
  multiplier?: number;

  @Prop({ type: Boolean, default: false })
  isBonus: boolean;

  @Prop({ type: Boolean, default: false })
  isLegendary: boolean;
}

@Schema({ _id: false })
export class StreakData {
  @Prop({ type: Number, default: 0 })
  currentStreak: number;

  @Prop({ type: Number, default: 0 })
  longestStreak: number;

  // Frontend/seed expects default 1
  @Prop({ type: Number, default: 1 })
  freezesAvailable: number;

  @Prop({ type: Number, default: 0 })
  freezesUsed: number;

  // Frontend/seed expects null default
  @Prop({ type: Date, default: null })
  lastActivityDate: Date | null;

  @Prop({ type: Date, default: null })
  streakStartDate?: Date | null;

  // Frontend/seed expects string[] not Date[]
  // We store ISO date strings (YYYY-MM-DD) for portability & easier charting
  @Prop({ type: [String], default: [] })
  activeDays: string[];

  @Prop({ type: Boolean, default: false })
  atRisk: boolean;

  @Prop({ type: [Number], default: [] })
  milestones: number[];
}

@Schema({ _id: false })
export class EarnedBadge {
  @Prop({ required: true })
  badgeId: string;

  @Prop({ type: Date, default: Date.now })
  earnedAt: Date;

  @Prop({ type: Object })
  metadata: any;
}

@Schema({ _id: false })
export class FocusSession {
  @Prop({ required: true })
  startedAt: Date;

  @Prop({ default: null })
  endedAt?: Date | null;

  @Prop({ default: 0 })
  duration: number;

  @Prop({ default: 0 })
  tasksCompleted: number;
}

@Schema({ _id: false })
export class DailyStats {
  // Keep as Date in DB (your existing code uses Date)
  // If you want string-based dailyStats like the spec, we can migrate later.
  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: Number, default: 0 })
  xpEarned: number;

  @Prop({ type: Number, default: 0 })
  tasksCompleted: number;

  @Prop({ type: Number, default: 0 })
  focusMinutes: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export type UserStatsDocument = UserStats &
  Document & {
    addXP(
      amount: number,
      source: string,
      options?: Partial<XPTransaction>,
    ): Promise<{ newTotal: number; leveledUp: boolean; newLevel?: number }>;
    updateStreak(completed: boolean): Promise<StreakData>;
    useStreakFreeze(): Promise<boolean>;
  };

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString?.() ?? String(ret._id);
      delete ret.__v;
      return ret;
    },
  },
})
export class UserStats {
  @ApiProperty({ description: 'User ID' })
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;

  // ─────────────────────────────────────────────────────────────────────────────
  // XP & LEVELING
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Number, default: 0, index: true })
  totalXP: number;

  @Prop({ type: Number, default: 1 })
  level: number;

  @Prop({ type: Number, default: 0 })
  levelProgress: number;

  @Prop({ type: Number, default: 100 })
  xpToNextLevel: number;

  @Prop({ type: Number, default: 0 })
  todayXP: number;

  @Prop({ type: Number, default: 0 })
  weeklyXP: number;

  @Prop({ type: Number, default: 0 })
  monthlyXP: number;

  @Prop({ type: [XPTransaction], default: [] })
  xpHistory: XPTransaction[];

  // ─────────────────────────────────────────────────────────────────────────────
  // STREAKS (nested)
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({
    type: StreakData,
    default: () => ({
      currentStreak: 0,
      longestStreak: 0,
      freezesAvailable: 1,
      freezesUsed: 0,
      activeDays: [],
      atRisk: false,
      milestones: [],
      lastActivityDate: null,
      streakStartDate: null,
    }),
  })
  streak: StreakData;

  // ─────────────────────────────────────────────────────────────────────────────
  // BADGES & ACHIEVEMENTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: [EarnedBadge], default: [] })
  earnedBadges: EarnedBadge[];

  @Prop({ type: [String], default: [] })
  showcaseBadges: string[];

  // ─────────────────────────────────────────────────────────────────────────────
  // TASK STATS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Number, default: 0 })
  tasksCompleted: number;

  @Prop({ type: Number, default: 0 })
  tasksCompletedToday: number;

  @Prop({ type: Number, default: 0 })
  tasksCompletedThisWeek: number;

  @Prop({ type: Number, default: 0 })
  tasksCompletedOnTime: number;

  @Prop({ type: Number, default: 0 })
  blockingTasksCompleted: number;

  @Prop({ type: Number, default: 0 })
  focusTasksCompleted: number;

  @Prop({ type: Number, default: 0 })
  earlyTasks: number;

  @Prop({ type: Number, default: 0 })
  lateTasks: number;

  // ─────────────────────────────────────────────────────────────────────────────
  // PROJECT & SPRINT STATS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Number, default: 0 })
  projectsCompleted: number;

  @Prop({ type: Number, default: 0 })
  sprintsCompleted: number;

  @Prop({ type: Number, default: 0 })
  shipsCount: number;

  @Prop({ type: Number, default: 0 })
  legendaryShipsCount: number;

  // ─────────────────────────────────────────────────────────────────────────────
  // BONUSES & SPECIAL EVENTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Number, default: 0 })
  bonusesEarned: number;

  @Prop({ type: Number, default: 0 })
  multipliersTriggered: number;

  @Prop({ type: Number, default: 0 })
  legendaryHits: number;

  @Prop({ type: Number, default: 0 })
  legendaryRewardsHit: number;

  // ─────────────────────────────────────────────────────────────────────────────
  // COLLABORATION STATS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Number, default: 0 })
  messagesSent: number;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  collaborators: Types.ObjectId[];

  // ─────────────────────────────────────────────────────────────────────────────
  // FOCUS STATS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Number, default: 0 })
  totalFocusMinutes: number;

  @Prop({ type: Number, default: 0 })
  todayFocusMinutes: number;

  @Prop({ type: [FocusSession], default: [] })
  focusSessions: FocusSession[];

  // ─────────────────────────────────────────────────────────────────────────────
  // DAILY TRACKING
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: [DailyStats], default: [] })
  dailyStats: DailyStats[];

  @Prop({ type: Date })
  lastTaskCompletedAt?: Date;

  @Prop({ type: Date })
  lastDailyReset?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const UserStatsSchema = SchemaFactory.createForClass(UserStats);

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════════════════════

UserStatsSchema.index({ userId: 1 }, { unique: true });
UserStatsSchema.index({ level: -1, totalXP: -1 });
UserStatsSchema.index({ 'streak.currentStreak': -1 });
UserStatsSchema.index({ weeklyXP: -1 });
UserStatsSchema.index({ monthlyXP: -1 });

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUALS (for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════════

UserStatsSchema.virtual('currentStreak').get(function () {
  return this.streak?.currentStreak || 0;
});

UserStatsSchema.virtual('longestStreak').get(function () {
  return this.streak?.longestStreak || 0;
});

UserStatsSchema.virtual('totalTasksCompleted').get(function () {
  return this.tasksCompleted || 0;
});

// ═══════════════════════════════════════════════════════════════════════════════
// INSTANCE METHODS
// ═══════════════════════════════════════════════════════════════════════════════

UserStatsSchema.methods.addXP = async function (
  amount: number,
  source: string,
  options: Partial<XPTransaction> = {},
): Promise<{ newTotal: number; leveledUp: boolean; newLevel?: number }> {
  const transaction: XPTransaction = {
    amount,
    source,
    earnedAt: new Date(),
    isBonus: options.isBonus || false,
    isLegendary: options.isLegendary || false,
    ...options,
  };

  this.xpHistory.unshift(transaction);
  if (this.xpHistory.length > 100) {
    this.xpHistory = this.xpHistory.slice(0, 100);
  }

  this.totalXP += amount;
  this.todayXP += amount;
  this.weeklyXP += amount;
  this.monthlyXP += amount;

  const oldLevel = this.level;
  const { level, progress, xpToNext } = calculateLevel(this.totalXP);
  this.level = level;
  this.levelProgress = progress;
  this.xpToNextLevel = xpToNext;

  await this.save();

  return {
    newTotal: this.totalXP,
    leveledUp: level > oldLevel,
    newLevel: level > oldLevel ? level : undefined,
  };
};

UserStatsSchema.methods.updateStreak = async function (completed: boolean): Promise<StreakData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.streak) {
    this.streak = {
      currentStreak: 0,
      longestStreak: 0,
      freezesAvailable: 1,
      freezesUsed: 0,
      activeDays: [],
      atRisk: false,
      milestones: [],
      lastActivityDate: null,
      streakStartDate: null,
    };
  }

  if (completed) {
    const lastActivity = this.streak.lastActivityDate;
    const lastActivityDate = lastActivity ? new Date(lastActivity) : null;
    if (lastActivityDate) lastActivityDate.setHours(0, 0, 0, 0);

    const isConsecutive =
      lastActivityDate &&
      today.getTime() - lastActivityDate.getTime() <= 24 * 60 * 60 * 1000;

    if (isConsecutive || !lastActivityDate) {
      this.streak.currentStreak += 1;
    } else {
      this.streak.currentStreak = 1;
      this.streak.streakStartDate = today;
    }

    if (this.streak.currentStreak > this.streak.longestStreak) {
      this.streak.longestStreak = this.streak.currentStreak;
    }

    this.streak.lastActivityDate = today;

    // Store as ISO date string (YYYY-MM-DD)
    const isoDay = today.toISOString().slice(0, 10);
    if (!this.streak.activeDays.includes(isoDay)) {
      this.streak.activeDays.push(isoDay);
    }

    this.streak.atRisk = false;

    const milestones = [7, 14, 30, 60, 100, 365];
    for (const milestone of milestones) {
      if (
        this.streak.currentStreak === milestone &&
        !this.streak.milestones.includes(milestone)
      ) {
        this.streak.milestones.push(milestone);
      }
    }
  }

  await this.save();
  return this.streak;
};

UserStatsSchema.methods.useStreakFreeze = async function (): Promise<boolean> {
  if (!this.streak || this.streak.freezesAvailable <= 0) {
    return false;
  }

  this.streak.freezesAvailable -= 1;
  this.streak.freezesUsed += 1;
  this.streak.atRisk = false;

  await this.save();
  return true;
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateLevel(totalXP: number): { level: number; progress: number; xpToNext: number } {
  const thresholds = [
    0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000,
    20000, 26000, 33000, 41000, 50000, 60000, 72000, 86000, 102000, 120000,
  ];

  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (totalXP >= thresholds[i]) level = i + 1;
    else break;
  }

  if (level >= 20) {
    const baseXP = 120000;
    const xpPerLevel = 20000;
    level = 20 + Math.floor((totalXP - baseXP) / xpPerLevel);
  }

  const currentThreshold = level <= 20 ? thresholds[level - 1] : 120000 + (level - 20) * 20000;
  const nextThreshold = level < 20 ? thresholds[level] : currentThreshold + 20000;
  const xpInLevel = totalXP - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const progress = Math.round((xpInLevel / xpNeeded) * 100);

  return {
    level,
    progress: Math.min(100, Math.max(0, progress)),
    xpToNext: nextThreshold - totalXP,
  };
}
