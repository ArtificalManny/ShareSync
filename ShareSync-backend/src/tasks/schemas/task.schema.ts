import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed';

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop({
    required: true,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started',
  })
  status: TaskStatus;

  @Prop() description?: string;
  @Prop() dueDate?: Date;
  @Prop([String]) labels?: string[];
  @Prop() notes?: string;

  /** Project this task belongs to */
  @Prop({ required: true })
  projectId: string;

  /** Optional assignee */
  @Prop() assigneeId?: string;

  /** Who created it */
  @Prop() createdBy?: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);