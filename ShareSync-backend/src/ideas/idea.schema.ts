import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from '../users/user.schema';
import { Project } from '../projects/schemas/project.schema';

@Schema()
export class Idea extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, ref: 'User', required: true })
  creator: string;

  @Prop({ type: String, ref: 'Project' })
  project?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const IdeaSchema = SchemaFactory.createForClass(Idea);