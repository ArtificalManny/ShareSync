// src/threads/threads.service.ts
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';
import { Thread, ThreadDocument } from './schemas/thread.schema';
import { ThreadMessage, ThreadMessageDocument } from './schemas/thread-message.schema';
import { NotificationsService } from '../notifications/notifications.service';

export interface CreateThreadDto {
  projectId: string;
  title: string;
  category?: 'planning' | 'design' | 'ops' | 'general';
  content?: string;
  participantIds?: string[];
}

export interface CreateMessageDto {
  content: string;
  mentions?: string[];
}

export interface GetMessagesOptions {
  limit?: number;
  before?: string;
}

export interface FindThreadsOptions {
  category?: string;
  isPinned?: boolean;
}

const USER_POPULATE_FIELDS = 'firstName lastName username email profilePicture avatar avatarUrl';

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name);

  constructor(
    @InjectModel(Thread.name) private threadModel: Model<ThreadDocument>,
    @InjectModel(ThreadMessage.name) private messageModel: Model<ThreadMessageDocument>,
    private readonly eventEmitter: EventEmitter2,
    private readonly moduleRef: ModuleRef,
  ) {}

  async create(userId: string, dto: CreateThreadDto): Promise<ThreadDocument> {
    if (
      !userId ||
      !Types.ObjectId.isValid(userId)
    ) {
      throw new ForbiddenException(
        'Authenticated user is invalid',
      );
    }

    if (
      !dto.projectId ||
      !Types.ObjectId.isValid(dto.projectId)
    ) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    const userObjectId =
      new Types.ObjectId(userId);

    const projectObjectId =
      new Types.ObjectId(dto.projectId);

    const db = this.threadModel.db;

    const projectDoc: any =
      await db
        .collection('projects')
        .findOne({
          _id: projectObjectId,
        });

    if (!projectDoc) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    const normalizeUserId = (
      value: any,
    ): string => {
      const candidate =
        value?.userId?._id ||
        value?.userId?.id ||
        value?.userId ||
        value?.user?._id ||
        value?.user?.id ||
        value?.member?._id ||
        value?.member?.id ||
        value?._id ||
        value?.id ||
        value;

      return String(
        candidate || '',
      ).trim();
    };

    const rawProjectMembers =
      projectDoc.members ||
      projectDoc.sharedWith ||
      projectDoc.participantIds ||
      [];

    const allowedParticipantIds =
      new Set<string>(
        [
          projectDoc.ownerId,
          projectDoc.owner,
          ...(
            Array.isArray(rawProjectMembers)
              ? rawProjectMembers
              : []
          ),
        ]
          .map(normalizeUserId)
          .filter(
            (id) =>
              id &&
              Types.ObjectId.isValid(id),
          ),
      );

    allowedParticipantIds.add(userId);

    const requestedParticipantIds =
      Array.from(
        new Set(
          (
            Array.isArray(dto.participantIds)
              ? dto.participantIds
              : []
          )
            .map((id) =>
              String(id || '').trim()
            )
            .filter(Boolean),
        ),
      );

    const invalidParticipantIds =
      requestedParticipantIds.filter(
        (id) =>
          !Types.ObjectId.isValid(id) ||
          !allowedParticipantIds.has(id),
      );

    if (invalidParticipantIds.length > 0) {
      throw new ForbiddenException(
        'One or more selected participants are not project members',
      );
    }

    const participantIds =
      Array.from(
        new Set([
          userId,
          ...requestedParticipantIds,
        ]),
      ).map(
        (id) =>
          new Types.ObjectId(id),
      );

    const thread = new this.threadModel({
      projectId: projectObjectId,
      title: dto.title,
      category: dto.category || 'general',
      createdBy: userObjectId,
      participants: participantIds,
      isPinned: false,
      isLocked: false,
      replyCount: 0,
    });

    const savedThread = await thread.save();

    // ⭐ NOTIFY: NEW THREAD CREATED
    try {
      let rtGateway: any = null;
      let notifGateway: any = null;
      try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
      try { notifGateway = this.moduleRef.get('NotificationsGateway', { strict: false }); } catch(e) {}

      if (projectDoc) {
        const rawMembers = projectDoc.members || projectDoc.sharedWith || projectDoc.participantIds || [];
        const allAssociatedIds: any[] = [
          projectDoc.ownerId,
          projectDoc.owner,
          ...rawMembers.map((m: any) => m?.userId || m?._id || m)
        ];

        const memberIdsToNotify: string[] = allAssociatedIds
          .filter(Boolean)
          .map(id => id.toString())
          .filter(id => id !== userId);

        const uniqueMembers: string[] = [...new Set(memberIdsToNotify)];
        const safeProjectName = projectDoc.name || projectDoc.title || 'Project';

        for (const recipientId of uniqueMembers) {
          try {
            const notifResult = await db.collection('notifications').insertOne({
              userId: new Types.ObjectId(recipientId),
              type: 'thread_created',
              title: `💬 New Thread in ${safeProjectName}`,
              body: dto.title,
              data: { projectId: dto.projectId, projectName: safeProjectName, extra: { threadId: savedThread._id.toString() } },
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
            if (notifGateway?.server) {
              notifGateway.server.to(recipientId).emit('new_notification', newNotif);
              notifGateway.server.to(`user:${recipientId}`).emit('new_notification', newNotif);
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      this.logger.error('Failed thread creation broadcast', err);
    }

    if (dto.content) {
      await this.addMessage(savedThread._id.toString(), userId, {
        content: dto.content,
      });
    }

    return savedThread;
  }

  async findById(id: string): Promise<ThreadDocument> {
    const thread = await this.threadModel
      .findById(id)
      .populate('createdBy', USER_POPULATE_FIELDS)
      .populate('lastReplyBy', USER_POPULATE_FIELDS)
      .exec();

    if (!thread) {
      throw new NotFoundException(`Thread with ID ${id} not found`);
    }

    return thread;
  }

  async findByProject(projectId: string, options: FindThreadsOptions = {}, userId?: string): Promise<ThreadDocument[]> {
    const query: any = { projectId: new Types.ObjectId(projectId) };

    if (options.category) {
      query.category = options.category;
    }

    if (options.isPinned !== undefined) {
      query.isPinned = options.isPinned;
    }

    let threads = await this.threadModel
      .find(query)
      .populate('createdBy', USER_POPULATE_FIELDS)
      .populate('lastReplyBy', USER_POPULATE_FIELDS)
      .sort({ isPinned: -1, lastReplyAt: -1, createdAt: -1 })
      .exec();

    if (threads.length === 0 && !options.category && userId) {
      const generalThread = await this.create(userId, {
        projectId,
        title: 'General',
        category: 'general',
        content: "Welcome to the project! This is the general discussion thread. Feel free to start chatting."
      });
      
      threads = [await this.findById(generalThread._id.toString())] as any;
    }

    return threads;
  }

  async update(id: string, userId: string, updates: Partial<Thread>): Promise<ThreadDocument> {
    const thread = await this.findById(id);
    Object.assign(thread, updates);
    return thread.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const thread = await this.findById(id);
    await this.messageModel.deleteMany({ threadId: thread._id });
    await this.threadModel.deleteOne({ _id: thread._id });
  }

  async addMessage(threadId: string, userId: string, dto: CreateMessageDto): Promise<ThreadMessageDocument> {
    const thread = await this.findById(threadId);
    const userObjectId = new Types.ObjectId(userId);

    const message = new this.messageModel({
      threadId: thread._id,
      userId: userObjectId,
      content: dto.content,
      mentions: dto.mentions?.map((id) => new Types.ObjectId(id)) || [],
      reactions: [],
      attachments: [],
      isEdited: false,
    });

    const savedMessage = await message.save();

    await this.threadModel.updateOne(
      { _id: thread._id },
      {
        $inc: { replyCount: 1 },
        $set: {
          lastReplyAt: new Date(),
          lastReplyBy: userObjectId,
        },
        $addToSet: { participants: userObjectId },
      },
    );

    // ⭐ NOTIFY: NEW MESSAGE (With DB Insertion Loop)
    try {
      let rtGateway: any = null;
      let notifGateway: any = null;
      try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
      try { notifGateway = this.moduleRef.get('NotificationsGateway', { strict: false }); } catch(e) {}

      const db = this.threadModel.db;
      const projectDoc = await db.collection('projects').findOne({ _id: thread.projectId });
      
      if (projectDoc) {
        const rawMembers = projectDoc.members || projectDoc.sharedWith || projectDoc.participantIds || [];
        const allAssociatedIds: any[] = [
          projectDoc.ownerId,
          projectDoc.owner,
          ...rawMembers.map((m: any) => m?.userId || m?._id || m)
        ];

        const memberIdsToNotify: string[] = allAssociatedIds
          .filter(Boolean)
          .map(id => id.toString())
          .filter(id => id !== userId);

        const uniqueMembers: string[] = [...new Set(memberIdsToNotify)];
        const safeProjectName = projectDoc.name || projectDoc.title || 'Project';

        // 1. Save through NotificationsService so in-app + email fan-out both run
        let notificationsService: NotificationsService | null = null;
        try {
          notificationsService = this.moduleRef.get(NotificationsService, { strict: false });
        } catch (e) {}

        for (const recipientId of uniqueMembers) {
          try {
            if (notificationsService?.create) {
              await notificationsService.create({
                userId: recipientId,
                type: 'thread_message' as any,
                title: `💬 New message in ${thread.title}`,
                body: dto.content || `New message in ${thread.title}`,
                data: {
                  projectId: thread.projectId.toString(),
                  projectName: safeProjectName,
                  emailFanoutEligible: true,
                  teamRoomNotification: true,
                  extra: { threadId: thread._id.toString() },
                } as any,
                actions: [
                  {
                    label: 'View Team Room',
                    url: `/projects/${thread.projectId.toString()}?tab=team-room`,
                  },
                ],
                channels: ['in_app'] as any,
                priority: 'high' as any,
              } as any);
              continue;
            }

            // Fallback keeps the old in-app behavior if NotificationsService is unavailable.
            const notifResult = await db.collection('notifications').insertOne({
              userId: new Types.ObjectId(recipientId),
              type: 'thread_message',
              title: `💬 New message in ${thread.title}`,
              body: dto.content,
              data: {
                projectId: thread.projectId.toString(),
                projectName: safeProjectName,
                emailFanoutEligible: true,
                teamRoomNotification: true,
                extra: { threadId: thread._id.toString() },
              },
              channels: ['in_app'],
              priority: 'high',
              isRead: false,
              isClicked: false,
              isDismissed: false,
              groupCount: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            const newNotif = await db.collection('notifications').findOne({ _id: notifResult.insertedId });
            if (notifGateway?.server) {
              notifGateway.server.to(recipientId).emit('new_notification', newNotif);
              notifGateway.server.to(`user:${recipientId}`).emit('new_notification', newNotif);
            }
          } catch (e) {
            this.logger.warn(`Thread message notification failed for ${recipientId}: ${e?.message || e}`);
          }
        }

        // 2. Live Room Override (Chat Updates)
        if (notifGateway?.server) {
          notifGateway.server.to(`project:${thread.projectId}`).emit('new_thread_message', savedMessage);
          notifGateway.server.to(`thread:${thread._id}`).emit('new_thread_message', savedMessage);
        }
      }
    } catch (e) {
      this.logger.error('Message notification failed', e);
    }

    return savedMessage;
  }

  async getMessages(threadId: string, options: GetMessagesOptions = {}): Promise<ThreadMessageDocument[]> {
    const limit = options.limit || 50;
    const query: any = { threadId: new Types.ObjectId(threadId) };
    if (options.before) query.createdAt = { $lt: new Date(options.before) };
    return this.messageModel.find(query).populate('userId', USER_POPULATE_FIELDS).sort({ createdAt: -1 }).limit(limit).exec();
  }

  async updateMessage(messageId: string, userId: string, content: string): Promise<ThreadMessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException(`Message with ID ${messageId} not found`);
    if (!message.userId.equals(new Types.ObjectId(userId))) throw new ForbiddenException('You can only edit your own messages');
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    return message.save();
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException(`Message with ID ${messageId} not found`);
    if (!message.userId.equals(new Types.ObjectId(userId))) throw new ForbiddenException('You can only delete your own messages');
    const threadId = message.threadId;
    await this.messageModel.deleteOne({ _id: message._id });
    await this.threadModel.updateOne({ _id: threadId }, { $inc: { replyCount: -1 } });
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<ThreadMessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException(`Message with ID ${messageId} not found`);
    const userObjectId = new Types.ObjectId(userId);
    const existingReaction = message.reactions.find((r: any) => r.emoji === emoji);
    if (existingReaction) {
      if (!existingReaction.users.some((u: Types.ObjectId) => u.equals(userObjectId))) existingReaction.users.push(userObjectId);
    } else {
      message.reactions.push({ emoji, users: [userObjectId] } as any);
    }
    return message.save();
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<ThreadMessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException(`Message with ID ${messageId} not found`);
    const userObjectId = new Types.ObjectId(userId);
    const reaction = message.reactions.find((r: any) => r.emoji === emoji);
    if (reaction) {
      reaction.users = reaction.users.filter((u: Types.ObjectId) => !u.equals(userObjectId));
      if (reaction.users.length === 0) message.reactions = message.reactions.filter((r: any) => r.emoji !== emoji);
    }
    return message.save();
  }

  async togglePin(threadId: string, userId: string): Promise<ThreadDocument> {
    const thread = await this.findById(threadId);
    thread.isPinned = !thread.isPinned;
    return thread.save();
  }

  async toggleLock(threadId: string, userId: string): Promise<ThreadDocument> {
    const thread = await this.findById(threadId);
    thread.isLocked = !thread.isLocked;
    return thread.save();
  }

  async markAsRead(threadId: string, userId: string): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);
    await this.threadModel.updateOne({ _id: new Types.ObjectId(threadId), 'readStatus.userId': { $ne: userObjectId } }, { $push: { readStatus: { userId: userObjectId, lastReadAt: new Date() } } });
    await this.threadModel.updateOne({ _id: new Types.ObjectId(threadId), 'readStatus.userId': userObjectId }, { $set: { 'readStatus.$.lastReadAt': new Date() } });
  }

  async getUnreadCount(projectId: string, userId: string): Promise<number> {
    const userObjectId = new Types.ObjectId(userId);
    const threads = await this.threadModel.find({ projectId: new Types.ObjectId(projectId), participants: userObjectId });
    let unreadCount = 0;
    for (const thread of threads) {
      const readStatus = thread.readStatus.find((rs: any) => rs.userId.equals(userObjectId));
      if (!readStatus) unreadCount += thread.replyCount;
      else if (thread.lastReplyAt && thread.lastReplyAt > readStatus.lastReadAt) {
        const newMessages = await this.messageModel.countDocuments({ threadId: thread._id, createdAt: { $gt: readStatus.lastReadAt }, userId: { $ne: userObjectId } });
        unreadCount += newMessages;
      }
    }
    return unreadCount;
  }

  async linkTask(threadId: string, taskId: string): Promise<ThreadDocument> {
    const thread = await this.findById(threadId);
    const taskObjectId = new Types.ObjectId(taskId);
    if (!thread.linkedTasks.some((id: Types.ObjectId) => id.equals(taskObjectId))) {
      thread.linkedTasks.push(taskObjectId);
      await thread.save();
    }
    return thread;
  }

  async unlinkTask(threadId: string, taskId: string): Promise<ThreadDocument> {
    const thread = await this.findById(threadId);
    thread.linkedTasks = thread.linkedTasks.filter((id: Types.ObjectId) => !id.equals(new Types.ObjectId(taskId)));
    return thread.save();
  }

  async search(projectId: string, query: string): Promise<ThreadMessageDocument[]> {
    const threads = await this.threadModel.find({ projectId: new Types.ObjectId(projectId) }).select('_id');
    const threadIds = threads.map((t: any) => t._id);
    return this.messageModel.find({ threadId: { $in: threadIds }, content: { $regex: query, $options: 'i' } })
      .populate('userId', USER_POPULATE_FIELDS).populate('threadId', 'title').sort({ createdAt: -1 }).limit(50).exec();
  }
}
