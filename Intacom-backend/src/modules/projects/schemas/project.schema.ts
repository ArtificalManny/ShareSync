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
  admin: string; // User ID of the project admin

  @Prop({ type: [{ userId: String, role: String }] })
  sharedWith: { userId: string; role: string }[]; // Collaborators

  @Prop({ default: 'current' })
  status: string; // e.g., "current", "completed"

  @Prop()
  color: string; // Project color for UI

  @Prop([String])
  tasks: string[]; // Task IDs (to be added in TaskSchema)

  @Prop({ type: Object })
  timeline: {
    startDate: string;
    endDate: string;
    milestones: { name: string; date: string }[];
  }; // For Asana-like timelines

  @Prop({ default: 0 })
  likes: number; // For social engagement

  @Prop({ default: 0 })
  comments: number; // For social engagement
}

export const ProjectSchema = SchemaFactory.createForClass(Project);