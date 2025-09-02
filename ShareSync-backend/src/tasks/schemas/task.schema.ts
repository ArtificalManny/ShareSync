// src/tasks/schemas/task.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true }) title: string;

  @Prop({
    required: true,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started',
  })
  status: 'Not Started' | 'In Progress' | 'Completed';

  @Prop() description?: string;

  @Prop() dueDate?: Date;

  /** Project this task belongs to */
  @Prop({ required: true }) projectId: string;

  /** Who created it (user id) */
  @Prop() createdBy?: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
