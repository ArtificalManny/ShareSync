// src/gamification/services/ceremony.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CEREMONY SERVICE: Make every win feel special
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Ceremony, CeremonyDocument, CeremonyType } from '../schemas/ceremony.schema';
import { getCeremonyTier, CEREMONY_TIERS } from '../constants/xp.constants';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CeremonyPayload {
  userId: string;
  type: CeremonyType;
  xpAwarded: number;
  bonusXP?: number;
  isLegendary?: boolean;
  multiplier?: number;
  context?: Record<string, any>;
  projectId?: string;
}

export interface CeremonyResult {
  ceremony: CeremonyDocument;
  tier: typeof CEREMONY_TIERS[keyof typeof CEREMONY_TIERS];
  shouldBroadcast: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class CeremonyService {
  private readonly logger = new Logger(CeremonyService.name);

  constructor(
    @InjectModel(Ceremony.name)
    private readonly ceremonyModel: Model<CeremonyDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // TRIGGER CEREMONY
  // ─────────────────────────────────────────────────────────────────────────────

  async triggerCeremony(payload: CeremonyPayload): Promise<CeremonyResult> {
    const tier = getCeremonyTier(
      payload.xpAwarded + (payload.bonusXP || 0),
      payload.isLegendary || false,
    );

    const ceremony = new this.ceremonyModel({
      userId: new Types.ObjectId(payload.userId),
      type: payload.type,
      tier: tier.name,
      xpAwarded: payload.xpAwarded,
      bonusXP: payload.bonusXP || 0,
      isLegendary: payload.isLegendary || false,
      multiplier: payload.multiplier || 1,
      context: payload.context,
      animation: tier.animation,
      sound: tier.sound,
      duration: tier.duration,
      projectId: payload.projectId
        ? new Types.ObjectId(payload.projectId)
        : undefined,
    });

    const saved = await ceremony.save();

    // Determine if should broadcast to team
    const shouldBroadcast = this.shouldBroadcast(tier, payload);

    // Emit to user
    this.eventEmitter.emit('ceremony.triggered', {
      userId: payload.userId,
      ceremony: {
        id: saved._id,
        type: payload.type,
        tier: tier.name,
        xpAwarded: payload.xpAwarded,
        bonusXP: payload.bonusXP,
        isLegendary: payload.isLegendary,
        multiplier: payload.multiplier,
        animation: tier.animation,
        sound: tier.sound,
        duration: tier.duration,
        context: payload.context,
      },
    });

    // Broadcast to project if significant
    if (shouldBroadcast && payload.projectId) {
      this.eventEmitter.emit('ceremony.broadcast', {
        projectId: payload.projectId,
        userId: payload.userId,
        type: payload.type,
        tier: tier.name,
        xpAwarded: payload.xpAwarded,
        isLegendary: payload.isLegendary,
        context: payload.context,
      });
    }

    this.logger.log(`Ceremony triggered: ${tier.name} for user ${payload.userId}`);

    return {
      ceremony: saved,
      tier,
      shouldBroadcast,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SPECIALIZED CEREMONIES
  // ─────────────────────────────────────────────────────────────────────────────

  async triggerTaskComplete(
    userId: string,
    xpAwarded: number,
    bonusXP: number,
    isLegendary: boolean,
    multiplier: number,
    context: Record<string, any>,
  ): Promise<CeremonyResult> {
    return this.triggerCeremony({
      userId,
      type: CeremonyType.TASK_COMPLETE,
      xpAwarded,
      bonusXP,
      isLegendary,
      multiplier,
      context,
      projectId: context.projectId,
    });
  }

  async triggerLevelUp(
    userId: string,
    newLevel: number,
    context: Record<string, any> = {},
  ): Promise<CeremonyResult> {
    return this.triggerCeremony({
      userId,
      type: CeremonyType.LEVEL_UP,
      xpAwarded: 0,
      context: {
        ...context,
        newLevel,
      },
    });
  }

  async triggerBadgeEarned(
    userId: string,
    badgeId: string,
    badgeName: string,
    badgeIcon: string,
    xpReward: number,
  ): Promise<CeremonyResult> {
    return this.triggerCeremony({
      userId,
      type: CeremonyType.BADGE_EARNED,
      xpAwarded: xpReward,
      context: {
        badgeId,
        badgeName,
        badgeIcon,
      },
    });
  }

  async triggerStreakMilestone(
    userId: string,
    streakDays: number,
  ): Promise<CeremonyResult> {
    return this.triggerCeremony({
      userId,
      type: CeremonyType.STREAK_MILESTONE,
      xpAwarded: streakDays * 10, // 10 XP per day of milestone
      context: {
        streakDays,
      },
    });
  }

  async triggerLegendary(
    userId: string,
    xpAwarded: number,
    context: Record<string, any>,
  ): Promise<CeremonyResult> {
    return this.triggerCeremony({
      userId,
      type: CeremonyType.LEGENDARY_HIT,
      xpAwarded,
      isLegendary: true,
      context,
      projectId: context.projectId,
    });
  }

  async triggerSprintGoal(
    userId: string,
    projectId: string,
    sprintName: string,
  ): Promise<CeremonyResult> {
    return this.triggerCeremony({
      userId,
      type: CeremonyType.SPRINT_GOAL,
      xpAwarded: 200,
      context: {
        sprintName,
      },
      projectId,
    });
  }

  async triggerProjectShip(
    userId: string,
    projectId: string,
    projectName: string,
  ): Promise<CeremonyResult> {
    return this.triggerCeremony({
      userId,
      type: CeremonyType.PROJECT_SHIP,
      xpAwarded: 500,
      context: {
        projectName,
      },
      projectId,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET CEREMONIES
  // ─────────────────────────────────────────────────────────────────────────────

  async getUserCeremonies(
    userId: string,
    limit: number = 20,
  ): Promise<CeremonyDocument[]> {
    return this.ceremonyModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getProjectCeremonies(
    projectId: string,
    limit: number = 50,
  ): Promise<CeremonyDocument[]> {
    return this.ceremonyModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .populate('userId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getLegendaryCeremonies(limit: number = 20): Promise<CeremonyDocument[]> {
    return this.ceremonyModel
      .find({ isLegendary: true })
      .populate('userId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private shouldBroadcast(
    tier: typeof CEREMONY_TIERS[keyof typeof CEREMONY_TIERS],
    payload: CeremonyPayload,
  ): boolean {
    // Broadcast for blocking tasks, sprint goals, project ships, and legendary
    return (
      tier.name === 'blocking' ||
      tier.name === 'sprint_goal' ||
      tier.name === 'project_ship' ||
      tier.name === 'legendary' ||
      payload.isLegendary === true
    );
  }
}
