import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Schema, Types } from 'mongoose';

import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

// --- Embedded sub-schemas ---
const UpdateSchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true },
    text: { type: String, required: true },
    mentions: { type: [String], default: [] },
    files: { type: [String], default: [] },
    userId: { type: String, default: '' },
  },
  { _id: false, timestamps: true }
);

const TaskSchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
    },
    assigneeId: { type: String, default: '' },
    dueDate: { type: Date },
  },
  { _id: false, timestamps: true }
);

// --- Project schema (embedded arrays) ---
const ProjectSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
    },
    privacy: { type: String, enum: ['Private', 'Public'], default: 'Private' },
    members: { type: [{ email: String, role: String }], default: [] },
    userId: { type: String }, // owner
    updates: { type: [UpdateSchema], default: [] },
    tasks: { type: [TaskSchema], default: [] },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Project', schema: ProjectSchema }]),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}