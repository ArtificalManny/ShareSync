import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

// Message types
export enum MessageContext {
  DIRECT = 'dm',           // 1-on-1 private
  TEAM = 'team',           // Project-based team channel
  BROADCAST = 'broadcast'  // Company-wide
}

// Energy levels
export enum MessageEnergy {
  URGENT = 'urgent',   // Red - respond in 15min
  NORMAL = 'normal',   // Blue - respond in 4 hours
  ASYNC = 'async'      // Green - respond in 24 hours
}

@Schema({ timestamps: true })
export class Message extends Document {
  // Core fields
  @Prop({ required: true })
  conversationId: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  senderId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  recipientId?: MongooseSchema.Types.ObjectId; // For DMs

  @Prop({ required: true })
  content: string;

  // Phase 1: Message Context
  @Prop({ 
    type: String, 
    enum: Object.values(MessageContext), 
    default: MessageContext.DIRECT 
  })
  context: MessageContext;

  // Phase 1: Energy System
  @Prop({ 
    type: String, 
    enum: Object.values(MessageEnergy), 
    default: MessageEnergy.NORMAL 
  })
  energy: MessageEnergy;

  @Prop({ default: 0 })
  energyCost: number; // Deducted from sender's daily energy pool

  // Threading
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Message' })
  threadParentId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'Message', default: [] })
  threadReplies: MongooseSchema.Types.ObjectId[];

  // Metadata
  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop()
  editedAt?: Date;

  // Reactions (for later phases)
  @Prop({ type: Object, default: {} })
  reactions: Record<string, string[]>; // { '👍': ['userId1', 'userId2'] }
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for performance
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, createdAt: -1 });
MessageSchema.index({ threadParentId: 1 });
