import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnnouncementDocument = Announcement & Document;

export type AnnouncementCommentEmailEvent = {
  commentId: Types.ObjectId;
  actorId: Types.ObjectId;
  recipientIds: Types.ObjectId[];
  queuedAt: Date;
  nextAttemptAt: Date;
  leaseUntil: Date;
  leaseToken?: string;
  cursor: number;
  attempts: number;
  completedAt?: Date;
  completionReason?: string;
  results?: Array<{
    recipientId: Types.ObjectId;
    status: 'accepted' | 'skipped' | 'failed';
    reason?: string;
    providerMessageId?: string;
    attempts: number;
    at: Date;
  }>;
};

@Schema({ _id: false })
export class AnnouncementFileReference {
  @Prop({ required: true })
  fileId: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ default: '' })
  fileType: string;

  @Prop({ default: 0 })
  fileSize: number;

  @Prop({
    type: String,
    enum: ['project_file'],
    default: 'project_file',
  })
  source: 'project_file';

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  linkedBy: Types.ObjectId;

  @Prop({ default: Date.now })
  linkedAt: Date;
}

@Schema({ timestamps: true })
export class Announcement {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ default: 'info' })
  type: string;

  @Prop({ default: false })
  pinned: boolean;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({
    type: [AnnouncementFileReference],
    default: [],
  })
  fileReferences: AnnouncementFileReference[];

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'Task',
      },
    ],
    default: [],
  })
  affectedMoveIds: Types.ObjectId[];

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'Milestone',
      },
    ],
    default: [],
  })
  affectedMilestoneIds: Types.ObjectId[];

  @Prop({
    type: {
      question: { type: String, default: '' },
      options: [
        {
          id: { type: String, required: true },
          text: { type: String, required: true },
          votes: { type: [{ type: Types.ObjectId, ref: 'User' }], default: [] },
        },
      ],
      closed: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
    default: null,
  })
  poll?: {
    question: string;
    options: { id: string; text: string; votes: Types.ObjectId[] }[];
    closed: boolean;
    createdAt?: Date;
  } | null;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  readBy: Types.ObjectId[];

  @Prop({ default: false })
  archived: boolean;

  // ═══════════════════════════════════════════════════════════════════════════════
  // NEW: Likes and Comments Schema definitions so the database actually saves them
  // ═══════════════════════════════════════════════════════════════════════════════
  
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];

  @Prop({
    type: [
      {
        text: { type: String, required: true },
        authorId: { type: Types.ObjectId, ref: 'User', required: true },
        attachments: { type: [String], default: [] },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  comments: any[];

  // Internal outbox: written atomically with the comment. Not returned by normal queries.
  @Prop({
    type: [{
      _id: false,
      commentId: { type: Types.ObjectId, required: true },
      actorId: { type: Types.ObjectId, required: true },
      recipientIds: { type: [Types.ObjectId], required: true },
      queuedAt: { type: Date, required: true },
      nextAttemptAt: { type: Date, required: true },
      leaseUntil: { type: Date, required: true },
      leaseToken: { type: String },
      cursor: { type: Number, default: 0 },
      attempts: { type: Number, default: 0 },
      completedAt: { type: Date },
      completionReason: { type: String },
      results: { type: [{
        _id: false,
        recipientId: { type: Types.ObjectId, required: true },
        status: { type: String, enum: ['accepted', 'skipped', 'failed'] },
        reason: String,
        providerMessageId: String,
        attempts: Number,
        at: Date,
      }], default: [] },
    }],
    default: undefined,
    select: false,
  })
  commentEmailOutbox?: AnnouncementCommentEmailEvent[];
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);

// Ordinary non-TTL indexes: never expire the containing announcement document.
AnnouncementSchema.index({ 'commentEmailOutbox.nextAttemptAt': 1 }, { sparse: true, name: 'comment_email_due_v1' });
AnnouncementSchema.index({ 'commentEmailOutbox.completedAt': 1 }, { sparse: true, name: 'comment_email_completed_v1' });
