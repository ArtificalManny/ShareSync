import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Project extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  admin: string;

  @Prop({ type: [String], default: [] })
  sharedWith: string[];

  @Prop({
    type: [
      {
        id: String,
        content: String,
        media: String,
        user: String,
        likes: Number,
        comments: [{ user: String, text: String }],
      },
    ],
    default: [],
  })
  announcements: {
    id: string;
    content: string;
    media?: string;
    user: string;
    likes: number;
    comments: { user: string; text: string }[];
  }[];

  @Prop({
    type: [
      {
        id: String,
        title: String,
        assignee: String,
        dueDate: Date,
        status: String,
        user: String,
        comments: [{ user: String, text: String }],
      },
    ],
    default: [],
  })
  tasks: {
    id: string;
    title: string;
    assignee: string;
    dueDate: Date;
    status: string;
    user: string;
    comments: { user: string; text: string }[];
  }[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);