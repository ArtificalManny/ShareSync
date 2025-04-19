import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Feedback extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  rating: number;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);