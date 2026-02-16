// src/content-reports/schemas/content-report.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT REPORT SCHEMA — User-reported content for moderation
// This is DIFFERENT from reports.service.ts (which handles project data exports)
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContentReportDocument = ContentReport & Document;

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum ReportReason {
  DANGEROUS_CONTENT = 'dangerous_content',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  HATE_SPEECH = 'hate_speech',
  SEXUAL_CONTENT = 'sexual_content',
  IMPERSONATION = 'impersonation',
  MISINFORMATION = 'misinformation',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED_REMOVED = 'resolved_removed',
  RESOLVED_KEPT = 'resolved_kept',
  DISMISSED = 'dismissed',
}

export enum ContentType {
  USER_PROFILE = 'user_profile',
  PROJECT = 'project',
  TASK = 'task',
  COMMENT = 'comment',
  MESSAGE = 'message',
  FILE = 'file',
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ timestamps: true })
export class ContentReport {
  // Who submitted the report
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  reporterId: Types.ObjectId;

  // What type of content is being reported
  @Prop({ required: true, enum: ContentType })
  contentType: ContentType;

  // ID of the reported content
  @Prop({ required: true, type: Types.ObjectId, refPath: 'contentType' })
  contentId: Types.ObjectId;

  // Who owns the reported content
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  reportedUserId: Types.ObjectId;

  // Why it's being reported
  @Prop({ required: true, enum: ReportReason })
  reason: ReportReason;

  // Optional additional context from reporter
  @Prop({ type: String, maxlength: 500 })
  additionalContext?: string;

  // Current status
  @Prop({ required: true, enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  // Admin who reviewed (if reviewed)
  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  // When it was reviewed
  @Prop()
  reviewedAt?: Date;

  // Admin notes
  @Prop()
  reviewNotes?: string;

  // What action was taken
  @Prop()
  actionTaken?: string;

  // Snapshot of content at time of report (for evidence preservation)
  @Prop({ type: Object })
  contentSnapshot?: Record<string, any>;

  // Auto-hidden flag (true if auto-hidden due to threshold)
  @Prop({ default: false })
  wasAutoHidden: boolean;

  // Priority (for sorting in admin queue)
  @Prop({ default: 0 })
  priority: number;
}

export const ContentReportSchema = SchemaFactory.createForClass(ContentReport);

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════════════════════

// Find reports for the same content
ContentReportSchema.index({ contentType: 1, contentId: 1, status: 1 });

// Reporter history (prevent abuse)
ContentReportSchema.index({ reporterId: 1, createdAt: -1 });

// Admin queue (pending reports, oldest first)
ContentReportSchema.index({ status: 1, priority: -1, createdAt: 1 });

// Find reports by reported user
ContentReportSchema.index({ reportedUserId: 1, status: 1 });

// Duplicate check
ContentReportSchema.index(
  { reporterId: 1, contentType: 1, contentId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'under_review'] } } }
);
