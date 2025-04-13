import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ required: true })
  userId: string; // The user providing feedback

  @Prop({ required: true })
  projectId: string; // The project the feedback is for

  @Prop({ required: true })
  message: string; // The feedback message

  @Prop({ default: 5 })
  rating: number; // Rating out of 5
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);