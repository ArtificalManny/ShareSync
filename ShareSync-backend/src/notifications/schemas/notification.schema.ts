import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  userId: string; // The user receiving the notification

  @Prop({ required: true })
  type: string; // e.g., "like", "comment", "project_update"

  @Prop({ required: true })
  message: string; // e.g., "Your project has a new comment!"

  @Prop({ default: false })
  isRead: boolean; // Whether the user has read the notification

  @Prop()
  relatedId: string; // ID of the related post, project, or comment
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);