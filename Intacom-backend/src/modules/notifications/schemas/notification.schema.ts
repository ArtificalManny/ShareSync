import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  type?: string;

  @Prop()
  projectId?: string;

  @Prop()
  action?: 'accept' | 'decline';

  @Prop({ default: 'pending' })
  status?: 'pending' | 'accepted' | 'declined';

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);