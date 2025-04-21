import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Activity extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  action: string;

  @Prop()
  projectId?: string;

  @Prop()
  taskId?: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);