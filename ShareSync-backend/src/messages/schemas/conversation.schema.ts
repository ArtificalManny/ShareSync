// src/messages/schemas/conversation.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION SCHEMA: Manages chat threads between users/teams
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  PROJECT = 'project',
  TASK = 'task',
}

@Schema({ _id: false })
export class ConversationParticipant {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  joinedAt: Date;

  @Prop({ type: Date })
  lastReadAt?: Date;

  @Prop({ type: Number, default: 0 })
  unreadCount: number;

  @Prop({ type: Boolean, default: false })
  isMuted: boolean;

  @Prop({ type: Boolean, default: false })
  isPinned: boolean;

  @Prop({ type: Boolean, default: false })
  isArchived: boolean;

  @Prop({ type: Boolean, default: true })
  notificationsEnabled: boolean;
}

@Schema({ _id: false })
export class LastMessagePreview {
  @Prop({ type: Types.ObjectId, ref: 'Message' })
  messageId?: Types.ObjectId;

  @Prop()
  content?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  senderId?: Types.ObjectId;

  @Prop()
  senderName?: string;

  @Prop({ type: Date })
  sentAt?: Date;
}

export interface ConversationMethods {
  isParticipant(userId: string): boolean;
  getParticipant(userId: string): ConversationParticipant | undefined;
  addParticipant(userId: Types.ObjectId): void;
  removeParticipant(userId: string): boolean;
  incrementUnread(excludeUserId: string): void;
  markAsRead(userId: string): void;
}

export interface ConversationStatics {
  findDirectConversation(
    userId1: string,
    userId2: string,
  ): Promise<ConversationDocument | null>;

  findOrCreateDirect(
    userId1: string,
    userId2: string,
  ): Promise<ConversationDocument>;

  findUserConversations(userId: string, includeArchived?: boolean): any;
}

export type ConversationDocument = HydratedDocument<Conversation, ConversationMethods>;

// ✅ IMPORTANT: This is the model type Nest should use when injecting the model
export type ConversationModel = Model<ConversationDocument, {}, ConversationMethods> & ConversationStatics;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      (ret as any).id = String((ret as any)._id);
      delete (ret as any).__v;
      return ret;
    },
  },
})
export class Conversation {
  @ApiProperty({ enum: ConversationType })
  @Prop({ type: String, enum: ConversationType, required: true, index: true })
  type: ConversationType;

  @ApiProperty({ description: 'Conversation name (for groups/channels)' })
  @Prop({ trim: true, maxlength: 100 })
  name?: string;

  @ApiProperty({ description: 'Conversation description' })
  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @ApiProperty({ description: 'Conversation icon/avatar' })
  @Prop()
  icon?: string;

  @ApiProperty({ description: 'Conversation participants' })
  @Prop({ type: [ConversationParticipant], default: [] })
  participants: ConversationParticipant[];

  @ApiProperty({ description: 'Creator of the conversation' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @ApiProperty({ description: 'Linked project ID (for project channels)' })
  @Prop({ type: Types.ObjectId, ref: 'Project', index: true })
  projectId?: Types.ObjectId;

  @ApiProperty({ description: 'Linked task ID (for task threads)' })
  @Prop({ type: Types.ObjectId, ref: 'Task', index: true })
  taskId?: Types.ObjectId;

  @ApiProperty({ description: 'Last message preview' })
  @Prop({ type: LastMessagePreview, default: {} })
  lastMessage: LastMessagePreview;

  @ApiProperty({ description: 'Last activity timestamp' })
  @Prop({ type: Date, default: Date.now, index: true })
  lastActivityAt: Date;

  @ApiProperty({ description: 'Is conversation active' })
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Total message count' })
  @Prop({ type: Number, default: 0 })
  messageCount: number;

  createdAt: Date;
  updatedAt: Date;
}

// ✅ give SchemaFactory the generics so statics become visible in TS
export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ 'participants.userId': 1, lastActivityAt: -1 });
ConversationSchema.index({ projectId: 1, type: 1 });
ConversationSchema.index({ taskId: 1 });
ConversationSchema.index({ type: 1, 'participants.userId': 1 });

ConversationSchema.virtual('participantCount').get(function () {
  return this.participants?.length || 0;
});

ConversationSchema.methods.isParticipant = function (userId: string): boolean {
  return this.participants.some(
    (p: ConversationParticipant) => p.userId.toString() === userId,
  );
};

ConversationSchema.methods.getParticipant = function (
  userId: string,
): ConversationParticipant | undefined {
  return this.participants.find(
    (p: ConversationParticipant) => p.userId.toString() === userId,
  );
};

ConversationSchema.methods.addParticipant = function (userId: Types.ObjectId): void {
  if (!this.isParticipant(userId.toString())) {
    this.participants.push({
      userId,
      joinedAt: new Date(),
      unreadCount: 0,
      isMuted: false,
      isPinned: false,
      isArchived: false,
      notificationsEnabled: true,
    });
  }
};

ConversationSchema.methods.removeParticipant = function (userId: string): boolean {
  const index = this.participants.findIndex(
    (p: ConversationParticipant) => p.userId.toString() === userId,
  );
  if (index !== -1) {
    this.participants.splice(index, 1);
    return true;
  }
  return false;
};

ConversationSchema.methods.incrementUnread = function (excludeUserId: string): void {
  for (const participant of this.participants) {
    if (participant.userId.toString() !== excludeUserId) {
      participant.unreadCount += 1;
    }
  }
};

ConversationSchema.methods.markAsRead = function (userId: string): void {
  const participant = this.getParticipant(userId);
  if (participant) {
    participant.unreadCount = 0;
    participant.lastReadAt = new Date();
  }
};

ConversationSchema.statics.findDirectConversation = async function (
  userId1: string,
  userId2: string,
): Promise<ConversationDocument | null> {
  return this.findOne({
    type: ConversationType.DIRECT,
    'participants.userId': {
      $all: [new Types.ObjectId(userId1), new Types.ObjectId(userId2)],
    },
    $expr: { $eq: [{ $size: '$participants' }, 2] },
  });
};

ConversationSchema.statics.findOrCreateDirect = async function (
  userId1: string,
  userId2: string,
): Promise<ConversationDocument> {
  // ✅ Use "this" as ConversationModel so TS sees custom statics
  const self = this as unknown as ConversationModel;

  let conversation = await self.findDirectConversation(userId1, userId2);

  if (!conversation) {
    conversation = new self({
      type: ConversationType.DIRECT,
      participants: [
        { userId: new Types.ObjectId(userId1), joinedAt: new Date(), unreadCount: 0 },
        { userId: new Types.ObjectId(userId2), joinedAt: new Date(), unreadCount: 0 },
      ],
      lastActivityAt: new Date(),
      isActive: true,
      messageCount: 0,
    });
    await conversation.save();
  }

  return conversation;
};

ConversationSchema.statics.findUserConversations = function (
  userId: string,
  includeArchived: boolean = false,
) {
  const query: any = {
    'participants.userId': new Types.ObjectId(userId),
    isActive: true,
  };

  if (!includeArchived) {
    query['participants'] = {
      $elemMatch: {
        userId: new Types.ObjectId(userId),
        isArchived: { $ne: true },
      },
    };
  }

  return this.find(query).sort({ lastActivityAt: -1 });
};
