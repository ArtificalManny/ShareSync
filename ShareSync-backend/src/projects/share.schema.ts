import { Schema, model } from 'mongoose';

export const ProjectShareSchema = new Schema(
  {
    projectId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
    // optional: expire links (null = never)
    expiresAt: { type: Date, default: null },
  },
  { collection: 'project_shares' }
);
