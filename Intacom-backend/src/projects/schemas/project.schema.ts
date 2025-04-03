import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  admin: string;

  @Prop({ type: [{ userId: String, role: String }] })
  sharedWith: { userId: string; role: string }[];

  @Prop({ default: 'current' })
  status: string;

  @Prop()
  color: string;

  @Prop([String])
  tasks: string[];

  @Prop({ type: Object })
  timeline: {
    startDate: string;
    endDate: string;
    milestones: { name: string; date: string }[];
  };

  @Prop({ default: 0 })
  likes: number;

  @Prop({ default: 0 })
  comments: number;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);