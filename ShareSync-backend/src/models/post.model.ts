import mongoose, { Schema, Document, Model } from 'mongoose';

export interface PostDoc extends Document {
  projectId: string;
  type: 'announcement' | 'update';
  content: string;
  author?: string;           // username or email
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<PostDoc>(
  {
    projectId: { type: String, required: true, index: true },
    type: { type: String, enum: ['announcement', 'update'], required: true },
    content: { type: String, required: true },
    author: { type: String },
  },
  { timestamps: true }
);

export const Post: Model<PostDoc> =
  (mongoose.models.Post as Model<PostDoc>) ||
  mongoose.model<PostDoc>('Post', PostSchema);
