import mongoose, { Schema, Document, Model } from 'mongoose';

export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface TaskComment {
  text: string;
  user: string;           // username or email
  timestamp: Date;
}

export interface Subtask {
  title: string;
  done: boolean;
}

export interface TaskDoc extends Document {
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignedTo?: string;     // email/username/id
  dueDate?: Date;
  likes?: number;
  shares?: number;
  comments: TaskComment[];
  subtasks: Subtask[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<TaskComment>(
  {
    text: { type: String, required: true },
    user: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SubtaskSchema = new Schema<Subtask>(
  {
    title: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: true }
);

const TaskSchema = new Schema<TaskDoc>(
  {
    projectId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
      index: true,
    },
    assignedTo: String,
    dueDate: Date,
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: [CommentSchema], default: [] },
    subtasks: { type: [SubtaskSchema], default: [] },
  },
  { timestamps: true }
);

export const Task: Model<TaskDoc> =
  (mongoose.models.Task as Model<TaskDoc>) ||
  mongoose.model<TaskDoc>('Task', TaskSchema);
