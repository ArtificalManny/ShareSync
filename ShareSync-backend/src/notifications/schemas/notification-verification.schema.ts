import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VerificationChannel = 'email' | 'sms';

@Schema({ timestamps: true })
export class NotificationVerification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ['email', 'sms'], required: true, index: true })
  channel: VerificationChannel;

  // Email address or phone number
  @Prop({ type: String, required: true })
  destination: string;

  // sha256(secret + ":" + code) — never store plaintext
  @Prop({ type: String, required: true })
  codeHash: string;

  @Prop({ type: Number, default: 0 })
  attempts: number;

  // Expire automatically (TTL index below)
  @Prop({ type: Date, required: true, index: true })
  expiresAt: Date;
}

export type NotificationVerificationDocument = NotificationVerification & Document;
export const NotificationVerificationSchema = SchemaFactory.createForClass(NotificationVerification);

// TTL cleanup: Mongo will delete after expiresAt
NotificationVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Useful compound index for lookups
NotificationVerificationSchema.index({ userId: 1, channel: 1, destination: 1 });
