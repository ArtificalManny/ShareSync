import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ActivityDocument = Activity & Document;

@Schema({ timestamps: true })
export class Activity {
  // ───────────────────────────────────────────────────────────────────────────
  // Canonical (3.4/3.5) fields
  // ───────────────────────────────────────────────────────────────────────────

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: false, index: true })
  projectId?: MongooseSchema.Types.ObjectId;

  // TASK_CREATED / TASK_UPDATED / TASK_MOVED / TASK_COMPLETED / TASK_DELETED
  @Prop({ type: String, required: false, index: true })
  type?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false, index: true })
  actorId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: false, default: 'task', index: true })
  entityType?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: false, index: true })
  entityId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: false })
  message?: string;

  // { snapshot, changes, meta }
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  payload?: Record<string, any>;

  // ───────────────────────────────────────────────────────────────────────────
  // Legacy fields (kept for compatibility with existing UI / endpoints)
  // ───────────────────────────────────────────────────────────────────────────

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: MongooseSchema.Types.ObjectId;

  // IMPORTANT:
  // Canonical activity should not be blocked by legacy enum requirements.
  // Keep enum for legacy callers, but do NOT require it.
  @Prop({
    type: String,
    required: false,
    enum: [
      'task_created',
      'task_completed',
      'task_deleted',
      'file_uploaded',
      'file_deleted',
      'message_sent',
      'payment_sent',
      'email_exchanged',
      'member_added',
      'member_removed',
      'announcement_created',
      'project_shipped',
      'comment_added',
    ],
    default: 'comment_added',
    index: true,
  })
  action?: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  details: Record<string, any>;

  @Prop({
    type: {
      taskTitle: { type: String, required: false },
      projectName: { type: String, required: false }, // ADDED FOR TASK 1.2
      fileName: { type: String, required: false },
      fileSize: { type: Number, required: false },
      recipientName: { type: String, required: false },
      amount: { type: Number, required: false },
      messagePreview: { type: String, required: false },
    },
    required: false,
    _id: false,
  })
  metadata?: {
    taskTitle?: string;
    projectName?: string; // ADDED FOR TASK 1.2
    fileName?: string;
    fileSize?: number;
    recipientName?: string;
    amount?: number;
    messagePreview?: string;
  };

  // timestamps from { timestamps: true }
  createdAt?: Date;
  updatedAt?: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Fast timeline queries
ActivitySchema.index({ projectId: 1, createdAt: -1 });
ActivitySchema.index({ projectId: 1, _id: -1 }); // cursor pagination

// Filters
ActivitySchema.index({ projectId: 1, type: 1, _id: -1 });
ActivitySchema.index({ projectId: 1, entityId: 1, _id: -1 });
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ actorId: 1, createdAt: -1 });
