// backend/src/projects/schemas/project.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

export type ProjectRole = 'owner' | 'member' | 'viewer';

export interface ProjectMember {
  userId?: string;
  email?: string;
  role: ProjectRole;
  addedAt: Date;
}

export type ProjectInviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface ProjectInvite {
  email: string;
  role: Exclude<ProjectRole, 'owner'>;
  token: string;
  status: ProjectInviteStatus;
  invitedBy?: string;
  createdAt: Date;
  expiresAt?: Date;
  acceptedByUserId?: string;
}

type ProjectIcon = { kind: 'emoji' | 'svg'; value: string };

interface ProjectMetrics {
  openTasks: number;
  onTimePct: number;
  throughputPerWeek: number;
}

interface ProjectTask {
  title: string;
  description?: string;
  dueDate?: Date;
  completedAt?: Date;
  assignee?: string;
}

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;

  @Prop()
  category: string;

  @Prop({ default: 'Not Started' })
  status: string;

  @Prop({ default: 'Private' })
  privacy: string;

  @Prop({
    type: {
      kind: { type: String, enum: ['emoji', 'svg'] },
      value: { type: String },
    },
    default: null,
  })
  icon?: ProjectIcon | null;

  @Prop({
    type: [{
      userId: String,
      email: String,
      role: { type: String, enum: ['owner', 'member', 'viewer'], default: 'member' },
      addedAt: { type: Date, default: Date.now },
    }],
    default: [],
  })
  members: ProjectMember[];

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    type: [{
      email: { type: String, required: true },
      role: { type: String, enum: ['member', 'viewer'], default: 'member' },
      token: { type: String, required: true },
      status: { type: String, enum: ['pending', 'accepted', 'revoked', 'expired'], default: 'pending' },
      invitedBy: String,
      createdAt: { type: Date, default: Date.now },
      expiresAt: Date,
      acceptedByUserId: String,
    }],
    default: [],
  })
  invites: ProjectInvite[];

  @Prop({ type: Boolean, default: false })
  publicEnabled: boolean;

  @Prop({ type: String, default: null, index: true, sparse: true })
  publicToken: string | null;

  @Prop({ type: Date })
  publicLastEnabledAt?: Date;

  @Prop({ type: Date })
  shippedAt?: Date;

  @Prop({
    type: [{
      title: { type: String, required: true },
      description: String,
      dueDate: Date,
      completedAt: Date,
      assignee: String,
    }],
    default: [],
  })
  tasks: ProjectTask[];

  @Prop({
    type: {
      openTasks: { type: Number, default: 0 },
      onTimePct: { type: Number, default: 0 },
      throughputPerWeek: { type: Number, default: 0 },
    },
    default: {},
  })
  metrics: ProjectMetrics;

  @Prop() createdAt?: Date;
  @Prop() updatedAt?: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ userId: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ updatedAt: -1 });
ProjectSchema.index({ 'members.userId': 1 });
ProjectSchema.index({ title: 'text', description: 'text' });