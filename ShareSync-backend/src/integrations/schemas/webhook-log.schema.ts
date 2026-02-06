// src/integrations/schemas/webhook-log.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOK LOG SCHEMA: Audit trail for webhook events
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WebhookLogDocument = WebhookLog & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString?.() ?? String(ret._id);
      delete ret.__v;
      return ret;
    },
  },
})
export class WebhookLog {
  @Prop({ type: Types.ObjectId, ref: 'Integration', required: true, index: true })
  integrationId: Types.ObjectId;

  @Prop({ required: true })
  eventType: string;

  @Prop({ type: String, enum: ['inbound', 'outbound'], required: true })
  direction: string;

  @Prop({ type: Object })
  payload: Record<string, any>;

  @Prop({ type: Object })
  headers?: Record<string, any>;

  @Prop({ type: Number })
  statusCode?: number;

  @Prop({ type: String, enum: ['success', 'failed', 'pending'], default: 'pending' })
  status: string;

  @Prop()
  errorMessage?: string;

  @Prop({ type: Number })
  processingTimeMs?: number;

  @Prop({ type: Number, default: 0 })
  retryCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export const WebhookLogSchema = SchemaFactory.createForClass(WebhookLog);

// Indexes
WebhookLogSchema.index({ integrationId: 1, createdAt: -1 });
WebhookLogSchema.index({ eventType: 1, status: 1 });
WebhookLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days TTL
