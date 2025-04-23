import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  ownerId: string;

  @Prop([String])
  members?: string[];

  @Prop([{ type: { type: String }, message: String, timestamp: Date }])
  teamActivities?: { type: string; message: string; timestamp: Date }[];

  @Prop([{ message: String, timestamp: Date, postedBy: String }])
  announcements?: { message: string; timestamp: Date; postedBy: string }[];

  @Prop()
  snapshot?: string;

  @Prop()
  category?: string; // e.g., School, Job, Personal

  @Prop()
  status?: string; // e.g., In Progress, Completed
}

export const ProjectSchema = SchemaFactory.createForClass(Project);