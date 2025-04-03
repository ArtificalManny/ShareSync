import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  author: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  image?: string;

  @Prop({ required: true })
  author: string;

  @Prop({ type: [String], default: [] })
  likes: string[];

  @Prop({ type: [CommentSchema], default: [] })
  comments: Comment[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);