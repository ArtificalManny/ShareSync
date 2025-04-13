import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema()
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  creatorEmail: string;

  @Prop({ type: [String], default: [] })
  sharedWith: string[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);