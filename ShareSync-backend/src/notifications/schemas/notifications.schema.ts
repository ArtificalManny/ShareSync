import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: false })
  projectId?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: [
      'announcement_created',
      'mention',
      'task_assigned',
      'file_uploaded',
      'deadline_reminder',
      'project_invite',
      'comment_added',
    ]
  })
  type: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Boolean, default: false })
  urgent: boolean;

  @Prop({ type: Boolean, default: false })
  read: boolean;

  @Prop({ type: Date, required: false })
  readAt?: Date;

  @Prop({
    type: {
      url: String,
      announcementId: MongooseSchema.Types.ObjectId,
      taskId: MongooseSchema.Types.ObjectId,
      commentId: MongooseSchema.Types.ObjectId,
    },
    required: false,
  })
  actionData?: {
    url?: string;
    announcementId?: MongooseSchema.Types.ObjectId;
    taskId?: MongooseSchema.Types.ObjectId;
    commentId?: MongooseSchema.Types.ObjectId;
  };

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  triggeredBy?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: {
      inApp: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },
    default: { inApp: false, email: false, sms: false }
  })
  sentChannels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for fast queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1 });
