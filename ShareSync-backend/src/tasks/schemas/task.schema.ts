import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Task extends Document {
  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  assignedTo: string;

  @Prop({ default: 'pending' })
  status: string; // e.g., 'pending', 'in-progress', 'completed'

  @Prop()
  completedBy: string;

  @Prop()
  completedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  dueDate: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);