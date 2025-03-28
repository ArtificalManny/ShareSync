import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ActivityDocument = Activity & Document;

@Schema({ timestamps: true })
export class Activity {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  type: 'post' | 'comment' | 'like' | 'task' | 'subtask' | 'file' | 'project_create' | 'profile_update' | 'member_request' | 'member_approved';

  @Prop({ required: true })
  content: string;

  @Prop()
  projectId?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);