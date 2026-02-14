// src/messages/schemas/direct-message.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// DIRECT MESSAGE SCHEMA
// Note: This schema is for future direct message features
// Current messaging uses Message schema - this is kept for compatibility
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class MessageAttachment {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  size: number;

  @Prop()
  thumbnailUrl?: string;

  @Prop()
  mimeType?: string;
}

export const MessageAttachmentSchema = SchemaFactory.createForClass(MessageAttachment);

@Schema({ timestamps: true })
export class DirectMessage {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId: Types.ObjectId;

  @Prop({ required: true, maxlength: 10000 })
  content: string;

  @Prop({ type: [MessageAttachmentSchema], default: [] })
  attachments: MessageAttachment[];

  @Prop({ type: Boolean, default: false })
  isEdited: boolean;

  @Prop({ type: Date })
  editedAt?: Date;

  @Prop({ type: Date })
  readAt?: Date;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  // Client-side deduplication ID
  @Prop({ type: String, index: true, sparse: true })
  clientMessageId?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type DirectMessageDocument = DirectMessage & Document;
export const DirectMessageSchema = SchemaFactory.createForClass(DirectMessage);

// Indexes for efficient queries
DirectMessageSchema.index({ conversationId: 1, createdAt: -1 });
DirectMessageSchema.index({ senderId: 1 });
DirectMessageSchema.index({ conversationId: 1, readAt: 1 });
DirectMessageSchema.index({ conversationId: 1, isDeleted: 1, createdAt: -1 });
