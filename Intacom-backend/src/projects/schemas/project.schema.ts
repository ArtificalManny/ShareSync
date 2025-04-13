import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema()
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  creatorEmail: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  timeline: { date: string; event: string }[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);