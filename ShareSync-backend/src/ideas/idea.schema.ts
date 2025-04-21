import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from '../schemas/user.schema'; // Corrected path

@Schema()
export class Idea extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: String, ref: 'User', required: true })
  userId: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const IdeaSchema = SchemaFactory.createForClass(Idea);