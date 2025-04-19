import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Notification extends Document {
  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);