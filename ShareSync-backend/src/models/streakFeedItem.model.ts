// src/models/streakFeedItem.model.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ReplyDoc {
  userId?: string;
  username?: string;
  avatar?: string;
  message: string;
  timestamp: Date;
}

export interface StreakFeedItemDoc extends Document {
  // core
  type: 'streak' | 'levelUp' | 'taskComplete';
  public?: boolean;

  // who/where
  userId?: string;
  username?: string;
  projectId?: string;
  taskId?: string;
  postId?: string;

  // backref to ActivityEvent if present
  activityId?: string;

  // freeform extras
  meta?: any;

  // social
  reactions: Map<string, string[]>;  // emoji -> usernames[]
  replies: ReplyDoc[];

  // timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema<ReplyDoc>(
  {
    userId: { type: String },
    username: { type: String },
    avatar: { type: String },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const StreakFeedItemSchema = new Schema<StreakFeedItemDoc>(
  {
    type: { type: String, enum: ['streak', 'levelUp', 'taskComplete'], required: true, index: true },
    public: { type: Boolean, default: true, index: true },

    userId: { type: String, index: true },
    username: { type: String },
    projectId: { type: String, index: true },
    taskId: { type: String, index: true },
    postId: { type: String, index: true },

    activityId: { type: String, index: true },

    meta: { type: Schema.Types.Mixed },

    reactions: {
      type: Map,
      of: [String],
      default: {},
    },

    replies: { type: [ReplySchema], default: [] },
  },
  { timestamps: true } // ✅ gives us createdAt / updatedAt
);

// Fast newest-first + common filters
StreakFeedItemSchema.index({ createdAt: -1 });
StreakFeedItemSchema.index({ type: 1, createdAt: -1 });

export const StreakFeedItem: Model<StreakFeedItemDoc> =
  (mongoose.models.StreakFeedItem as Model<StreakFeedItemDoc>) ||
  mongoose.model<StreakFeedItemDoc>('StreakFeedItem', StreakFeedItemSchema);
