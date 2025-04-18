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

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  completedBy: string;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop()
  completedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);