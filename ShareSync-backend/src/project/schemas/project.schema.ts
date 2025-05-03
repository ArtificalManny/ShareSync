import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Post {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  category: string;

  @Prop()
  userId: string;
}

@Schema()
export class Project extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  sharedWith: string[];

  @Prop({ type: [Post], default: [] })
  posts: Post[];

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
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
export type ProjectDocument = Project & Document;