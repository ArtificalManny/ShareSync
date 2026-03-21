// src/follows/schemas/follow.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FOLLOW SCHEMA - Instagram-style project following
// Links a user to a project they want to track
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'follows' })
export class Follow extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);

// Compound unique index: a user can only follow a project once
FollowSchema.index({ userId: 1, projectId: 1 }, { unique: true });

// Fast lookup: all projects a user follows
FollowSchema.index({ userId: 1, createdAt: -1 });

// Fast lookup: all followers of a project
FollowSchema.index({ projectId: 1 });
