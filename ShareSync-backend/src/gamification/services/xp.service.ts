// src/gamification/services/xp.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// XP SERVICE: Experience points management
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserStats, UserStatsDocument, XPTransaction } from '../schemas/user-stats.schema';
import { getLevelProgress, getLevelTitle } from '../constants/xp.constants';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface LevelDefinition {
  level: number;
  title: string;
  xpRequired: number;
  xpToNext: number;
}

export interface LevelProgressResult {
  currentLevel: number;
  currentTitle: string;
  totalXP: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  progress: number;
  nextLevelTitle: string;
}

export interface XPBreakdown {
  source: string;
  totalXP: number;
  count: number;
  percentage: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class XPService {
  private readonly logger = new Logger(XPService.name);

  constructor(
    @InjectModel(UserStats.name)
    private readonly userStatsModel: Model<UserStatsDocument>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // XP HISTORY
  // ─────────────────────────────────────────────────────────────────────────────

  async getXPHistory(userId: string, limit: number = 20): Promise<XPTransaction[]> {
    const stats = await this.userStatsModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!stats) return [];
    return (stats.xpHistory ?? []).slice(0, limit);
  }

  async getXPBreakdown(userId: string): Promise<XPBreakdown[]> {
    const stats = await this.userStatsModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!stats || !(stats.xpHistory ?? []).length) return [];

    const sourceMap = new Map<string, { totalXP: number; count: number }>();

    for (const tx of stats.xpHistory) {
      const existing = sourceMap.get(tx.source) || { totalXP: 0, count: 0 };
      existing.totalXP += tx.amount;
      existing.count += 1;
      sourceMap.set(tx.source, existing);
    }

    const totalXP = stats.totalXP || 1;

    return Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        totalXP: data.totalXP,
        count: data.count,
        percentage: Math.round((data.totalXP / totalXP) * 100),
      }))
      .sort((a, b) => b.totalXP - a.totalXP);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LEVEL DEFINITIONS
  // ─────────────────────────────────────────────────────────────────────────────
  // We avoid LEVEL_THRESHOLDS import since your constants file doesn’t export it.
  // We can still provide useful “definitions” by sampling totals and inferring.
  // If you want a canonical list later, we can add LEVEL_THRESHOLDS back into xp.constants.ts.

  getLevelDefinitions(): LevelDefinition[] {
    const defs: LevelDefinition[] = [];

    // Sample a simple curve of totalXP checkpoints for first ~25 levels
    // (This is only for display; your true logic is in getLevelProgress().)
    const checkpoints = [
      0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000,
      20000, 26000, 33000, 41000, 50000, 60000, 72000, 86000, 102000,
      120000, 140000, 160000, 180000, 200000,
    ];

    for (let i = 0; i < checkpoints.length; i++) {
      const level = i + 1;
      const xpRequired = checkpoints[i];
      const next = checkpoints[i + 1] ?? (xpRequired + 20000);
      defs.push({
        level,
        title: getLevelTitle(level),
        xpRequired,
        xpToNext: next - xpRequired,
      });
    }

    return defs;
  }

  async getLevelProgress(userId: string): Promise<LevelProgressResult> {
    const stats = await this.userStatsModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!stats) {
      const base = getLevelProgress(0);
      return {
        currentLevel: 1,
        currentTitle: getLevelTitle(1),
        totalXP: 0,
        xpInCurrentLevel: base.xpInLevel,
        xpToNextLevel: base.xpForNextLevel,
        progress: base.progress,
        nextLevelTitle: getLevelTitle(2),
      };
    }

    const levelProgress = getLevelProgress(stats.totalXP ?? 0);

    return {
      currentLevel: stats.level ?? levelProgress.level ?? 1,
      currentTitle: getLevelTitle(stats.level ?? levelProgress.level ?? 1),
      totalXP: stats.totalXP ?? 0,
      xpInCurrentLevel: levelProgress.xpInLevel,
      xpToNextLevel: levelProgress.xpForNextLevel,
      progress: levelProgress.progress,
      nextLevelTitle: getLevelTitle((stats.level ?? levelProgress.level ?? 1) + 1),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // XP VALUES REFERENCE
  // ─────────────────────────────────────────────────────────────────────────────
  // Your xp.constants.ts currently doesn’t export XP_VALUES.
  // Returning an empty object keeps the API stable without breaking builds.

  getXPValues(): Record<string, number> {
    return {};
  }
}
