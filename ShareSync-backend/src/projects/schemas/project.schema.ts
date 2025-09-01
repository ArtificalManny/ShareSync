// src/projects/schemas/project.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

/** Member subdocument (role-based access) */
@Schema({ _id: false })
export class ProjectMember {
  /** Optional: internal user id (string ObjectId or external id) */
  @Prop({ type: String })
  userId?: string;

  /** Optional: email (useful before the user accepts an invite) */
  @Prop({ type: String })
  email?: string;

  /** Role within the project */
  @Prop({ type: String, enum: ['owner', 'member', 'viewer'], default: 'member' })
  role: 'owner' | 'member' | 'viewer';

  /** Audit convenience */
  @Prop({ type: Date, default: Date.now })
  addedAt?: Date;
}
export const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true }) title: string;
  @Prop() description: string;
  @Prop() category: string;
  @Prop() status: string;
  @Prop() privacy: string;

  /**
   * Members with roles. You can keep using the legacy `userId` (owner)
   * while gradually filling this array. We’ll enforce permissions via guards.
   */
  @Prop({ type: [ProjectMemberSchema], default: [] })
  members: ProjectMember[];

  /** Legacy owner id (kept for backward compatibility) */
  @Prop({ required: true })
  userId: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

/** Helpful indexes for common queries */
ProjectSchema.index({ userId: 1, updatedAt: -1 });
ProjectSchema.index({ 'members.userId': 1 });
ProjectSchema.index({ 'members.email': 1 });