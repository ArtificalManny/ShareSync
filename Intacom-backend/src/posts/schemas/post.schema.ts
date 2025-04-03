import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  content: string;

  @Prop([String])
  images: string[];

  @Prop({ default: 0 })
  likes: number;

  @Prop([String])
  likedBy: string[];

  @Prop({ default: 0 })
  comments: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);