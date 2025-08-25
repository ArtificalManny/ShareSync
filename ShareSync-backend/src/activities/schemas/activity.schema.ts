// src/activities/activity.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ActivityDocument = HydratedDocument<Activity>;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Activity {
  @Prop({ required: true }) type: string; // 'task.create' | 'task.complete' | 'update' | 'file.upload' | ...
  @Prop({ required: true }) userId: string;
  @Prop({ type: Object }) user?: Record<string, any>; // snapshot { id, name, avatarUrl }
  @Prop({ required: true }) projectId: string;
  @Prop({ type: Object }) project?: Record<string, any>; // snapshot { id, title }
  @Prop() entityId?: string;
  @Prop() entityType?: string; // 'task' | 'file' | 'post' | ...
  @Prop() message?: string; // pre-rendered summary
  @Prop({ type: Object, default: {} }) meta?: Record<string, any>;
  @Prop({ type: Date, default: Date.now }) ts: Date; // event timestamp

  @Prop() createdAt?: Date;
  @Prop() updatedAt?: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Useful indexes
ActivitySchema.index({ projectId: 1, ts: -1 });
ActivitySchema.index({ userId: 1, ts: -1 });
ActivitySchema.index({ ts: -1 });