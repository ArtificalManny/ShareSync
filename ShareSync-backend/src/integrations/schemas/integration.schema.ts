// src/integrations/schemas/integration.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION SCHEMA: External service connections
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum IntegrationType {
  GITHUB = 'github',
  SLACK = 'slack',
  DISCORD = 'discord',
  JIRA = 'jira',
  TRELLO = 'trello',
  GOOGLE_CALENDAR = 'google_calendar',
  OUTLOOK = 'outlook',
  WEBHOOK = 'webhook',
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending',
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class IntegrationCredentials {
  @Prop()
  accessToken?: string;

  @Prop()
  refreshToken?: string;

  @Prop({ type: Date })
  tokenExpiry?: Date;

  @Prop()
  apiKey?: string;

  @Prop()
  webhookSecret?: string;

  @Prop()
  webhookUrl?: string;
}

@Schema({ _id: false })
export class IntegrationSettings {
  @Prop({ type: Boolean, default: true })
  notifyOnTaskComplete?: boolean;

  @Prop({ type: Boolean, default: true })
  notifyOnMention?: boolean;

  @Prop({ type: Boolean, default: false })
  syncTwoWay?: boolean;

  @Prop()
  defaultChannel?: string; // For Slack/Discord

  @Prop()
  repository?: string; // For GitHub

  @Prop()
  workspace?: string;

  @Prop({ type: Object })
  customSettings?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export type IntegrationDocument = Integration & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_: any, ret: any) => {
      // Consistent "id" field for API clients
      ret.id = ret._id?.toString?.() ?? String(ret._id);
      delete ret.__v;

      // Never expose credentials
      delete ret.credentials;

      return ret;
    },
  },
})
export class Integration {
  @ApiProperty({ enum: IntegrationType })
  @Prop({ type: String, enum: IntegrationType, required: true })
  type: IntegrationType;

  @ApiProperty({ description: 'Display name' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ enum: IntegrationStatus })
  @Prop({ type: String, enum: IntegrationStatus, default: IntegrationStatus.PENDING })
  status: IntegrationStatus;

  @ApiProperty({ description: 'Project ID (optional, for project-level integrations)' })
  @Prop({ type: Types.ObjectId, ref: 'Project', index: true })
  projectId?: Types.ObjectId;

  @ApiProperty({ description: 'User who set up the integration' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: IntegrationCredentials })
  credentials: IntegrationCredentials;

  @Prop({ type: IntegrationSettings, default: {} })
  settings: IntegrationSettings;

  @Prop()
  externalUserId?: string;

  @Prop()
  externalWorkspaceId?: string;

  @Prop()
  lastError?: string;

  @Prop({ type: Date })
  lastSyncAt?: Date;

  @Prop({ type: Number, default: 0 })
  syncCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export const IntegrationSchema = SchemaFactory.createForClass(Integration);

// Indexes
IntegrationSchema.index({ userId: 1, type: 1 });
IntegrationSchema.index({ projectId: 1, type: 1 });
IntegrationSchema.index({ type: 1, status: 1 });
