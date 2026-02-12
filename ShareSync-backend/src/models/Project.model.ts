// src/models/Project.model.ts
// ─────────────────────────────────────────────────────────────────────────────
// Project Model (NestJS + Mongoose)
// Includes Phase 2 fields: visibility, isListed, spectatorMode, moderationStatus
//
// IMPORTANT:
// - This file is safe to add even if not yet imported anywhere.
// - Do NOT wire it into ProjectsModule until we verify you don't already have
//   another Project schema (e.g., src/projects/schemas/project.schema.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

export type ProjectVisibility = 'private' | 'public';
export type ProjectSpectatorMode = 'view' | 'suggest';
export type ProjectModerationStatus = 'draft' | 'pending' | 'approved' | 'rejected';

@Schema({ timestamps: true })
export class Project {
  // Core fields (keep minimal so we don't conflict with your existing DTOs)
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, default: '', trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: String, default: '', trim: true })
  emoji?: string;

  @Prop({ type: String, default: '', trim: true })
  icon?: string;

  @Prop({ type: String, default: '', trim: true })
  color?: string;

  // ─────────────────────────────────────────────────────────────
  // Phase 1/2: Public Listing + Moderation + Spectator Mode
  // ─────────────────────────────────────────────────────────────

  // visibility: "private" | "public"
  @Prop({ type: String, enum: ['private', 'public'], default: 'private', index: true })
  visibility?: ProjectVisibility;

  // isListed: boolean (shows in Discover/Search)
  @Prop({ type: Boolean, default: false, index: true })
  isListed?: boolean;

  // spectatorMode: "view" | "suggest"
  @Prop({ type: String, enum: ['view', 'suggest'], default: 'view' })
  spectatorMode?: ProjectSpectatorMode;

  // moderationStatus: "draft" | "pending" | "approved" | "rejected"
  @Prop({ type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft', index: true })
  moderationStatus?: ProjectModerationStatus;

  // moderationReason (for rejection explanation)
  @Prop({ type: String, default: '', trim: true })
  moderationReason?: string;

  // publicSlug (optional later)
  @Prop({ type: String, sparse: true, index: true })
  publicSlug?: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Helpful indexes for Discover/Search (safe even if unused right now)
ProjectSchema.index({ visibility: 1, isListed: 1, moderationStatus: 1 });
ProjectSchema.index({ name: 'text', description: 'text', tags: 'text' });
