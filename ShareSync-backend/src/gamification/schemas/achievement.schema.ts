// src/gamification/schemas/achievement.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT SCHEMA: Individual badge earnings
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BadgeCategory, BadgeRarity } from '../constants/badges.constants';

export type AchievementDocument = Achievement & Document;

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
export class Achievement {
  @ApiProperty({ description: 'User who earned this badge' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Badge ID from constants' })
  @Prop({ type: String, required: true, index: true })
  badgeId: string;

  @ApiProperty({ description: 'Badge name' })
  @Prop({ type: String, required: true })
  badgeName: string;

  @ApiProperty({ description: 'Badge description' })
  @Prop({ type: String, required: true })
  badgeDescription: string;

  @ApiProperty({ description: 'Badge icon' })
  @Prop({ type: String, required: true })
  badgeIcon: string;

  @ApiProperty({ enum: BadgeCategory })
  @Prop({ type: String, enum: BadgeCategory, required: true })
  category: BadgeCategory;

  @ApiProperty({ enum: BadgeRarity })
  @Prop({ type: String, enum: BadgeRarity, required: true })
  rarity: BadgeRarity;

  @ApiProperty({ description: 'XP rewarded for this badge' })
  @Prop({ type: Number, required: true })
  xpRewarded: number;

  @ApiProperty({ description: 'Context that triggered the badge' })
  @Prop({ type: Object })
  context?: {
    taskId?: string;
    projectId?: string;
    streakDays?: number;
    tasksCompleted?: number;
    xpEarned?: number;
    [key: string]: any;
  };

  @ApiProperty({ description: 'Date badge was earned' })
  @Prop({ type: Date, default: Date.now })
  earnedAt: Date;

  @ApiProperty({ description: 'Has user viewed this badge' })
  @Prop({ type: Boolean, default: false })
  isViewed: boolean;

  @ApiProperty({ description: 'Has user showcased this badge' })
  @Prop({ type: Boolean, default: false })
  isShowcased: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);

// Indexes
AchievementSchema.index({ userId: 1, earnedAt: -1 });
AchievementSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
AchievementSchema.index({ userId: 1, rarity: 1 });
AchievementSchema.index({ userId: 1, category: 1 });
AchievementSchema.index({ userId: 1, isShowcased: 1 });
