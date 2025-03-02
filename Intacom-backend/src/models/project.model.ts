import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Project extends Document {
  @Prop({ required: true })
  name!: string; // Use ! to indicate it will be assigned

  @Prop({ required: true })
  description!: string; // Use ! to indicate it will be assigned

  @Prop({ required: true })
  admin!: string; // Use ! to indicate it will be assigned

  @Prop()
  sharedWith?: string[]; // Optional with ?

  @Prop()
  announcements?: {
    id: number;
    content: string;
    media: string;
    likes: number;
    comments: { user: string; text: string }[];
    user: string;
  }[]; // Optional with ?

  @Prop()
  tasks?: {
    id: number;
    title: string;
    assignee: string;
    dueDate: Date;
    status: string;
    comments: { user: string; text: string }[];
    user: string;
  }[]; // Optional with ?
}

export const ProjectSchema = SchemaFactory.createForClass(Project);