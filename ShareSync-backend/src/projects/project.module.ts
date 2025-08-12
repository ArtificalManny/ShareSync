// src/projects/project.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectController } from './project.controller'
import { Schema } from 'mongoose';

// Minimal Project schema for dev. If you already have one, keep yours instead.
const ProjectSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: '' },
    status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
    privacy: { type: String, enum: ['Private', 'Public'], default: 'Private' },
    members: { type: [{ email: String, role: String }], default: [] },
    ownerId: { type: String },
  },
  { timestamps: true }
);

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Project', schema: ProjectSchema }]),
  ],
  controllers: [ProjectController],
})
export class ProjectModule {}