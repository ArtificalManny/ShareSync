// src/follows/schemas/project-follow.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT FOLLOW SCHEMA
// Spectator subscriptions to public projects
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectFollowDocument = ProjectFollow & Document;

export enum FollowFrequency {
  INSTANT = 'instant',
  DAILY = 'dailyDigest',
  WEEKLY = 'weeklyDigest',
}

@Schema({ timestamps: true })
export class ProjectFollow {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },
    default: { inApp: true, email: false, sms: false },
  })
  channelPrefs: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };

  @Prop({
    type: String,
    enum: FollowFrequency,
    default: FollowFrequency.INSTANT,
  })
  frequency: FollowFrequency;

  createdAt: Date;
  updatedAt: Date;
}

export const ProjectFollowSchema =
  SchemaFactory.createForClass(ProjectFollow);

// Prevent duplicate follows (one user per project)
ProjectFollowSchema.index({ projectId: 1, userId: 1 }, { unique: true });
