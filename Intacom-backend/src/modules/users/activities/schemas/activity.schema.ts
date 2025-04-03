import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ActivityDocument = Activity & Document;

@Schema({ timestamps: true })
export class Activity {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  action: string; // e.g., "created_project", "added_task"
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);