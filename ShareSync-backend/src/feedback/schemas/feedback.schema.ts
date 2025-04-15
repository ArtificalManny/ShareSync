import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ required: true })
  feedback: string;

  @Prop()
  featureRequest: string;

  @Prop({ required: true, enum: ['general', 'feature', 'bug'] })
  category: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);