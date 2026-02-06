// src/gamification/schemas/ceremony.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CEREMONY SCHEMA: Track celebrations for analytics
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum CeremonyType {
  TASK_COMPLETE = 'task_complete',
  SPRINT_GOAL = 'sprint_goal',
  PROJECT_SHIP = 'project_ship',
  LEVEL_UP = 'level_up',
  BADGE_EARNED = 'badge_earned',
  STREAK_MILESTONE = 'streak_milestone',
  LEGENDARY_HIT = 'legendary_hit',
}

export type CeremonyDocument = Ceremony & Document;

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
export class Ceremony {
  @ApiProperty({ description: 'User who triggered ceremony' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @ApiProperty({ enum: CeremonyType })
  @Prop({ type: String, enum: CeremonyType, required: true })
  type: CeremonyType;

  @ApiProperty({ description: 'Ceremony tier (micro, standard, blocking, etc.)' })
  @Prop({ type: String, required: true })
  tier: string;

  @ApiProperty({ description: 'XP awarded' })
  @Prop({ type: Number, default: 0 })
  xpAwarded: number;

  @ApiProperty({ description: 'Bonus XP (if any)' })
  @Prop({ type: Number, default: 0 })
  bonusXP: number;

  @ApiProperty({ description: 'Is this a legendary reward' })
  @Prop({ type: Boolean, default: false })
  isLegendary: boolean;

  @ApiProperty({ description: 'Multiplier applied' })
  @Prop({ type: Number, default: 1 })
  multiplier: number;

  @ApiProperty({ description: 'Ceremony context' })
  @Prop({ type: Object })
  context?: {
    taskId?: string;
    taskTitle?: string;
    projectId?: string;
    projectName?: string;
    badgeId?: string;
    badgeName?: string;
    newLevel?: number;
    streakDays?: number;
    unblockedCount?: number;
    [key: string]: any;
  };

  @ApiProperty({ description: 'Animation to play' })
  @Prop({ type: String })
  animation?: string;

  @ApiProperty({ description: 'Sound to play' })
  @Prop({ type: String })
  sound?: string;

  @ApiProperty({ description: 'Duration in ms' })
  @Prop({ type: Number, default: 1500 })
  duration: number;

  @ApiProperty({ description: 'Project for broadcasting' })
  @Prop({ type: Types.ObjectId, ref: 'Project', index: true })
  projectId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const CeremonySchema = SchemaFactory.createForClass(Ceremony);

// Indexes
CeremonySchema.index({ userId: 1, createdAt: -1 });
CeremonySchema.index({ projectId: 1, createdAt: -1 });
CeremonySchema.index({ type: 1, createdAt: -1 });
CeremonySchema.index({ isLegendary: 1, createdAt: -1 });

// TTL - Keep ceremonies for 90 days
CeremonySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
