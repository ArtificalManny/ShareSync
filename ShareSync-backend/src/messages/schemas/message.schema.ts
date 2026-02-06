// src/messages/schemas/message.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE SCHEMA: Individual messages with energy system
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  SYSTEM = 'system',
  TASK_LINK = 'task_link',
  CODE = 'code',
}

export enum MessageEnergy {
  URGENT = 'urgent',
  NORMAL = 'normal',
  ASYNC = 'async',
}

export const ENERGY_COSTS: Record<MessageEnergy, number> = {
  [MessageEnergy.URGENT]: 10,
  [MessageEnergy.NORMAL]: 3,
  [MessageEnergy.ASYNC]: 1,
};

export const DAILY_ENERGY_LIMIT = 100;

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class MessageAttachment {
  @Prop({ required: true })
  fileId: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop()
  mimeType?: string;

  @Prop()
  fileSize?: number;

  @Prop()
  thumbnailUrl?: string;
}

@Schema({ _id: false })
export class MessageReaction {
  @Prop({ required: true })
  emoji: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  users: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  count: number;
}

@Schema({ _id: false })
export class MessageReadReceipt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  readAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export type MessageDocument = HydratedDocument<Message>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      (ret as any).id = (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    },
  },
})
export class Message {
  @ApiProperty({ description: 'Conversation this message belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
  conversationId: Types.ObjectId;

  @ApiProperty({ description: 'Message sender' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId: Types.ObjectId;

  @ApiProperty({ description: 'Message content' })
  @Prop({ required: true, maxlength: 10000 })
  content: string;

  @ApiProperty({ enum: MessageType })
  @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @ApiProperty({ enum: MessageEnergy })
  @Prop({ type: String, enum: MessageEnergy, default: MessageEnergy.NORMAL })
  energy: MessageEnergy;

  @ApiProperty({ description: 'Energy cost for this message' })
  @Prop({ type: Number, default: 3 })
  energyCost: number;

  @ApiProperty({ description: 'Expected response time (minutes)' })
  @Prop({ type: Number })
  expectedResponseTime?: number;

  @ApiProperty({ description: 'Parent message ID (for threads)' })
  @Prop({ type: Types.ObjectId, ref: 'Message', index: true })
  threadParentId?: Types.ObjectId;

  @ApiProperty({ description: 'Number of thread replies' })
  @Prop({ type: Number, default: 0 })
  threadReplyCount: number;

  @ApiProperty({ description: 'Last reply timestamp' })
  @Prop({ type: Date })
  lastReplyAt?: Date;

  @ApiProperty({ description: 'Mentioned user IDs' })
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  mentions: Types.ObjectId[];

  @ApiProperty({ description: 'Linked task ID' })
  @Prop({ type: Types.ObjectId, ref: 'Task' })
  linkedTaskId?: Types.ObjectId;

  @ApiProperty({ description: 'Linked project ID' })
  @Prop({ type: Types.ObjectId, ref: 'Project' })
  linkedProjectId?: Types.ObjectId;

  @ApiProperty({ description: 'File attachments' })
  @Prop({ type: [MessageAttachment], default: [] })
  attachments: MessageAttachment[];

  @ApiProperty({ description: 'Message reactions' })
  @Prop({ type: [MessageReaction], default: [] })
  reactions: MessageReaction[];

  @ApiProperty({ description: 'Read receipts' })
  @Prop({ type: [MessageReadReceipt], default: [] })
  readBy: MessageReadReceipt[];

  @ApiProperty({ description: 'Has message been edited' })
  @Prop({ type: Boolean, default: false })
  isEdited: boolean;

  @ApiProperty({ description: 'Edit timestamp' })
  @Prop({ type: Date })
  editedAt?: Date;

  @ApiProperty({ description: 'Is message deleted (soft delete)' })
  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @ApiProperty({ description: 'Delete timestamp' })
  @Prop({ type: Date })
  deletedAt?: Date;

  @ApiProperty({ description: 'Client-generated ID for deduplication' })
  @Prop({ index: true })
  clientMessageId?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// INDEXES
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ threadParentId: 1, createdAt: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ mentions: 1, createdAt: -1 });
MessageSchema.index({ content: 'text' });
MessageSchema.index({ clientMessageId: 1 }, { sparse: true });

// VIRTUALS
MessageSchema.virtual('isRead').get(function () {
  return this.readBy?.length > 0;
});

MessageSchema.virtual('reactionCount').get(function () {
  return this.reactions?.reduce((sum: number, r: any) => sum + r.count, 0) || 0;
});

MessageSchema.virtual('hasAttachments').get(function () {
  return this.attachments?.length > 0;
});

// INSTANCE METHODS
MessageSchema.methods.markAsRead = function (userId: Types.ObjectId): boolean {
  const alreadyRead = this.readBy.some((r: MessageReadReceipt) => r.userId.toString() === userId.toString());
  if (!alreadyRead) {
    this.readBy.push({ userId, readAt: new Date() });
    return true;
  }
  return false;
};

MessageSchema.methods.addReaction = function (emoji: string, userId: Types.ObjectId): void {
  const existing = this.reactions.find((r: MessageReaction) => r.emoji === emoji);

  if (existing) {
    if (!existing.users.some((u: Types.ObjectId) => u.toString() === userId.toString())) {
      existing.users.push(userId);
      existing.count += 1;
    }
  } else {
    this.reactions.push({ emoji, users: [userId], count: 1 });
  }
};

MessageSchema.methods.removeReaction = function (emoji: string, userId: Types.ObjectId): boolean {
  const reaction = this.reactions.find((r: MessageReaction) => r.emoji === emoji);
  if (!reaction) return false;

  const userIndex = reaction.users.findIndex((u: Types.ObjectId) => u.toString() === userId.toString());
  if (userIndex === -1) return false;

  reaction.users.splice(userIndex, 1);
  reaction.count -= 1;

  if (reaction.count === 0) {
    const idx = this.reactions.indexOf(reaction);
    this.reactions.splice(idx, 1);
  }
  return true;
};

// PRE-SAVE HOOKS
MessageSchema.pre('save', function (next) {
  if (this.isModified('energy')) {
    this.energyCost = ENERGY_COSTS[this.energy];

    const responseTimes: Record<MessageEnergy, number> = {
      [MessageEnergy.URGENT]: 15,
      [MessageEnergy.NORMAL]: 240,
      [MessageEnergy.ASYNC]: 1440,
    };
    this.expectedResponseTime = responseTimes[this.energy];
  }

  next();
});
