// /Users/artificalmanny/Portfolio/ShareSync/ShareSync-backend/src/utils/activityLogger.ts
import type { Server } from 'socket.io';
import mongoose, { Schema, Model, Document } from 'mongoose';

/** ===== Types ===== */
export interface ActivityDoc extends Document {
  type: string;
  userId?: string;
  username?: string;
  projectId?: string;
  taskId?: string;
  postId?: string;
  fileId?: string;
  teamId?: string;
  suggestionId?: string;
  title?: string;
  name?: string;
  status?: string;
  target?: string;     // e.g. invited email
  public: boolean;
  meta?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface StreakEventDoc extends Document {
  type: string;
  userId?: string;
  username?: string;
  projectId?: string;
  title?: string;
  xp?: number;
  tier?: string;
  createdAt: Date;
  updatedAt: Date;
}

type LogPayload = Partial<Omit<ActivityDoc, keyof Document | 'createdAt' | 'updatedAt'>> & {
  type: string;
  public?: boolean;
};

/** ===== Schemas & Models ===== */
const ActivitySchema = new Schema<ActivityDoc>(
  {
    type: { type: String, required: true },
    userId: String,
    username: String,
    projectId: String,
    taskId: String,
    postId: String,
    fileId: String,
    teamId: String,
    suggestionId: String,
    title: String,
    name: String,
    status: String,
    target: String,
    public: { type: Boolean, default: false },
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

const StreakEventSchema = new Schema<StreakEventDoc>(
  {
    type: { type: String, required: true },
    userId: String,
    username: String,
    projectId: String,
    title: String,
    xp: Number,
    tier: String,
  },
  { timestamps: true }
);

// ✅ Cast models to concrete Model types to avoid the union-callable error
export const Activity: Model<ActivityDoc> =
  (mongoose.models.Activity as Model<ActivityDoc>) ||
  mongoose.model<ActivityDoc>('Activity', ActivitySchema);

export const StreakEvent: Model<StreakEventDoc> =
  (mongoose.models.StreakEvent as Model<StreakEventDoc>) ||
  mongoose.model<StreakEventDoc>('StreakEvent', StreakEventSchema);

/** ===== Socket wiring ===== */
let ioRef: Server | null = null;
export const initActivityLogger = (io: Server) => {
  ioRef = io;
};

/** ===== Logger ===== */
export async function logActivity(payload: LogPayload) {
  // Persist unified activity
  const doc = await Activity.create({
    type: payload.type,
    userId: payload.userId,
    username: payload.username,
    projectId: payload.projectId,
    taskId: payload.taskId,
    postId: payload.postId,
    fileId: payload.fileId,
    teamId: payload.teamId,
    suggestionId: payload.suggestionId,
    title: payload.title,
    name: payload.name,
    status: payload.status,
    target: payload.target,
    public: Boolean(payload.public),
    meta: payload.meta ?? undefined,
  } as ActivityDoc);

  // Optionally mirror to public streak feed
  if (payload.public) {
    await StreakEvent.create({
      type: payload.type,
      userId: payload.userId,
      username: payload.username,
      projectId: payload.projectId,
      title: payload.title,
    } as StreakEventDoc);
  }

  // Broadcast to clients
  if (ioRef) {
    ioRef.emit('activity:event', {
      ...payload,
      _id: doc._id,
      createdAt: doc.createdAt,
    });
  }

  return doc;
}
