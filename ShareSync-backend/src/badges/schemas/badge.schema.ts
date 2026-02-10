// src/badges/schemas/badge.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// BADGE SCHEMA
// - Minimal, safe badge definitions collection
// - Used for gamification: tier/badge displays, unlock rules, etc.
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type BadgeDocument = Badge & Document;

export enum BadgeRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum BadgeCategory {
  STREAK = 'streak',
  TASKS = 'tasks',
  PROJECTS = 'projects',
  SOCIAL = 'social',
  FILES = 'files',
  FOCUS = 'focus',
  OTHER = 'other',
}

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
export class Badge {
  @ApiProperty({ description: 'Stable unique key for the badge (e.g. streak_7)' })
  @Prop({ required: true, unique: true, index: true, trim: true })
  key: string;

  @ApiProperty({ description: 'Badge display name' })
  @Prop({ required: true, trim: true, maxlength: 120 })
  name: string;

  @ApiProperty({ description: 'Short description' })
  @Prop({ default: '', maxlength: 500 })
  description?: string;

  @ApiProperty({ description: 'Category', enum: BadgeCategory })
  @Prop({ type: String, enum: BadgeCategory, default: BadgeCategory.OTHER, index: true })
  category: BadgeCategory;

  @ApiProperty({ description: 'Rarity', enum: BadgeRarity })
  @Prop({ type: String, enum: BadgeRarity, default: BadgeRarity.COMMON, index: true })
  rarity: BadgeRarity;

  @ApiProperty({ description: 'Emoji/icon identifier (simple and safe default)' })
  @Prop({ default: '🏅', trim: true, maxlength: 20 })
  icon: string;

  @ApiProperty({ description: 'Primary display color hex' })
  @Prop({ default: '#8B5CF6', trim: true, maxlength: 20 })
  color: string;

  @ApiProperty({ description: 'Optional image URL (future use)' })
  @Prop({ default: '', trim: true })
  imageUrl?: string;

  @ApiProperty({ description: 'XP reward when earned (optional)' })
  @Prop({ type: Number, default: 0 })
  xpReward: number;

  @ApiProperty({ description: 'If false, badge is hidden/disabled' })
  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  /**
   * Unlock rule is deliberately generic:
   * - You can store “type + threshold + metadata”
   * - Service logic can interpret later without schema churn.
   */
  @ApiProperty({ description: 'Unlock rule definition (generic)' })
  @Prop({ type: Object, default: {} })
  unlockRule?: Record<string, any>;

  // timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const BadgeSchema = SchemaFactory.createForClass(Badge);

BadgeSchema.index({ category: 1, rarity: 1, isActive: 1 });
