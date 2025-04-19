import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Task extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  projectId: string;

  @Prop()
  assignee?: string;

  @Prop({ default: 'pending' })
  status: string;

  @Prop()
  dueDate?: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);