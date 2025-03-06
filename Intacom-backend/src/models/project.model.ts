import { Schema, model, Document } from 'mongoose';

export interface Project extends Document {
  name: string;
  description: string;
  admin: string;
  sharedWith: string[];
  announcements: {
    content: string;
    media?: string;
    user: string;
    likes: number;
    comments: { user: string; text: string }[];
  }[];
  tasks: {
    title: string;
    assignee: string;
    dueDate: Date;
    status: string;
    user: string;
    comments: { user: string; text: string }[];
  }[];
}

const ProjectSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  admin: { type: String, required: true },
  sharedWith: [{ type: String }],
  announcements: [{
    content: String,
    media: String,
    user: String,
    likes: { type: Number, default: 0 },
    comments: [{ user: String, text: String }],
  }],
  tasks: [{
    title: String,
    assignee: String,
    dueDate: Date,
    status: { type: String, default: 'In Progress' },
    user: String,
    comments: [{ user: String, text: String }],
  }],
});

export default model<Project>('Project', ProjectSchema);