// src/badges/badges.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// BADGES SERVICE
// - Minimal service for reading badge definitions
// - Includes optional "seedDefaults" for initial badge set
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Badge,
  BadgeDocument,
  BadgeCategory,
  BadgeRarity,
} from './schemas/badge.schema';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    @InjectModel(Badge.name)
    private readonly badgeModel: Model<BadgeDocument>,
  ) {}

  async list(params: {
    category?: BadgeCategory;
    rarity?: BadgeRarity;
    activeOnly?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ badges: BadgeDocument[]; total: number }> {
    const filter: any = {};

    if (params.category) filter.category = params.category;
    if (params.rarity) filter.rarity = params.rarity;
    if (params.activeOnly !== false) filter.isActive = true;

    if (params.search) {
      filter.$text = { $search: params.search };
    }

    const limit = params.limit ?? 100;
    const offset = params.offset ?? 0;

    const [badges, total] = await Promise.all([
      this.badgeModel
        .find(filter)
        .sort({ category: 1, rarity: 1, name: 1 })
        .skip(offset)
        .limit(limit),
      this.badgeModel.countDocuments(filter),
    ]);

    return { badges, total };
  }

  async getById(id: string): Promise<BadgeDocument> {
    const badge = await this.badgeModel.findById(id);
    if (!badge) throw new NotFoundException('Badge not found');
    return badge;
  }

  async getByKey(key: string): Promise<BadgeDocument> {
    const badge = await this.badgeModel.findOne({ key });
    if (!badge) throw new NotFoundException('Badge not found');
    return badge;
  }

  // Optional admin-ish operations (safe to have; not required to use)
  async create(data: Partial<Badge>): Promise<BadgeDocument> {
    const created = new this.badgeModel(data);
    return created.save();
  }

  async update(id: string, patch: Partial<Badge>): Promise<BadgeDocument> {
    const updated = await this.badgeModel.findByIdAndUpdate(id, patch, { new: true });
    if (!updated) throw new NotFoundException('Badge not found');
    return updated;
  }

  async seedDefaults(): Promise<{ inserted: number; skipped: number }> {
    // Small default set; safe, and idempotent by `key`.
    const defaults: Partial<Badge>[] = [
      {
        key: 'streak_3',
        name: '3-Day Streak',
        description: 'Logged progress 3 days in a row.',
        category: BadgeCategory.STREAK,
        rarity: BadgeRarity.COMMON,
        icon: '🔥',
        color: '#F97316',
        xpReward: 10,
        isActive: true,
        unlockRule: { type: 'streak_days', threshold: 3 },
      },
      {
        key: 'streak_7',
        name: '7-Day Streak',
        description: 'Logged progress 7 days in a row.',
        category: BadgeCategory.STREAK,
        rarity: BadgeRarity.RARE,
        icon: '🔥',
        color: '#F59E0B',
        xpReward: 25,
        isActive: true,
        unlockRule: { type: 'streak_days', threshold: 7 },
      },
      {
        key: 'tasks_25',
        name: 'Task Crusher',
        description: 'Completed 25 tasks.',
        category: BadgeCategory.TASKS,
        rarity: BadgeRarity.COMMON,
        icon: '✅',
        color: '#22C55E',
        xpReward: 15,
        isActive: true,
        unlockRule: { type: 'tasks_completed', threshold: 25 },
      },
      {
        key: 'files_10',
        name: 'Vault Keeper',
        description: 'Uploaded 10 files.',
        category: BadgeCategory.FILES,
        rarity: BadgeRarity.COMMON,
        icon: '🗂️',
        color: '#60A5FA',
        xpReward: 10,
        isActive: true,
        unlockRule: { type: 'files_uploaded', threshold: 10 },
      },
    ];

    let inserted = 0;
    let skipped = 0;

    for (const badge of defaults) {
      const exists = await this.badgeModel.exists({ key: badge.key });
      if (exists) {
        skipped++;
        continue;
      }
      await this.badgeModel.create(badge);
      inserted++;
    }

    this.logger.log(`Badges seed: inserted=${inserted}, skipped=${skipped}`);
    return { inserted, skipped };
  }
}
