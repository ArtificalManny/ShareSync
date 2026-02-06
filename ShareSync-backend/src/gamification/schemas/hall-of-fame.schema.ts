// src/gamification/schemas/hall-of-fame.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// HALL OF FAME SCHEMA: Legendary achievements for all to see
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum HallOfFameCategory {
  LEGENDARY_SHIP = 'legendary_ship',
  STREAK_MILESTONE = 'streak_milestone',
  PROJECT_SHIP = 'project_ship',
  XP_MILESTONE = 'xp_milestone',
  BADGE_UNLOCK = 'badge_unlock',
  LEVEL_UP = 'level_up',
  WEEKLY_CHAMPION = 'weekly_champion',
  MONTHLY_CHAMPION = 'monthly_champion',
}

export type HallOfFameDocument = HallOfFameEntry & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString?.() ?? ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class HallOfFameEntry {
  @ApiProperty({ description: 'User who achieved this' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @ApiProperty({ enum: HallOfFameCategory })
  @Prop({ type: String, enum: HallOfFameCategory, required: true, index: true })
  category: HallOfFameCategory;

  @ApiProperty({ description: 'Achievement title' })
  @Prop({ type: String, required: true })
  title: string;

  @ApiProperty({ description: 'Achievement description' })
  @Prop({ type: String, required: true })
  description: string;

  @ApiProperty({ description: 'Icon/emoji' })
  @Prop({ type: String, required: true })
  icon: string;

  @ApiProperty({ description: 'XP associated with this achievement' })
  @Prop({ type: Number, default: 0 })
  xpValue: number;

  @ApiProperty({ description: 'Additional context' })
  @Prop({ type: Object })
  context?: {
    projectId?: string;
    projectName?: string;
    taskId?: string;
    taskTitle?: string;
    streakDays?: number;
    level?: number;
    badgeId?: string;
    badgeName?: string;
    weekNumber?: number;
    monthYear?: string;
    [key: string]: any;
  };

  @ApiProperty({ description: 'Is this entry featured on main page' })
  @Prop({ type: Boolean, default: false, index: true })
  isFeatured: boolean;

  @ApiProperty({ description: 'When the achievement happened' })
  @Prop({ type: Date, default: Date.now, index: true })
  achievedAt: Date;

  @ApiProperty({ description: 'Number of celebrations/kudos from others' })
  @Prop({ type: Number, default: 0 })
  celebrationCount: number;

  @ApiProperty({ description: 'Users who celebrated this' })
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  celebratedBy: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

export const HallOfFameSchema = SchemaFactory.createForClass(HallOfFameEntry);

// Indexes
HallOfFameSchema.index({ achievedAt: -1 });
HallOfFameSchema.index({ category: 1, achievedAt: -1 });
HallOfFameSchema.index({ isFeatured: 1, achievedAt: -1 });
HallOfFameSchema.index({ celebrationCount: -1 });
