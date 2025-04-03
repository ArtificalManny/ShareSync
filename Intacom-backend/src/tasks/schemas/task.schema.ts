import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  assignee: string;

  @Prop()
  dueDate: string;

  @Prop({ default: 'todo' })
  status: string;

  @Prop([String])
  dependencies: string[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);