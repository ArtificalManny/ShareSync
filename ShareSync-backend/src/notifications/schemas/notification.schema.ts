import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Notification extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ default: false })
  read: boolean;

  @Prop()
  type: string; // e.g., 'task_completed', 'comment', 'project_update'

  @Prop()
  relatedId: string; // e.g., taskId, commentId, projectId
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);