// src/projects/schemas/project.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

export type ProjectRole = 'owner' | 'member' | 'viewer';

export interface ProjectMember {
  userId?: string;      // preferred when user exists
  email?: string;       // fallback for invited emails
  role: ProjectRole;    // owner | member | viewer
  addedAt: Date;
}

export type ProjectInviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface ProjectInvite {
  email: string;
  role: Exclude<ProjectRole, 'owner'>; // 'member' | 'viewer'
  token: string;
  status: ProjectInviteStatus;
  invitedBy?: string;         // actingUserId
  createdAt: Date;
  expiresAt?: Date;
  acceptedByUserId?: string;
}

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true }) title: string;
  @Prop() description: string;
  @Prop() category: string;
  @Prop() status: string;
  @Prop() privacy: string;

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

  // Owner (legacy field; also duplicated in members[0] with role=owner)
  @Prop({ required: true }) userId: string;

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
}

export const ProjectSchema = SchemaFactory.createForClass(Project);