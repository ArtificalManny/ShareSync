import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';
import { ThreadMessage, ThreadMessageDocument } from './schemas/thread-message.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateThreadMessageDto } from './dto/create-thread-message.dto';

export interface GetThreadMessagesOptions {
  limit?: number;
  before?: string;
}

const USER_POPULATE_FIELDS = 'firstName lastName username email profilePicture avatar avatarUrl';

@Injectable()
export class ThreadMessagesService {
  private readonly logger = new Logger(ThreadMessagesService.name);

  constructor(
    @InjectModel(ThreadMessage.name) private readonly messageModel: Model<ThreadMessageDocument>,
    private readonly eventEmitter: EventEmitter2,
    private readonly moduleRef: ModuleRef,
  ) {}

  async create(threadId: string, userId: string, dto: CreateThreadMessageDto): Promise<ThreadMessageDocument> {
    const message = new this.messageModel({
      threadId: new Types.ObjectId(threadId),
      userId: new Types.ObjectId(userId),
      content: dto.content,
      mentions: dto.mentions?.map((id) => new Types.ObjectId(id)) || [],
      reactions: [],
      attachments: [],
      isEdited: false,
    });

    const saved = await message.save();

    // ⭐ DIRECT REALTIME NOTIFICATIONS & LIVE ROOM OVERRIDE
    try {
      let rtGateway: any = null;
      let notifGateway: any = null;
      try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
      try { notifGateway = this.moduleRef.get('NotificationsGateway', { strict: false }); } catch(e) {}

      const db = this.messageModel.db;
      const threadDoc = await db.collection('threads').findOne({ _id: new Types.ObjectId(threadId) });
      
      if (threadDoc) {
        const projectId = threadDoc.projectId;
        const projectDoc = await db.collection('projects').findOne({ _id: projectId });
        
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
                  title: `💬 New message in ${threadDoc.title}`,
                  body: dto.content,
                  data: {
                    projectId: projectId.toString(),
                    projectName: safeProjectName,
                    emailFanoutEligible: true,
                    teamRoomNotification: true,
                    extra: { threadId },
                  } as any,
                  actions: [
                    {
                      label: 'View Team Room',
                      url: `/projects/${projectId.toString()}?tab=team-room`,
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
                title: `�� New message in ${threadDoc.title}`,
                body: dto.content,
                data: {
                  projectId: projectId.toString(),
                  projectName: safeProjectName,
                  emailFanoutEligible: true,
                  teamRoomNotification: true,
                  extra: { threadId },
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

          // 2. Live Room Override
          if (notifGateway?.server) {
            notifGateway.server.to(`project:${projectId}`).emit('new_thread_message', saved);
            notifGateway.server.to(`thread:${threadId}`).emit('new_thread_message', saved);
          }
        }
      }
    } catch (err) {
      this.logger.error('Failed thread message broadcast', err);
    }

    return saved;
  }

  async findById(messageId: string): Promise<ThreadMessageDocument> {
    const msg = await this.messageModel.findById(messageId);
    if (!msg) throw new NotFoundException(`ThreadMessage with ID ${messageId} not found`);
    return msg;
  }

  async findByThread(threadId: string, options: GetThreadMessagesOptions = {}): Promise<ThreadMessageDocument[]> {
    const limit = options.limit ?? 50;
    const query: any = { threadId: new Types.ObjectId(threadId) };
    if (options.before) query.createdAt = { $lt: new Date(options.before) };
    return this.messageModel.find(query).populate('userId', USER_POPULATE_FIELDS).sort({ createdAt: -1 }).limit(limit).exec();
  }

  async edit(messageId: string, userId: string, content: string): Promise<ThreadMessageDocument> {
    const msg = await this.findById(messageId);
    if (!msg.userId.equals(new Types.ObjectId(userId))) throw new ForbiddenException('You can only edit your own messages');
    msg.content = content;
    msg.isEdited = true;
    msg.editedAt = new Date();
    return msg.save();
  }

  async delete(messageId: string, userId: string): Promise<void> {
    const msg = await this.findById(messageId);
    if (!msg.userId.equals(new Types.ObjectId(userId))) throw new ForbiddenException('You can only delete your own messages');
    await this.messageModel.deleteOne({ _id: msg._id });
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<ThreadMessageDocument> {
    const msg = await this.findById(messageId);
    const userObjectId = new Types.ObjectId(userId);
    const existing = msg.reactions.find((r: any) => r.emoji === emoji);
    if (existing) {
      if (!existing.users.some((u: Types.ObjectId) => u.equals(userObjectId))) existing.users.push(userObjectId);
    } else {
      msg.reactions.push({ emoji, users: [userObjectId] } as any);
    }
    return msg.save();
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<ThreadMessageDocument> {
    const msg = await this.findById(messageId);
    const userObjectId = new Types.ObjectId(userId);
    const reaction = msg.reactions.find((r: any) => r.emoji === emoji);
    if (reaction) {
      reaction.users = reaction.users.filter((u: Types.ObjectId) => !u.equals(userObjectId));
      if (reaction.users.length === 0) msg.reactions = msg.reactions.filter((r: any) => r.emoji !== emoji);
    }
    return msg.save();
  }
}
