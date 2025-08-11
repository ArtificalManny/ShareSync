import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ActivityEventDoc extends Document {
  type: string;                 // e.g. 'task:complete', 'post:create', 'invite:sent', 'streak:levelup'
  public: boolean;              // whether it can appear in public feeds
  name?: string;                // short human label if needed
  title?: string;               // optional title (task title, post title, etc.)
  userId?: string;
  username?: string;
  projectId?: string;
  taskId?: string;
  postId?: string;
  fileId?: string;
  streakId?: string;
  xp?: number;
  meta?: any;                   // any structured extras

  createdAt: Date;
  updatedAt: Date;
}

const ActivityEventSchema = new Schema<ActivityEventDoc>(
  {
    type: { type: String, required: true, index: true },
    public: { type: Boolean, default: true, index: true },
    name: { type: String },
    title: { type: String },
    userId: { type: String, index: true },
    username: { type: String },
    projectId: { type: String, index: true },
    taskId: { type: String, index: true },
    postId: { type: String, index: true },
    fileId: { type: String, index: true },
    streakId: { type: String, index: true },
    xp: { type: Number },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ActivityEventSchema.index({ createdAt: -1 });

export const ActivityEvent: Model<ActivityEventDoc> =
  (mongoose.models.ActivityEvent as Model<ActivityEventDoc>) ||
  mongoose.model<ActivityEventDoc>('ActivityEvent', ActivityEventSchema);
