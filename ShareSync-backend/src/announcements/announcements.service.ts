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

export type UpdateAnnouncementInput = {
  projectId: string;
  userId?: string;
  title?: string;
  message?: string;
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

  private async recordProjectActivity(data: {
    userId: string;
    projectId?: string;
    type: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    details?: Record<string, any>;
    metadata?: Record<string, any>;
    payload?: Record<string, any>;
  }): Promise<void> {
    try {
      if (!data?.userId || !Types.ObjectId.isValid(data.userId)) return;
      if (!data?.projectId || !Types.ObjectId.isValid(data.projectId)) return;

      const now = new Date();
      const userObjectId = new Types.ObjectId(data.userId);
      const projectObjectId = new Types.ObjectId(data.projectId);

      const doc: any = {
        userId: userObjectId,
        actorId: userObjectId,
        projectId: projectObjectId,
        type: data.type,
        entityType: data.entityType || null,
        action: data.action || data.type,
        details: data.details || {},
        metadata: data.metadata || {},
        payload: data.payload || {},
        createdAt: now,
        updatedAt: now,
      };

      if (data.entityId) {
        if (Types.ObjectId.isValid(data.entityId)) {
          doc.entityId = new Types.ObjectId(data.entityId);
        }
        doc.entityKey = data.entityId;
      }

      const result = await this.announcementModel.db.collection('activities').insertOne(doc);
      const savedActivity = { ...doc, _id: result.insertedId };

      this.eventEmitter.emit('activityCreated', savedActivity);
      this.eventEmitter.emit('activity:created', savedActivity);
      this.eventEmitter.emit('activity.created', savedActivity);
    } catch (err: any) {
      this.logger.warn(`Project activity logging failed (${data?.type}): ${err?.message || err}`);
    }
  }


  private readonly userPopulateFields =
    'name firstName lastName username email profilePicture profileImage avatar avatarUrl photoUrl imageUrl image picture';

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

    return this.announcementModel.find(query).populate('authorId', this.userPopulateFields).sort({ pinned: -1, createdAt: -1 }).exec();
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
    await doc.populate('authorId', this.userPopulateFields);

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

    await this.recordProjectActivity({
      userId: input.authorId,
      projectId: input.projectId,
      type: 'announcement_created',
      entityType: 'announcement',
      entityId: doc._id?.toString?.(),
      action: 'created',
      details: {
        announcementTitle: input.title || 'Announcement',
        title: input.title || 'Announcement',
        message: input.message || '',
        announcementType: input.type || 'info',
        pinned: Boolean(input.pinned),
      },
      metadata: {
        source: 'announcements',
        announcementId: doc._id?.toString?.(),
      },
      payload: {
        announcementTitle: input.title || 'Announcement',
        announcementId: doc._id?.toString?.(),
      },
    });

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
    const priority = NotificationPriority.HIGH;

    // Route through NotificationsService so in-app + email fan-out both run.
    try {
      if (!this.notifications?.createBulk) {
        this.logger.warn(
          `NotificationsService unavailable; announcement ${doc._id?.toString?.()} created without email fan-out`,
        );
        return doc;
      }

      await this.notifications.createBulk(
        recipientIds.map((recipientId) => ({
          userId: recipientId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: `📢 ${safeProjectName}`,
          body: safeTitle,
          icon: '📢',
          priority,
          triggeredBy: input.authorId,
          data: {
            projectId: input.projectId,
            projectName: safeProjectName,
            announcementId: doc._id?.toString?.(),
            announcementType: input.type || 'info',
            message: safeBody,
            pinned: Boolean(input.pinned),
            emailFanoutEligible: true,
            projectMemberNotification: true,
          } as any,
          actions: [{ label: 'View Project', url: `/projects/${input.projectId}` }],
          groupKey: `announcement-${input.projectId}-${doc._id?.toString?.()}`,
        })),
      );

      this.logger.log(
        `✅ Announcement ${doc._id?.toString?.()} notified ${recipientIds.length} recipient(s) for project ${input.projectId}`,
      );
    } catch (err: any) {
      this.logger.error(
        `⚠️ Failed to send announcement notifications for ${doc._id?.toString?.()}: ${err?.message || err}`,
      );
    }

    return doc;
  }

  public async update(announcementId: string, input: UpdateAnnouncementInput) {
    const annId = this.toObjectId(announcementId, 'announcementId');
    const projectObjectId = this.toObjectId(input.projectId, 'projectId');

    const existing = await this.announcementModel
      .findOne({ _id: annId, projectId: projectObjectId })
      .exec();

    if (!existing) {
      throw new NotFoundException('Announcement not found');
    }

    const update: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (typeof input.title === 'string') {
      const title = input.title.trim();
      if (title) update.title = title;
    }

    if (typeof input.message === 'string') {
      const message = input.message.trim();
      if (message) update.message = message;
    }

    if (typeof input.type === 'string') {
      const type = input.type.trim().toLowerCase();
      if (type) update.type = type;
    }

    if (typeof input.pinned === 'boolean') {
      update.pinned = input.pinned;
    }

    if (Array.isArray(input.attachments)) {
      update.attachments = input.attachments;
    }

    const updated = await this.announcementModel
      .findByIdAndUpdate(annId, { $set: update }, { new: true })
      .populate('authorId', this.userPopulateFields)
      .exec();

    if (!updated) {
      throw new NotFoundException('Announcement not found');
    }

    return updated;
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
      .populate('authorId', this.userPopulateFields)
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
    await existing.populate('authorId', this.userPopulateFields);

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
    const likedBy = Array.isArray((doc as any).likes)
      ? [...(doc as any).likes]
      : Array.isArray((doc as any).likedBy)
        ? [...(doc as any).likedBy]
        : [];

    const existingIndex = likedBy.findIndex(
      (entry: any) => this.normalizeId(entry) === userObjectId.toString(),
    );

    if (existingIndex >= 0) {
      likedBy.splice(existingIndex, 1);
    } else {
      likedBy.push(userObjectId);
    }

    (doc as any).likedBy = likedBy;
    (doc as any).likesCount = likedBy.length;
    (doc as any).likes = likedBy;

    await ann.save();
    await ann.populate('authorId', this.userPopulateFields);
    return ann;
  }

  public async addComment(
    announcementId: string,
    userId: string,
    text: string,
    attachments: any[] = [],
  ) {
    const annId = this.toObjectId(announcementId, 'announcementId');

    const actorId = this.normalizeId(userId);
    if (!actorId) {
      throw new BadRequestException('User is required to comment');
    }

    const cleanText = String(text ?? '').trim();
    if (!cleanText) {
      throw new BadRequestException('Comment text is required');
    }

    const existing = await this.announcementModel.findById(annId).exec();

    if (!existing) {
      throw new NotFoundException('Announcement not found');
    }

    const nextComment = {
      _id: new Types.ObjectId(),
      userId: actorId,
      authorId: actorId,
      text: cleanText,
      content: cleanText,
      message: cleanText,
      attachments: Array.isArray(attachments) ? attachments : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updated = await this.announcementModel
      .findByIdAndUpdate(
        annId,
        {
          $push: { comments: nextComment },
        },
        {
          new: true,
          runValidators: false,
        },
      )
      .populate('authorId', this.userPopulateFields)
      .exec();

    if (!updated) {
      throw new NotFoundException('Announcement not found');
    }

    return updated;
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
    await ann.populate('authorId', this.userPopulateFields);
    return ann;
  }
}
