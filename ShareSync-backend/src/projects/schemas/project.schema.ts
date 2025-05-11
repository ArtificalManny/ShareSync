import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Post {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  category: string;

  @Prop()
  userId: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: [{ userId: String, content: String, createdAt: Date }], default: [] })
  comments: { userId: string; content: string; createdAt: Date }[];

  @Prop({ default: 0 })
  likes: number;
}

@Schema()
export class Subtask {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ default: 'To Do' })
  status: string;
}

@Schema()
export class Task {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  assignedTo: string[];

  @Prop({ default: 'To Do' })
  status: string;

  @Prop({ type: [Subtask], default: [] })
  subtasks: Subtask[];

  @Prop({ type: [{ userId: String, content: String, createdAt: Date }], default: [] })
  comments: { userId: string; content: string; createdAt: Date }[];

  @Prop({ default: 0 })
  likes: number;
}

@Schema()
export class Team {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  members: string[];
}

@Schema()
export class File {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  uploadedBy: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ timestamps: true })
export class Activity {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  userId: string;

  @Prop()
  details: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: 'In Progress' })
  status: string;

  @Prop({ type: [String], default: [] })
  sharedWith: string[];

  @Prop({ type: [Post], default: [] })
  posts: Post[];

  @Prop({ type: [Task], default: [] })
  tasks: Task[];

  @Prop({ type: [Team], default: [] })
  teams: Team[];

  @Prop({ type: [File], default: [] })
  files: File[];

  @Prop({ type: [Activity], default: [] })
  activityLog: Activity[];

  @Prop({ default: 0 })
  tasksCompleted: number;

  @Prop({ default: false })
  completed: boolean;

  @Prop()
  userId: string;

  @Prop()
  announcement: string;

  @Prop()
  snapshot: string;

  @Prop({ type: [String], default: [] })
  admins: string[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
export type ProjectDocument = Project & Document;