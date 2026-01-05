import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as crypto from 'crypto';

export type InvitationDocument = Invitation & Document;

export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

@Schema({ timestamps: true })
export class Invitation {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  project: Types.ObjectId;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  email: string;

  @Prop({ enum: ['admin', 'member'], default: 'member' })
  role: 'admin' | 'member';

  @Prop({ enum: ['pending', 'accepted', 'revoked', 'expired'], default: 'pending', index: true })
  status: InvitationStatus;

  @Prop({ required: true, unique: true, index: true })
  token: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy: Types.ObjectId;

  @Prop({ type: Date, index: true })
  expiresAt: Date;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);

InvitationSchema.index({ project: 1, email: 1, status: 1 });

// helper (optional)
export function generateInviteToken() {
  return crypto.randomBytes(24).toString('hex');
}
