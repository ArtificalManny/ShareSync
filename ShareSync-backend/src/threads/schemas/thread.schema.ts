import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class ThreadReadStatus {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  lastReadAt: Date;
}

@Schema({ timestamps: true })
export class Thread {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ 
    required: true,
    enum: ['planning', 'design', 'ops', 'general'],
    default: 'general'
  })
  category: string;

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ default: false })
  isLocked: boolean;

  @Prop({ default: 0 })
  replyCount: number;

  @Prop()
  lastReplyAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  lastReplyBy: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  participants: Types.ObjectId[];

  @Prop({ type: [ThreadReadStatus], default: [] })
  readStatus: ThreadReadStatus[];

  @Prop({ type: [Types.ObjectId], ref: 'Task', default: [] })
  linkedTasks: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Milestone', default: [] })
  linkedMilestones: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export type ThreadDocument = Thread & Document;
export const ThreadSchema = SchemaFactory.createForClass(Thread);

ThreadSchema.index({ projectId: 1, isPinned: -1, lastReplyAt: -1 });
ThreadSchema.index({ projectId: 1, category: 1 });
