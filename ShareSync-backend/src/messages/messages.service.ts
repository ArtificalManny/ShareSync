// src/messages/messages.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES SERVICE
// ⭐ PHASE 2A: Added AppGateway integration for real-time WebSocket emissions
// ⭐ PATCH: Populate canonical user avatar field(s) for messaging payloads
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

  /**
   * IMPORTANT:
   * The canonical avatar field in User schema is `profilePicture`.
   * We still include legacy/fallback fields in case some older users or payloads
   * contain them, but `profilePicture` must be present in messaging populates.
   */
  private readonly userPopulateFields =
    'firstName lastName username email profilePicture avatar avatarUrl photoUrl image';

  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    private readonly eventEmitter: EventEmitter2,
    // ⭐ PHASE 2A: Inject AppGateway (optional to prevent circular dependency issues)
    @Optional() private readonly appGateway?: AppGateway,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // ⭐ PHASE 2A: REAL-TIME EMISSION HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private emitToConversation(conversationId: string, event: string, payload: any): void {
    if (this.appGateway) {
      this.appGateway.emitToRoom(`conversation:${conversationId}`, event, payload);
    }
  }

  private emitToUser(userId: string, event: string, payload: any): void {
    if (this.appGateway) {
      this.appGateway.emitToUser(userId, event, payload);
    }
  }

  private emitNewMessage(conversationId: string, message: any): void {
    if (this.appGateway) {
      this.appGateway.emitNewMessage(conversationId, message);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERNAL HELPERS (safe fallbacks instead of schema methods)
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
    const after = convAny.participants.length;
    return after < before;
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
      msgAny.reactions.push({
        emoji,
        users: [new Types.ObjectId(userId)],
        count: 1,
      });
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

  // ⭐ PHASE 2A: Get participant IDs for notifications
  private getParticipantIds(conversation: any, excludeUserId?: string): string[] {
    const participants = (conversation as any)?.participants || [];
    return participants
      .map((p: any) => {
        const pid = p?.userId;
        const id = pid?._id ? pid._id : pid;
        return this.normalizeId(id);
      })
      .filter((id: string) => id && id !== excludeUserId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONVERSATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async createConversation(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<ConversationDocument> {
    if (dto.type === ConversationType.DIRECT && dto.participantIds.length === 1) {
      const existing = await this.conversationModel.findOne({
        type: ConversationType.DIRECT,
        'participants.userId': {
          $all: [
            new Types.ObjectId(userId),
            new Types.ObjectId(dto.participantIds[0]),
          ],
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
        userId: new Types.ObjectId(id),
        joinedAt: new Date(),
        unreadCount: 0,
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

    this.eventEmitter.emit('conversation.created', {
      conversationId: saved._id,
      createdBy: userId,
      participantIds: dto.participantIds,
    });

    // ⭐ PHASE 2A: Notify participants of new conversation
    for (const participantId of dto.participantIds) {
      this.emitToUser(participantId, 'conversation:new', {
        conversation: saved,
        createdBy: userId,
      });
    }

    return saved;
  }

  async getOrCreateDirectConversation(
    userId: string,
    recipientId: string,
  ): Promise<ConversationDocument> {
    const existing = await this.conversationModel.findOne({
      type: ConversationType.DIRECT,
      'participants.userId': {
        $all: [new Types.ObjectId(userId), new Types.ObjectId(recipientId)],
      },
      $expr: { $eq: [{ $size: '$participants' }, 2] },
    });

    if (existing) {
      await existing.populate('participants.userId', this.userPopulateFields);
      return existing;
    }

    return this.createConversation(userId, {
      type: ConversationType.DIRECT,
      participantIds: [recipientId],
    });
  }

  async getUserConversations(
    userId: string,
    includeArchived: boolean = false,
  ): Promise<ConversationDocument[]> {
    const query: any = {
      'participants.userId': new Types.ObjectId(userId),
      isActive: true,
    };

    const conversations = await this.conversationModel
      .find(query)
      .populate('participants.userId', this.userPopulateFields)
      .sort({ lastActivityAt: -1 })
      .exec();

    const result: ConversationDocument[] = [];

    for (const conv of conversations) {
      const convAny = conv as any;

      const participant = (convAny.participants || []).find((p: any) =>
        this.participantMatchesUser(p, userId),
      );

      if (!includeArchived && participant?.isArchived) continue;

      convAny.unreadCount = participant?.unreadCount || 0;
      convAny.isMuted = participant?.isMuted || false;
      convAny.isPinned = participant?.isPinned || false;
      convAny.isArchived = participant?.isArchived || false;

      result.push(conv);
    }

    return result;
  }

  async getConversationById(
    conversationId: string,
    userId: string,
  ): Promise<ConversationDocument> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .populate('participants.userId', this.userPopulateFields);

    if (!conversation) throw new NotFoundException('Conversation not found');

    if (!this.isParticipant(conversation, userId)) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    return conversation;
  }

  async updateConversationSettings(
    conversationId: string,
    userId: string,
    dto: ConversationSettingsDto,
  ): Promise<ConversationDocument> {
    const conversation = await this.getConversationById(conversationId, userId);

    const participant = (conversation as any).participants?.find((p: any) =>
      this.participantMatchesUser(p, userId),
    );

    if (participant) {
      if (dto.isMuted !== undefined) participant.isMuted = dto.isMuted;
      if (dto.isPinned !== undefined) participant.isPinned = dto.isPinned;
      if (dto.isArchived !== undefined) participant.isArchived = dto.isArchived;
      if (dto.notificationsEnabled !== undefined) {
        participant.notificationsEnabled = dto.notificationsEnabled;
      }
    }

    return conversation.save();
  }

  async addParticipant(
    conversationId: string,
    userId: string,
    newParticipantId: string,
  ): Promise<ConversationDocument> {
    const conversation = await this.getConversationById(conversationId, userId);

    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException('Cannot add participants to direct conversations');
    }

    this.addParticipantToConversation(conversation, newParticipantId);

    await this.sendSystemMessage(conversationId, `User was added to the conversation`);

    const saved = await conversation.save();
    await saved.populate('participants.userId', this.userPopulateFields);

    // ⭐ PHASE 2A: Notify new participant
    this.emitToUser(newParticipantId, 'conversation:joined', {
      conversation: saved,
      addedBy: userId,
    });

    // ⭐ PHASE 2A: Notify existing participants
    this.emitToConversation(conversationId, 'participant:added', {
      conversationId,
      userId: newParticipantId,
      addedBy: userId,
    });

    return saved;
  }

  async removeParticipant(
    conversationId: string,
    userId: string,
    participantToRemove: string,
  ): Promise<ConversationDocument> {
    const conversation = await this.getConversationById(conversationId, userId);

    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException('Cannot remove participants from direct conversations');
    }

    const removed = this.removeParticipantFromConversation(conversation, participantToRemove);
    if (!removed) throw new NotFoundException('Participant not found in conversation');

    await this.sendSystemMessage(conversationId, `User left the conversation`);

    const saved = await conversation.save();
    await saved.populate('participants.userId', this.userPopulateFields);

    // ⭐ PHASE 2A: Notify removed participant
    this.emitToUser(participantToRemove, 'conversation:removed', {
      conversationId,
      removedBy: userId,
    });

    // ⭐ PHASE 2A: Notify remaining participants
    this.emitToConversation(conversationId, 'participant:removed', {
      conversationId,
      userId: participantToRemove,
      removedBy: userId,
    });

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

    await saved.populate('senderId', this.userPopulateFields);

    this.eventEmitter.emit('message.sent', {
      message: saved,
      conversationId: dto.conversationId,
      senderId: userId,
      mentions: dto.mentions,
    });

    // ⭐ PHASE 2A: Emit real-time message to conversation participants
    this.emitNewMessage(dto.conversationId, saved.toObject());

    // ⭐ PHASE 2A: Notify mentioned users
    if (dto.mentions?.length) {
      for (const mentionedUserId of dto.mentions) {
        this.emitToUser(mentionedUserId, 'message:mentioned', {
          conversationId: dto.conversationId,
          message: saved.toObject(),
          mentionedBy: userId,
        });
      }
    }

    this.logger.log(`Message sent in conversation ${dto.conversationId}`);

    return saved;
  }

  async sendSystemMessage(conversationId: string, content: string): Promise<MessageDocument> {
    const message = new this.messageModel({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId('000000000000000000000000'),
      content,
      type: 'system',
      energy: MessageEnergy.ASYNC,
      energyCost: 0,
    });

    const saved = await message.save();

    // ⭐ PHASE 2A: Emit system message to conversation
    this.emitToConversation(conversationId, 'message:system', {
      conversationId,
      message: saved.toObject(),
    });

    return saved;
  }

  async getMessages(
    conversationId: string,
    userId: string,
    options: MessagesQueryOptions = {},
  ): Promise<{ messages: MessageDocument[]; hasMore: boolean }> {
    await this.getConversationById(conversationId, userId);

    const { limit = 50, before, after } = options;
    const query: any = {
      conversationId: new Types.ObjectId(conversationId),
      isDeleted: { $ne: true },
    };

    if (before) query.createdAt = { $lt: new Date(before) };
    if (after) query.createdAt = { ...query.createdAt, $gt: new Date(after) };

    const messages = await this.messageModel
      .find(query)
      .populate('senderId', this.userPopulateFields)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    return { messages: messages.reverse(), hasMore };
  }

  async getThreadMessages(
    threadParentId: string,
    userId: string,
  ): Promise<{ parent: MessageDocument; replies: MessageDocument[] }> {
    const parent = await this.messageModel
      .findById(threadParentId)
      .populate('senderId', this.userPopulateFields);

    if (!parent) throw new NotFoundException('Thread not found');

    await this.getConversationById((parent as any).conversationId.toString(), userId);

    const replies = await this.messageModel
      .find({ threadParentId: new Types.ObjectId(threadParentId), isDeleted: { $ne: true } })
      .populate('senderId', this.userPopulateFields)
      .sort({ createdAt: 1 })
      .exec();

    return { parent, replies };
  }

  async editMessage(messageId: string, userId: string, dto: EditMessageDto): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    if ((message as any).senderId.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    (message as any).content = dto.content;
    (message as any).isEdited = true;
    (message as any).editedAt = new Date();

    const updated = await message.save();

    this.eventEmitter.emit('message.edited', {
      messageId,
      conversationId: (message as any).conversationId,
      newContent: dto.content,
    });

    // ⭐ PHASE 2A: Emit edit to conversation participants
    this.emitToConversation((message as any).conversationId.toString(), 'message:edited', {
      messageId,
      conversationId: (message as any).conversationId,
      content: dto.content,
      editedAt: (message as any).editedAt,
    });

    return updated;
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    if ((message as any).senderId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    const conversationId = (message as any).conversationId.toString();

    (message as any).isDeleted = true;
    (message as any).deletedAt = new Date();
    (message as any).content = '[Message deleted]';
    await message.save();

    this.eventEmitter.emit('message.deleted', {
      messageId,
      conversationId,
    });

    // ⭐ PHASE 2A: Emit deletion to conversation participants
    this.emitToConversation(conversationId, 'message:deleted', {
      messageId,
      conversationId,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async addReaction(messageId: string, userId: string, emoji: string): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    const conversationId = (message as any).conversationId.toString();
    await this.getConversationById(conversationId, userId);

    this.addReactionToMessage(message, emoji, userId);

    const updated = await message.save();

    this.eventEmitter.emit('message.reaction.added', {
      messageId,
      conversationId,
      emoji,
      userId,
    });

    // ⭐ PHASE 2A: Emit reaction to conversation participants
    this.emitToConversation(conversationId, 'message:reaction', {
      messageId,
      conversationId,
      emoji,
      userId,
      action: 'added',
    });

    return updated;
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    const conversationId = (message as any).conversationId.toString();

    this.removeReactionFromMessage(message, emoji, userId);

    const updated = await message.save();

    this.eventEmitter.emit('message.reaction.removed', {
      messageId,
      conversationId,
      emoji,
      userId,
    });

    // ⭐ PHASE 2A: Emit reaction removal to conversation participants
    this.emitToConversation(conversationId, 'message:reaction', {
      messageId,
      conversationId,
      emoji,
      userId,
      action: 'removed',
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READ STATUS
  // ─────────────────────────────────────────────────────────────────────────────

  async markAsRead(messageId: string, userId: string): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    const marked = this.markMessageRead(message, userId);

    if (marked) {
      await message.save();

      const conversationId = (message as any).conversationId.toString();

      this.eventEmitter.emit('message.read', {
        messageId,
        conversationId,
        readBy: userId,
      });

      // ⭐ PHASE 2A: Emit read receipt to sender
      const senderId = (message as any).senderId.toString();
      if (senderId !== userId) {
        this.emitToUser(senderId, 'message:read', {
          messageId,
          conversationId,
          readBy: userId,
          readAt: new Date(),
        });
      }
    }

    return message;
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.getConversationById(conversationId, userId);

    await this.messageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        senderId: { $ne: new Types.ObjectId(userId) },
        'readBy.userId': { $ne: new Types.ObjectId(userId) },
      },
      { $push: { readBy: { userId: new Types.ObjectId(userId), readAt: new Date() } } },
    );

    this.markConversationRead(conversation, userId);
    await conversation.save();

    // ⭐ PHASE 2A: Emit conversation read event
    this.emitToConversation(conversationId, 'conversation:read', {
      conversationId,
      userId,
      readAt: new Date(),
    });
  }

  async getUnreadCount(userId: string): Promise<{ total: number; byConversation: Record<string, number> }> {
    const conversations = await this.conversationModel.find({
      'participants.userId': new Types.ObjectId(userId),
      isActive: true,
    });

    let total = 0;
    const byConversation: Record<string, number> = {};

    for (const conv of conversations) {
      const participant = (conv as any).participants?.find((p: any) =>
        this.participantMatchesUser(p, userId),
      );
      if (participant && participant.unreadCount > 0) {
        total += participant.unreadCount;
        byConversation[(conv as any)._id.toString()] = participant.unreadCount;
      }
    }

    return { total, byConversation };
  }

  async searchMessages(
    userId: string,
    query: string,
    conversationId?: string,
    limit: number = 20,
  ): Promise<MessageDocument[]> {
    const searchQuery: any = {
      $text: { $search: query },
      isDeleted: { $ne: true },
    };

    if (conversationId) {
      await this.getConversationById(conversationId, userId);
      searchQuery.conversationId = new Types.ObjectId(conversationId);
    } else {
      const userConversations = await this.conversationModel.find({
        'participants.userId': new Types.ObjectId(userId),
      });
      searchQuery.conversationId = { $in: userConversations.map((c) => (c as any)._id) };
    }

    return this.messageModel
      .find(searchQuery, { score: { $meta: 'textScore' } })
      .populate('senderId', this.userPopulateFields)
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .exec();
  }
}
