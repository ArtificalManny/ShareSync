// src/activities/schemas/activity.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Activity {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', index: true })
  projectId: Types.ObjectId;

  @Prop({ type: String, required: true })
  type: string; // 'update' | 'task' | 'file' | ...

  @Prop({ type: String })
  text?: string;

  @Prop({ type: Object })
  meta?: Record<string, any>;

  // createdAt/updatedAt come from timestamps
}

export type ActivityDocument = HydratedDocument<Activity>;
export const ActivitySchema = SchemaFactory.createForClass(Activity);