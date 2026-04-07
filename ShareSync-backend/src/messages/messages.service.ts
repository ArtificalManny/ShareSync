// src/messages/messages.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES SERVICE
// ⭐ PHASE 2A: Added AppGateway integration for real-time WebSocket emissions
// ⭐ PATCH: Populate canonical user avatar field(s) for messaging payloads
// ⭐ THE FIX: Schema-perfect DB Notifications & Direct Server Emissions
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Message,
  MessageDocument,
  MessageEnergy,
  ENERGY_COSTS,
} from './schemas/message.schema';
import {
  Conversation,
  ConversationDocument,
  ConversationType,
} from './schemas/conversation.schema';
import {
  CreateConversationDto,
  SendMessageDto,
  EditMessageDto,
  ConversationSettingsDto,
} from './dto/message.dto';

// ⭐ PHASE 2A: Import AppGateway for real-time emissions
import { AppGateway } from '../gateway/app.gateway';

export interface MessagesQueryOptions {
  limit?: number;
  before?: string;
  after?: string;
}

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  private readonly userPopulateFields =
    'firstName lastName username email profilePicture avatar avatarUrl photoUrl image';

  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    private readonly eventEmitter: EventEmitter2,
    @Optional() private readonly appGateway?: AppGateway,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // ⭐ PHASE 2A: REAL-TIME EMISSION HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private emitToConversation(conversationId: string, event: string, payload: any): void {
    if (this.appGateway && this.appGateway.server) {
      this.appGateway.server.to(`conversation:${conversationId}`).emit(event, payload);
    }
  }

  private emitToUser(userId: string, event: string, payload: any): void {
    if (this.appGateway && this.appGateway.server) {
      this.appGateway.server.to(userId).emit(event, payload);
    }
  }

  private emitNewMessage(conversationId: string, message: any): void {
    if (this.appGateway && this.appGateway.server) {
      // Broadcast to the conversation room
      this.appGateway.server.to(`conversation:${conversationId}`).emit('new_message', message);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERNAL HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private normalizeId(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value instanceof Types.ObjectId) return value.toString();
    if (typeof value?.toString === 'function') return value.toString();
    return String(value);
  }

  private participantMatchesUser(participant: any, userId: string): boolean {
    const pid = participant?.userId;
    const candidate = pid?._id ? pid._id : pid;
    return this.normalizeId(candidate) === this.normalizeId(userId);
  }

  private isParticipant(conversation: any, userId: string): boolean {
    const participants = (conversation as any)?.participants || [];
    return participants.some((p: any) => this.participantMatchesUser(p, userId));
  }

  private addParticipantToConversation(conversation: any, newParticipantId: string): void {
    const convAny = conversation as any;
    if (typeof convAny.addParticipant === 'function') {
      convAny.addParticipant(new Types.ObjectId(newParticipantId));
      return;
    }
    const alreadyExists = (convAny?.participants || []).some((p: any) =>
      this.participantMatchesUser(p, newParticipantId),
    );
    if (alreadyExists) return;
    convAny.participants = convAny.participants || [];
    convAny.participants.push({
      userId: new Types.ObjectId(newParticipantId),
      joinedAt: new Date(),
      unreadCount: 0,
      isMuted: false,
      isPinned: false,
      isArchived: false,
      notificationsEnabled: true,
    });
  }

  private removeParticipantFromConversation(conversation: any, participantToRemove: string): boolean {
    const convAny = conversation as any;
    if (typeof convAny.removeParticipant === 'function') {
      return !!convAny.removeParticipant(participantToRemove);
    }
    const before = (convAny?.participants || []).length;
    convAny.participants = (convAny?.participants || []).filter(
      (p: any) => !this.participantMatchesUser(p, participantToRemove),
    );
    return convAny.participants.length < before;
  }

  private incrementUnread(conversation: any, senderId: string): void {
    const convAny = conversation as any;
    if (typeof convAny.incrementUnread === 'function') {
      convAny.incrementUnread(senderId);
      return;
    }
    for (const p of convAny.participants || []) {
      if (!this.participantMatchesUser(p, senderId)) {
        p.unreadCount = (p.unreadCount || 0) + 1;
      }
    }
  }

  private markConversationRead(conversation: any, userId: string): void {
    const convAny = conversation as any;
    if (typeof convAny.markAsRead === 'function') {
      convAny.markAsRead(userId);
      return;
    }
    const participant = (convAny.participants || []).find((p: any) =>
      this.participantMatchesUser(p, userId),
    );
    if (participant) {
      participant.unreadCount = 0;
      participant.lastReadAt = new Date();
    }
  }

  private addReactionToMessage(message: any, emoji: string, userId: string): void {
    const msgAny = message as any;
    if (typeof msgAny.addReaction === 'function') {
      msgAny.addReaction(emoji, new Types.ObjectId(userId));
      return;
    }
    msgAny.reactions = msgAny.reactions || [];
    const existing = msgAny.reactions.find((r: any) => r?.emoji === emoji);
    if (!existing) {
      msgAny.reactions.push({ emoji, users: [new Types.ObjectId(userId)], count: 1 });
      return;
    }
    existing.users = existing.users || [];
    const already = existing.users.some((id: any) => this.normalizeId(id) === this.normalizeId(userId));
    if (!already) {
      existing.users.push(new Types.ObjectId(userId));
      existing.count = (existing.count || 0) + 1;
    }
  }

  private removeReactionFromMessage(message: any, emoji: string, userId: string): void {
    const msgAny = message as any;
    if (typeof msgAny.removeReaction === 'function') {
      msgAny.removeReaction(emoji, new Types.ObjectId(userId));
      return;
    }
    msgAny.reactions = msgAny.reactions || [];
    const idx = msgAny.reactions.findIndex((r: any) => r?.emoji === emoji);
    if (idx === -1) return;
    const reaction = msgAny.reactions[idx];
    reaction.users = (reaction.users || []).filter(
      (id: any) => this.normalizeId(id) !== this.normalizeId(userId),
    );
    reaction.count = Math.max(0, (reaction.count || 0) - 1);
    if ((reaction.users || []).length === 0 || reaction.count === 0) {
      msgAny.reactions.splice(idx, 1);
    }
  }

  private markMessageRead(message: any, userId: string): boolean {
    const msgAny = message as any;
    if (typeof msgAny.markAsRead === 'function') {
      return !!msgAny.markAsRead(new Types.ObjectId(userId));
    }
    msgAny.readBy = msgAny.readBy || [];
    const already = msgAny.readBy.some((rb: any) => this.participantMatchesUser(rb, userId));
    if (already) return false;
    msgAny.readBy.push({ userId: new Types.ObjectId(userId), readAt: new Date() });
    return true;
  }

  private getParticipantIds(conversation: any, excludeUserId?: string): string[] {
    const participants = (conversation as any)?.participants || [];
    return participants
      .map((p: any) => {
        const pid = p?.userId;
        return this.normalizeId(pid?._id ? pid._id : pid);
      })
      .filter((id: string) => id && id !== excludeUserId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONVERSATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async createConversation(userId: string, dto: CreateConversationDto): Promise<ConversationDocument> {
    if (dto.type === ConversationType.DIRECT && dto.participantIds.length === 1) {
      const existing = await this.conversationModel.findOne({
        type: ConversationType.DIRECT,
        'participants.userId': {
          $all: [new Types.ObjectId(userId), new Types.ObjectId(dto.participantIds[0])],
        },
      });
      if (existing) {
        await existing.populate('participants.userId', this.userPopulateFields);
        return existing;
      }
    }

    const participants = [
      { userId: new Types.ObjectId(userId), joinedAt: new Date(), unreadCount: 0 },
      ...dto.participantIds.map((id) => ({
        userId: new Types.ObjectId(id), joinedAt: new Date(), unreadCount: 0,
      })),
    ];

    const conversation = new this.conversationModel({
      type: dto.type,
      name: dto.name,
      description: dto.description,
      participants,
      createdBy: new Types.ObjectId(userId),
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : undefined,
      taskId: dto.taskId ? new Types.ObjectId(dto.taskId) : undefined,
    });

    const saved = await conversation.save();
    await saved.populate('participants.userId', this.userPopulateFields);

    this.eventEmitter.emit('conversation.created', { conversationId: saved._id, createdBy: userId, participantIds: dto.participantIds });

    for (const participantId of dto.participantIds) {
      this.emitToUser(participantId, 'conversation:new', { conversation: saved, createdBy: userId });
    }
    return saved;
  }

  async getOrCreateDirectConversation(userId: string, recipientId: string): Promise<ConversationDocument> {
    const existing = await this.conversationModel.findOne({
      type: ConversationType.DIRECT,
      'participants.userId': { $all: [new Types.ObjectId(userId), new Types.ObjectId(recipientId)] },
      $expr: { $eq: [{ $size: '$participants' }, 2] },
    });

    if (existing) {
      await existing.populate('participants.userId', this.userPopulateFields);
      return existing;
    }
    return this.createConversation(userId, { type: ConversationType.DIRECT, participantIds: [recipientId] });
  }

  async getUserConversations(userId: string, includeArchived: boolean = false): Promise<ConversationDocument[]> {
    const query: any = { 'participants.userId': new Types.ObjectId(userId), isActive: true };
    const conversations = await this.conversationModel.find(query).populate('participants.userId', this.userPopulateFields).sort({ lastActivityAt: -1 }).exec();
    const result: ConversationDocument[] = [];

    for (const conv of conversations) {
      const convAny = conv as any;
      const participant = (convAny.participants || []).find((p: any) => this.participantMatchesUser(p, userId));
      if (!includeArchived && participant?.isArchived) continue;
      convAny.unreadCount = participant?.unreadCount || 0;
      convAny.isMuted = participant?.isMuted || false;
      convAny.isPinned = participant?.isPinned || false;
      convAny.isArchived = participant?.isArchived || false;
      result.push(conv);
    }
    return result;
  }

  async getConversationById(conversationId: string, userId: string): Promise<ConversationDocument> {
    const conversation = await this.conversationModel.findById(conversationId).populate('participants.userId', this.userPopulateFields);
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!this.isParticipant(conversation, userId)) throw new ForbiddenException('You are not a participant in this conversation');
    return conversation;
  }

  async updateConversationSettings(conversationId: string, userId: string, dto: ConversationSettingsDto): Promise<ConversationDocument> {
    const conversation = await this.getConversationById(conversationId, userId);
    const participant = (conversation as any).participants?.find((p: any) => this.participantMatchesUser(p, userId));
    if (participant) {
      if (dto.isMuted !== undefined) participant.isMuted = dto.isMuted;
      if (dto.isPinned !== undefined) participant.isPinned = dto.isPinned;
      if (dto.isArchived !== undefined) participant.isArchived = dto.isArchived;
      if (dto.notificationsEnabled !== undefined) participant.notificationsEnabled = dto.notificationsEnabled;
    }
    return conversation.save();
  }

  async addParticipant(conversationId: string, userId: string, newParticipantId: string): Promise<ConversationDocument> {
    const conversation = await this.getConversationById(conversationId, userId);
    if (conversation.type === ConversationType.DIRECT) throw new BadRequestException('Cannot add participants to direct conversations');
    this.addParticipantToConversation(conversation, newParticipantId);
    await this.sendSystemMessage(conversationId, `User was added to the conversation`);
    const saved = await conversation.save();
    await saved.populate('participants.userId', this.userPopulateFields);
    this.emitToUser(newParticipantId, 'conversation:joined', { conversation: saved, addedBy: userId });
    this.emitToConversation(conversationId, 'participant:added', { conversationId, userId: newParticipantId, addedBy: userId });
    return saved;
  }

  async removeParticipant(conversationId: string, userId: string, participantToRemove: string): Promise<ConversationDocument> {
    const conversation = await this.getConversationById(conversationId, userId);
    if (conversation.type === ConversationType.DIRECT) throw new BadRequestException('Cannot remove participants from direct conversations');
    const removed = this.removeParticipantFromConversation(conversation, participantToRemove);
    if (!removed) throw new NotFoundException('Participant not found in conversation');
    await this.sendSystemMessage(conversationId, `User left the conversation`);
    const saved = await conversation.save();
    await saved.populate('participants.userId', this.userPopulateFields);
    this.emitToUser(participantToRemove, 'conversation:removed', { conversationId, removedBy: userId });
    this.emitToConversation(conversationId, 'participant:removed', { conversationId, userId: participantToRemove, removedBy: userId });
    return saved;
  }

  async leaveConversation(conversationId: string, userId: string): Promise<void> {
    await this.removeParticipant(conversationId, userId, userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MESSAGES
  // ─────────────────────────────────────────────────────────────────────────────

  async sendMessage(userId: string, dto: SendMessageDto): Promise<MessageDocument> {
    const conversation = await this.getConversationById(dto.conversationId, userId);

    if (dto.clientMessageId) {
      const existing = await this.messageModel.findOne({ clientMessageId: dto.clientMessageId });
      if (existing) {
        await existing.populate('senderId', this.userPopulateFields);
        return existing;
      }
    }

    const energy = dto.energy || MessageEnergy.NORMAL;
    const energyCost = ENERGY_COSTS[energy];

    const message = new this.messageModel({
      conversationId: new Types.ObjectId(dto.conversationId),
      senderId: new Types.ObjectId(userId),
      content: dto.content,
      type: dto.type,
      energy,
      energyCost,
      threadParentId: dto.threadParentId ? new Types.ObjectId(dto.threadParentId) : undefined,
      mentions: dto.mentions?.map((id) => new Types.ObjectId(id)) || [],
      linkedTaskId: dto.linkedTaskId ? new Types.ObjectId(dto.linkedTaskId) : undefined,
      clientMessageId: dto.clientMessageId,
    });

    const saved = await message.save();

    if (dto.threadParentId) {
      await this.messageModel.updateOne(
        { _id: new Types.ObjectId(dto.threadParentId) },
        { $inc: { threadReplyCount: 1 }, $set: { lastReplyAt: new Date() } },
      );
    }

    (conversation as any).lastMessage = {
      messageId: saved._id as Types.ObjectId,
      content: dto.content.substring(0, 100),
      senderId: new Types.ObjectId(userId),
      sentAt: new Date(),
    };
    (conversation as any).lastActivityAt = new Date();
    (conversation as any).messageCount = ((conversation as any).messageCount || 0) + 1;

    this.incrementUnread(conversation, userId);
    await conversation.save();

    const populatedMessage = await saved.populate('senderId', this.userPopulateFields);

    this.eventEmitter.emit('message.sent', {
      message: saved,
      conversationId: dto.conversationId,
      senderId: userId,
      mentions: dto.mentions,
    });

    // 1. Emit the actual chat message
    this.emitNewMessage(dto.conversationId, populatedMessage.toObject());

    if (dto.mentions?.length) {
      for (const mentionedUserId of dto.mentions) {
        this.emitToUser(mentionedUserId, 'message:mentioned', {
          conversationId: dto.conversationId,
          message: saved.toObject(),
          mentionedBy: userId,
        });
      }
    }

    // ⭐ THE FIX: Native DB Notification Creation & Direct Socket Broadcast
    try {
      const participantIdsToNotify = this.getParticipantIds(conversation, userId);
      const db = this.messageModel.db;
      
      for (const recipientId of participantIdsToNotify) {
        
        // 1. Force exact Schema DB fields (userId, body, message_new)
        const notifResult = await db.collection('notifications').insertOne({
          userId: new Types.ObjectId(recipientId),
          type: 'message_new',
          title: 'New Message',
          body: dto.content.length > 50 ? dto.content.substring(0, 50) + '...' : dto.content,
          data: {
            conversationId: dto.conversationId,
            messageId: saved._id.toString()
          },
          channels: ['in_app'],
          priority: 'normal',
          isRead: false,
          isClicked: false,
          isDismissed: false,
          groupCount: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        const newNotif = await db.collection('notifications').findOne({ _id: notifResult.insertedId });
        
        // 2. Direct broadcast via WebSocket server using the exact string React is listening for
        if (this.appGateway && this.appGateway.server) {
          this.appGateway.server.to(recipientId).emit('new_notification', newNotif);
        }
        
        // Failsafe internal emit
        this.eventEmitter.emit('notification.created', newNotif);
      }
      this.logger.log(`✅ [MessagesService] Schema-perfect Notifications created for ${participantIdsToNotify.length} users`);
    } catch (dbErr) {
      this.logger.error('⚠️ [MessagesService] Failed to create DB notification:', dbErr);
    }

    this.logger.log(`Message sent in conversation ${dto.conversationId}`);
    return saved;
  }

  async sendSystemMessage(conversationId: string, content: string): Promise<MessageDocument> {
    const message = new this.messageModel({
      conversationId: new Types.ObjectId(conversationId), senderId: new Types.ObjectId('000000000000000000000000'), content, type: 'system', energy: MessageEnergy.ASYNC, energyCost: 0,
    });
    const saved = await message.save();
    this.emitToConversation(conversationId, 'message:system', { conversationId, message: saved.toObject() });
    return saved;
  }

  async getMessages(conversationId: string, userId: string, options: MessagesQueryOptions = {}): Promise<{ messages: MessageDocument[]; hasMore: boolean }> {
    await this.getConversationById(conversationId, userId);
    const { limit = 50, before, after } = options;
    const query: any = { conversationId: new Types.ObjectId(conversationId), isDeleted: { $ne: true } };
    if (before) query.createdAt = { $lt: new Date(before) };
    if (after) query.createdAt = { ...query.createdAt, $gt: new Date(after) };

    const messages = await this.messageModel.find(query).populate('senderId', this.userPopulateFields).sort({ createdAt: -1 }).limit(limit + 1).exec();
    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();
    return { messages: messages.reverse(), hasMore };
  }

  async getThreadMessages(threadParentId: string, userId: string): Promise<{ parent: MessageDocument; replies: MessageDocument[] }> {
    const parent = await this.messageModel.findById(threadParentId).populate('senderId', this.userPopulateFields);
    if (!parent) throw new NotFoundException('Thread not found');
    await this.getConversationById((parent as any).conversationId.toString(), userId);
    const replies = await this.messageModel.find({ threadParentId: new Types.ObjectId(threadParentId), isDeleted: { $ne: true } }).populate('senderId', this.userPopulateFields).sort({ createdAt: 1 }).exec();
    return { parent, replies };
  }

  async editMessage(messageId: string, userId: string, dto: EditMessageDto): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');
    if ((message as any).senderId.toString() !== userId) throw new ForbiddenException('You can only edit your own messages');
    (message as any).content = dto.content; (message as any).isEdited = true; (message as any).editedAt = new Date();
    const updated = await message.save();
    this.eventEmitter.emit('message.edited', { messageId, conversationId: (message as any).conversationId, newContent: dto.content });
    this.emitToConversation((message as any).conversationId.toString(), 'message:edited', { messageId, conversationId: (message as any).conversationId, content: dto.content, editedAt: (message as any).editedAt });
    return updated;
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');
    if ((message as any).senderId.toString() !== userId) throw new ForbiddenException('You can only delete your own messages');
    const conversationId = (message as any).conversationId.toString();
    (message as any).isDeleted = true; (message as any).deletedAt = new Date(); (message as any).content = '[Message deleted]';
    await message.save();
    this.eventEmitter.emit('message.deleted', { messageId, conversationId });
    this.emitToConversation(conversationId, 'message:deleted', { messageId, conversationId });
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');
    const conversationId = (message as any).conversationId.toString();
    await this.getConversationById(conversationId, userId);
    this.addReactionToMessage(message, emoji, userId);
    const updated = await message.save();
    this.eventEmitter.emit('message.reaction.added', { messageId, conversationId, emoji, userId });
    this.emitToConversation(conversationId, 'message:reaction', { messageId, conversationId, emoji, userId, action: 'added' });
    return updated;
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');
    const conversationId = (message as any).conversationId.toString();
    this.removeReactionFromMessage(message, emoji, userId);
    const updated = await message.save();
    this.eventEmitter.emit('message.reaction.removed', { messageId, conversationId, emoji, userId });
    this.emitToConversation(conversationId, 'message:reaction', { messageId, conversationId, emoji, userId, action: 'removed' });
    return updated;
  }

  async markAsRead(messageId: string, userId: string): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');
    const marked = this.markMessageRead(message, userId);
    if (marked) {
      await message.save();
      const conversationId = (message as any).conversationId.toString();
      this.eventEmitter.emit('message.read', { messageId, conversationId, readBy: userId });
      const senderId = (message as any).senderId.toString();
      if (senderId !== userId) {
        this.emitToUser(senderId, 'message:read', { messageId, conversationId, readBy: userId, readAt: new Date() });
      }
    }
    return message;
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.getConversationById(conversationId, userId);
    await this.messageModel.updateMany({ conversationId: new Types.ObjectId(conversationId), senderId: { $ne: new Types.ObjectId(userId) }, 'readBy.userId': { $ne: new Types.ObjectId(userId) } }, { $push: { readBy: { userId: new Types.ObjectId(userId), readAt: new Date() } } });
    this.markConversationRead(conversation, userId);
    await conversation.save();
    this.emitToConversation(conversationId, 'conversation:read', { conversationId, userId, readAt: new Date() });
  }

  async getUnreadCount(userId: string): Promise<{ total: number; byConversation: Record<string, number> }> {
    const conversations = await this.conversationModel.find({ 'participants.userId': new Types.ObjectId(userId), isActive: true });
    let total = 0; const byConversation: Record<string, number> = {};
    for (const conv of conversations) {
      const participant = (conv as any).participants?.find((p: any) => this.participantMatchesUser(p, userId));
      if (participant && participant.unreadCount > 0) {
        total += participant.unreadCount;
        byConversation[(conv as any)._id.toString()] = participant.unreadCount;
      }
    }
    return { total, byConversation };
  }

  async searchMessages(userId: string, query: string, conversationId?: string, limit: number = 20): Promise<MessageDocument[]> {
    const searchQuery: any = { $text: { $search: query }, isDeleted: { $ne: true } };
    if (conversationId) {
      await this.getConversationById(conversationId, userId);
      searchQuery.conversationId = new Types.ObjectId(conversationId);
    } else {
      const userConversations = await this.conversationModel.find({ 'participants.userId': new Types.ObjectId(userId) });
      searchQuery.conversationId = { $in: userConversations.map((c) => (c as any)._id) };
    }
    return this.messageModel.find(searchQuery, { score: { $meta: 'textScore' } }).populate('senderId', this.userPopulateFields).sort({ score: { $meta: 'textScore' } }).limit(limit).exec();
  }
}
