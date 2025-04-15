import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Project } from '../../projects/schemas/project.schema';

export type IdeaDocument = Idea & Document;

@Schema({ timestamps: true })
export class Idea {
  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creator: User;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Project;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const IdeaSchema = SchemaFactory.createForClass(Idea);