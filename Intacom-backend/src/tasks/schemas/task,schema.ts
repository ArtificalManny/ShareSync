import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  projectId: string; // The project this task belongs to

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  assignee: string; // User ID of the assignee

  @Prop()
  dueDate: string;

  @Prop({ default: 'todo' })
  status: string; // e.g., "todo", "in_progress", "done"

  @Prop([String])
  dependencies: string[]; // Task IDs this task depends on
}

export const TaskSchema = SchemaFactory.createForClass(Task);