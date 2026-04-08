// src/announcements/announcements.service.ts

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Optional,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';

import { Announcement, AnnouncementDocument } from './schemas/announcements.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationPriority,
} from '../notifications/schemas/notification.schema';

export type GetAnnouncementsOptions = {
  pinnedOnly?: boolean;
};

export type CreateAnnouncementInput = {
  projectId: string;
  authorId: string;
  title: string;
  message: string;
  type?: string;
  pinned?: boolean;
  attachments?: string[];
};

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<AnnouncementDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly eventEmitter: EventEmitter2,
    private readonly moduleRef: ModuleRef,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  private toObjectId(id: string, label: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label}`);
    }
    return new Types.ObjectId(id);
  }

  private normalizeId(value: any): string {
    if (!value) return '';
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    if (value instanceof Types.ObjectId) {
      return value.toString();
    }
    if (typeof value === 'object') {
      if (value._id) return this.normalizeId(value._id);
      if (value.id) return this.normalizeId(value.id);
      if (value.userId) return this.normalizeId(value.userId);
      if (typeof value.toString === 'function') return value.toString();
    }
    return '';
  }

  private collectRecipientUserIds(project: any, authorId: string): string[] {
    const author = this.normalizeId(authorId);
    const recipientSet = new Set<string>();

    const ownerId = this.normalizeId(project?.ownerId || project?.owner);
    if (ownerId && ownerId !== author) {
      recipientSet.add(ownerId);
    }

    const members = Array.isArray(project?.members) ? project.members : [];
    for (const member of members) {
      const memberId = this.normalizeId(member?.userId || member?.user);
      const memberNotificationsEnabled = member?.preferences?.notifications !== false;

      if (!memberId) continue;
      if (memberId === author) continue;
      if (!memberNotificationsEnabled) continue;

      recipientSet.add(memberId);
    }

    return Array.from(recipientSet);
  }

  public async getProjectAnnouncements(
    projectId: string,
    opts: GetAnnouncementsOptions = {},
  ) {
    const projectObjectId = this.toObjectId(projectId, 'projectId');
    const query: any = { projectId: projectObjectId };

    if (opts.pinnedOnly) query.pinned = true;

    return this.announcementModel.find(query).sort({ pinned: -1, createdAt: -1 }).exec();
  }

  public async create(input: CreateAnnouncementInput) {
    const projectObjectId = this.toObjectId(input.projectId, 'projectId');
    const authorObjectId = this.toObjectId(input.authorId, 'authorId');

    const doc = await this.announcementModel.create({
      projectId: projectObjectId,
      authorId: authorObjectId,
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      pinned: Boolean(input.pinned),
      attachments: input.attachments || [],
      readBy: [],
    });

    const project = await this.projectModel
      .findById(projectObjectId)
      .select({
        _id: 1,
        name: 1,
        ownerId: 1,
        owner: 1,
        members: 1,
        settings: 1,
      })
      .lean()
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const projectNotificationsEnabled = project?.settings?.notificationsEnabled !== false;
    if (!projectNotificationsEnabled) {
      this.logger.log(
        `Project ${input.projectId} has notifications disabled; announcement ${doc._id?.toString?.()} created without recipient notifications`,
      );
      return doc;
    }

    const recipientIds = this.collectRecipientUserIds(project, input.authorId);
    if (recipientIds.length === 0) {
      this.logger.log(
        `Announcement ${doc._id?.toString?.()} created, but no recipient members were resolved for project ${input.projectId}`,
      );
      return doc;
    }

    const safeProjectName =
      typeof project.name === 'string' && project.name.trim() ? project.name.trim() : 'Project';
    const safeTitle =
      typeof input.title === 'string' && input.title.trim() ? input.title.trim() : 'New announcement';
    const safeBody =
      typeof input.message === 'string' && input.message.trim() ? input.message.trim() : safeTitle;
    const priority = input.pinned ? NotificationPriority.HIGH : NotificationPriority.NORMAL;

    // ⭐ THE FIX: Native DB Insert + ModuleRef Broadcast (Bypasses missing NotificationsService)
    try {
      const db = this.announcementModel.db;
      
      // Attempt to dynamically fetch AppGateway to avoid circular/missing imports
      let appGateway: any = null;
      try {
        appGateway = this.moduleRef.get('AppGateway', { strict: false });
      } catch (e) {
        this.logger.warn('AppGateway not found via ModuleRef, websocket broadcast may not reach root listeners');
      }

      for (const recipientId of recipientIds) {
        try {
          // 1. Write the notification directly to the database
          const notifResult = await db.collection('notifications').insertOne({
            userId: new Types.ObjectId(recipientId),
            type: NotificationType.SYSTEM_ANNOUNCEMENT,
            title: `📢 ${safeProjectName}`,
            body: safeTitle,
            data: {
              projectId: input.projectId,
              projectName: safeProjectName,
              extra: {
                announcementId: doc._id?.toString?.(),
                announcementType: input.type || 'info',
                message: safeBody,
                pinned: Boolean(input.pinned),
              },
            },
            channels: ['in_app'],
            priority,
            isRead: false,
            isClicked: false,
            isDismissed: false,
            groupCount: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          const newNotif = await db.collection('notifications').findOne({ _id: notifResult.insertedId });

          // 2. Direct broadcast via WebSocket server (AppGateway)
          if (appGateway && appGateway.server) {
            appGateway.server.to(recipientId).emit('new_notification', newNotif);
            appGateway.server.to(recipientId).emit('notificationCreated', newNotif);
          }

          // 3. Failsafe internal emit for NotificationsGateway
          this.eventEmitter.emit('notification.created', newNotif);
        } catch (innerErr) {
          this.logger.error(`Failed to natively notify user ${recipientId}:`, innerErr);
        }
      }

      this.logger.log(`✅ Announcement ${doc._id?.toString?.()} natively notified ${recipientIds.length} recipient(s) for project ${input.projectId}`);
    } catch (err) {
      this.logger.error('⚠️ Failed to process native announcement notifications:', err);
    }

    return doc;
  }

  public async markAsRead(announcementId: string, userId: string) {
    const annId = this.toObjectId(announcementId, 'announcementId');
    const userObjectId = this.toObjectId(userId, 'userId');

    const updated = await this.announcementModel
      .findByIdAndUpdate(
        annId,
        { $addToSet: { readBy: userObjectId } },
        { new: true },
      )
      .exec();

    if (!updated) throw new NotFoundException('Announcement not found');
    return updated;
  }

  public async togglePin(announcementId: string) {
    const annId = this.toObjectId(announcementId, 'announcementId');
    const existing = await this.announcementModel.findById(annId).exec();

    if (!existing) throw new NotFoundException('Announcement not found');

    (existing as any).pinned = !(existing as any).pinned;
    await existing.save();

    return existing;
  }

  public async delete(announcementId: string) {
    const annId = this.toObjectId(announcementId, 'announcementId');
    const deleted = await this.announcementModel.findByIdAndDelete(annId).exec();

    if (!deleted) throw new NotFoundException('Announcement not found');
    return { success: true };
  }

  public async getReadStatus(announcementId: string, memberIds: string[]) {
    const annId = this.toObjectId(announcementId, 'announcementId');
    const ann = await this.announcementModel.findById(annId).exec();

    if (!ann) throw new NotFoundException('Announcement not found');

    const readSet = new Set((ann.readBy || []).map((x) => String(x)));

    return memberIds.map((memberId) => ({
      memberId,
      read: readSet.has(String(memberId)),
    }));
  }

  // Compatibility methods required by existing controller

  public async toggleLike(announcementId: string, userId: string) {
    const annId = this.toObjectId(announcementId, 'announcementId');
    const userObjectId = this.toObjectId(userId, 'userId');
    const ann = await this.announcementModel.findById(annId).exec();

    if (!ann) {
      throw new NotFoundException('Announcement not found');
    }

    const doc: any = ann as any;
    const likedBy = Array.isArray(doc.likedBy) ? doc.likedBy : [];

    const existingIndex = likedBy.findIndex(
      (entry: any) => this.normalizeId(entry) === userObjectId.toString(),
    );

    if (existingIndex >= 0) {
      likedBy.splice(existingIndex, 1);
    } else {
      likedBy.push(userObjectId);
    }

    doc.likedBy = likedBy;
    doc.likesCount = likedBy.length;
    doc.likes = likedBy.length;

    await ann.save();
    return ann;
  }

  public async addComment(
    announcementId: string,
    userId: string,
    text: string,
    attachments?: string[],
  ) {
    const annId = this.toObjectId(announcementId, 'announcementId');
    const userObjectId = this.toObjectId(userId, 'userId');
    const trimmedText = String(text || '').trim();

    if (!trimmedText) {
      throw new BadRequestException('Comment text is required');
    }

    const ann = await this.announcementModel.findById(annId).exec();

    if (!ann) {
      throw new NotFoundException('Announcement not found');
    }

    const doc: any = ann as any;
    const nextComment = {
      _id: new Types.ObjectId(),
      userId: userObjectId,
      text: trimmedText,
      attachments: Array.isArray(attachments) ? attachments : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!Array.isArray(doc.comments)) {
      doc.comments = [];
    }

    doc.comments.push(nextComment);
    doc.commentCount = doc.comments.length;

    await ann.save();
    return ann;
  }

  public async deleteComment(
    announcementId: string,
    commentId: string,
    userId: string,
  ) {
    const annId = this.toObjectId(announcementId, 'announcementId');
    const userObjectId = this.toObjectId(userId, 'userId');

    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Invalid commentId');
    }

    const ann = await this.announcementModel.findById(annId).exec();

    if (!ann) {
      throw new NotFoundException('Announcement not found');
    }

    const doc: any = ann as any;

    if (!Array.isArray(doc.comments)) {
      throw new NotFoundException('Comment not found');
    }

    const commentIndex = doc.comments.findIndex(
      (comment: any) => this.normalizeId(comment?._id) === String(commentId),
    );

    if (commentIndex === -1) {
      throw new NotFoundException('Comment not found');
    }

    const comment = doc.comments[commentIndex];
    const announcementAuthorId = this.normalizeId(doc.authorId);
    const commentAuthorId = this.normalizeId(comment?.userId);
    const actorId = userObjectId.toString();

    const canDelete =
      actorId === announcementAuthorId || actorId === commentAuthorId;

    if (!canDelete) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }

    doc.comments.splice(commentIndex, 1);
    doc.commentCount = doc.comments.length;

    await ann.save();
    return ann;
  }
}
