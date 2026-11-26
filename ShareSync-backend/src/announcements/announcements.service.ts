// src/announcements/announcements.service.ts

import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
  Optional,
  ForbiddenException,
} from '@nestjs/common';
import {
  InjectConnection,
  InjectModel,
} from '@nestjs/mongoose';
import {
  Connection,
  Model,
  Types,
} from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';

import { Announcement, AnnouncementDocument, AnnouncementCommentEmailEvent } from './schemas/announcements.schema';
import { announcementStanding } from './announcements-project-access.guard';
import { COMMENT_EMAIL_LIMITS, commentEmailAdmission } from './announcement-comment-email.limits';
import { announcementCommentRecipients, commentEmailId } from '../notifications/announcement-comment-email.policy';
import { normalizeAnnouncementAttachmentLinks } from './announcement-attachment-links';
import { assertAnnouncementContent, hasValidAnnouncementPoll, normalizeAnnouncementText } from './announcement-content.policy';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { VaultService } from '../vault/vault.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationPriority,
} from '../notifications/schemas/notification.schema';

export type GetAnnouncementsOptions = {
  pinnedOnly?: boolean;
};

export type AnnouncementPollInput = {
  question?: string;
  options?: Array<string | { id?: string; text?: string; votes?: any[] }>;
  closed?: boolean;
  createdAt?: Date | string;
} | null;

export type AnnouncementFileReferenceInput =
  | string
  | {
      fileId?: string;
    };

export type AnnouncementAffectedReferenceInput =
  | string
  | {
      _id?: string;
      id?: string;
      taskId?: string;
      milestoneId?: string;
    };

export type CreateAnnouncementInput = {
  projectId: string;
  authorId: string;
  title?: string;
  message?: string;
  type?: string;
  pinned?: boolean;
  attachments?: string[];
  fileReferences?: AnnouncementFileReferenceInput[];
  affectedMoveIds?: AnnouncementAffectedReferenceInput[];
  affectedMilestoneIds?: AnnouncementAffectedReferenceInput[];
  poll?: AnnouncementPollInput;
};

export type UpdateAnnouncementInput = {
  projectId: string;
  userId?: string;
  title?: string;
  message?: string;
  type?: string;
  pinned?: boolean;
  attachments?: string[];
  fileReferences?: AnnouncementFileReferenceInput[];
  affectedMoveIds?: AnnouncementAffectedReferenceInput[];
  affectedMilestoneIds?: AnnouncementAffectedReferenceInput[];
  poll?: AnnouncementPollInput;
};

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<AnnouncementDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly vaultService: VaultService,
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


  // openshare-announcements-no-email-v1: announcement authors and commenters are
  // shown by name and avatar only. Email addresses are never sent with them.
  private readonly userPopulateFields =
    'name firstName lastName username profilePicture profileImage avatar avatarUrl photoUrl imageUrl image picture';

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

    return this.announcementModel
      .find(query)
      .populate(
        'authorId',
        this.userPopulateFields,
      )
      .populate(
        'comments.authorId',
        this.userPopulateFields,
      )
      .populate(
        'affectedMoveIds',
        'title status priority dueDate milestoneId',
      )
      .populate(
        'affectedMilestoneIds',
        'title status targetDate dueDate progress',
      )
      .sort({
        pinned: -1,
        createdAt: -1,
      })
      .exec();
  }

  private async normalizeAffectedEntityIds(
    projectId: string,
    references:
      | AnnouncementAffectedReferenceInput[]
      | undefined,
    modelName: 'Task' | 'Milestone',
    label: 'Move' | 'milestone',
  ): Promise<Types.ObjectId[]> {
    if (!Array.isArray(references)) {
      return [];
    }

    const rawIds = Array.from(
      new Set(
        references
          .map((reference) => {
            if (typeof reference === 'string') {
              return reference.trim();
            }

            return String(
              reference?._id ||
                reference?.id ||
                reference?.taskId ||
                reference?.milestoneId ||
                '',
            ).trim();
          })
          .filter(Boolean),
      ),
    );

    if (rawIds.length > 10) {
      throw new BadRequestException(
        `An announcement can reference up to 10 ${
          label === 'Move'
            ? 'Moves'
            : 'milestones'
        }`,
      );
    }

    const objectIds = rawIds.map((rawId) => {
      if (!Types.ObjectId.isValid(rawId)) {
        throw new BadRequestException(
          `${label} ID is invalid`,
        );
      }

      return new Types.ObjectId(rawId);
    });

    if (objectIds.length === 0) {
      return [];
    }

    const projectObjectId = this.toObjectId(
      projectId,
      'projectId',
    );

    let entityModel: Model<any>;

    try {
      entityModel =
        this.connection.model(modelName);
    } catch {
      throw new BadRequestException(
        `${label} references are unavailable`,
      );
    }

    const matchingEntities = await entityModel
      .find({
        _id: {
          $in: objectIds,
        },
        projectId: projectObjectId,
      })
      .select({
        _id: 1,
      })
      .lean()
      .exec();

    const matchingIds = new Set(
      matchingEntities.map((entity: any) =>
        String(entity?._id || ''),
      ),
    );

    const allBelongToProject =
      objectIds.every((objectId) =>
        matchingIds.has(
          objectId.toString(),
        ),
      );

    if (!allBelongToProject) {
      throw new BadRequestException(
        `One or more selected ${
          label === 'Move'
            ? 'Moves'
            : 'milestones'
        } do not belong to this project`,
      );
    }

    return objectIds;
  }

  private async normalizeFileReferences(
    projectId: string,
    userId: string,
    references:
      | AnnouncementFileReferenceInput[]
      | undefined,
  ): Promise<
    Array<{
      fileId: string;
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
      source: 'project_file';
      linkedBy: Types.ObjectId;
      linkedAt: Date;
    }>
  > {
    if (!Array.isArray(references)) {
      return [];
    }

    const fileIds = Array.from(
      new Set(
        references
          .map((reference) =>
            String(
              typeof reference === 'string'
                ? reference
                : reference?.fileId || '',
            ).trim(),
          )
          .filter(Boolean),
      ),
    );

    if (fileIds.length > 10) {
      throw new BadRequestException(
        'An announcement can reference up to 10 project Files',
      );
    }

    const linkedBy = this.toObjectId(
      userId,
      'userId',
    );

    return Promise.all(
      fileIds.map(async (fileId) => {
        if (!Types.ObjectId.isValid(fileId)) {
          throw new BadRequestException(
            'Project File ID is invalid',
          );
        }

        const file =
          await this.vaultService
            .findAccessibleFileForProject(
              fileId,
              projectId,
              userId,
            );

        const fileName = String(
          file.originalName ||
            'Project file',
        ).trim();

        const fileUrl = String(
          file.fileUrl || '',
        ).trim();

        const fileType = String(
          file.mimeType || '',
        ).trim();

        const rawFileSize = Number(
          file.sizeInBytes ?? 0,
        );

        const fileSize =
          Number.isFinite(rawFileSize) &&
          rawFileSize >= 0
            ? rawFileSize
            : 0;

        if (!fileName || !fileUrl) {
          throw new BadRequestException(
            'This project File is missing required file information',
          );
        }

        return {
          fileId,
          fileName,
          fileUrl,
          fileType,
          fileSize,
          source:
            'project_file' as const,
          linkedBy,
          linkedAt: new Date(),
        };
      }),
    );
  }

  private normalizePoll(poll: AnnouncementPollInput) {
    if (poll === undefined || poll === null || typeof poll !== 'object') return null;

    const question = String((poll as any).question ?? '').trim().slice(0, 180);
    const rawOptions = Array.isArray((poll as any).options) ? (poll as any).options : [];

    const options = rawOptions
      .map((option: any, index: number) => {
        const text = typeof option === 'string'
          ? option.trim()
          : String(option?.text ?? '').trim();

        if (!text) return null;

        const id = typeof option === 'object' && option?.id
          ? String(option.id).trim().slice(0, 64)
          : `option-${index + 1}-${new Types.ObjectId().toString().slice(-6)}`;

        const rawVotes = Array.isArray(option?.votes) ? option.votes : [];
        const voteIds = Array.from(
          new Set<string>(
            rawVotes
              .map((vote: any) => this.normalizeId(vote))
              .filter(Boolean)
              .map((vote: any) => vote.toString()),
          ),
        ).map((voteId: string) => new Types.ObjectId(voteId));

        return {
          id,
          text: text.slice(0, 120),
          votes: voteIds,
        };
      })
      .filter(Boolean)
      .slice(0, 5);

    if (!question || options.length < 2) return null;

    return {
      question,
      options,
      closed: Boolean((poll as any).closed),
      createdAt: (poll as any).createdAt ? new Date((poll as any).createdAt) : new Date(),
    };
  }

  public async create(input: CreateAnnouncementInput) {
    const projectObjectId = this.toObjectId(input.projectId, 'projectId');
    const authorObjectId = this.toObjectId(input.authorId, 'authorId');
    const attachments = normalizeAnnouncementAttachmentLinks(input.attachments);
    const title = normalizeAnnouncementText(input.title, 'title');
    const message = normalizeAnnouncementText(input.message, 'message');
    if (input.poll != null && !hasValidAnnouncementPoll(input.poll)) {
      throw new BadRequestException('Add a poll question and at least two options');
    }
    const poll = this.normalizePoll(input.poll);
    if (input.poll != null && !hasValidAnnouncementPoll(poll)) {
      throw new BadRequestException('Add a poll question and at least two options');
    }

    const [
      affectedMoveIds,
      affectedMilestoneIds,
    ] = await Promise.all([
      this.normalizeAffectedEntityIds(
        input.projectId,
        input.affectedMoveIds,
        'Task',
        'Move',
      ),
      this.normalizeAffectedEntityIds(
        input.projectId,
        input.affectedMilestoneIds,
        'Milestone',
        'milestone',
      ),
    ]);

    const fileReferences =
      await this.normalizeFileReferences(
        input.projectId,
        input.authorId,
        input.fileReferences,
      );

    assertAnnouncementContent({ title, message, attachments, fileReferences, poll });

    const doc = await this.announcementModel.create({
      projectId: projectObjectId,
      authorId: authorObjectId,
      title,
      message,
      type: input.type || 'info',
      pinned: Boolean(input.pinned),
      attachments,
      fileReferences,
      affectedMoveIds,
      affectedMilestoneIds,
      poll,
      readBy: [],
    });
    await doc.populate([
      {
        path: 'authorId',
        select: this.userPopulateFields,
      },
      {
        path: 'comments.authorId',
        select: this.userPopulateFields,
      },
      {
        path: 'affectedMoveIds',
        select:
          'title status priority dueDate milestoneId',
      },
      {
        path: 'affectedMilestoneIds',
        select:
          'title status targetDate dueDate progress',
      },
    ]);

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
        announcementTitle: title || 'Announcement',
        title: title || 'Announcement',
        message,
        announcementType: input.type || 'info',
        pinned: Boolean(input.pinned),
      },
      metadata: {
        source: 'announcements',
        announcementId: doc._id?.toString?.(),
      },
      payload: {
        announcementTitle: title || 'Announcement',
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
    const safeTitle = title || 'New announcement';
    const safeBody = message || safeTitle;
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

    if (input.title !== undefined) {
      update.title = normalizeAnnouncementText(input.title, 'title');
    }

    if (input.message !== undefined) {
      update.message = normalizeAnnouncementText(input.message, 'message');
    }

    if (typeof input.type === 'string') {
      const type = input.type.trim().toLowerCase();
      if (type) update.type = type;
    }

    if (typeof input.pinned === 'boolean') {
      update.pinned = input.pinned;
    }

    if (Array.isArray(input.attachments)) {
      update.attachments = normalizeAnnouncementAttachmentLinks(
        input.attachments,
        (existing as any).attachments,
      );
    }

    if (Array.isArray(input.affectedMoveIds)) {
      update.affectedMoveIds =
        await this.normalizeAffectedEntityIds(
          input.projectId,
          input.affectedMoveIds,
          'Task',
          'Move',
        );
    }

    if (
      Array.isArray(
        input.affectedMilestoneIds,
      )
    ) {
      update.affectedMilestoneIds =
        await this.normalizeAffectedEntityIds(
          input.projectId,
          input.affectedMilestoneIds,
          'Milestone',
          'milestone',
        );
    }

    if (Array.isArray(input.fileReferences)) {
      const actorId = String(
        input.userId || '',
      ).trim();

      if (!actorId) {
        throw new BadRequestException(
          'User is required to update File references',
        );
      }

      update.fileReferences =
        await this.normalizeFileReferences(
          input.projectId,
          actorId,
          input.fileReferences,
        );
    }

    // Validate the resulting document, not just the fields supplied in a PATCH.
    // Polls and votes remain read-only in this existing edit endpoint.
    assertAnnouncementContent({
      title: update.title ?? existing.title,
      message: update.message ?? existing.message,
      attachments: update.attachments ?? existing.attachments,
      fileReferences: update.fileReferences ?? existing.fileReferences,
      poll: existing.poll,
    });

    // Compare and increment the version so two partial edits cannot jointly
    // remove the last content. Do not overwrite comments or the email outbox.
    const version = (existing as any).__v;
    const updated = await this.announcementModel
      .findOneAndUpdate(
        { _id: annId, projectId: projectObjectId, __v: version === undefined ? { $exists: false } : version },
        {
          $set: update,
          $inc: { __v: 1 },
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .populate(
        'authorId',
        this.userPopulateFields,
      )
      .populate(
        'comments.authorId',
        this.userPopulateFields,
      )
      .populate(
        'affectedMoveIds',
        'title status priority dueDate milestoneId',
      )
      .populate(
        'affectedMilestoneIds',
        'title status targetDate dueDate progress',
      )
      .exec();

    if (!updated) {
      throw new ConflictException('Announcement changed while editing. Refresh and try again.');
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
      .populate('comments.authorId', this.userPopulateFields)
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
    await existing.populate('comments.authorId', this.userPopulateFields);

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
    await ann.populate('comments.authorId', this.userPopulateFields);
    return ann;
  }

  public async votePoll(announcementId: string, userId: string, optionId: string) {
    const annId = this.toObjectId(announcementId, 'announcementId');
    const actorId = this.normalizeId(userId);
    const cleanOptionId = String(optionId ?? '').trim();

    if (!actorId) {
      throw new BadRequestException('User is required to vote');
    }

    if (!cleanOptionId) {
      throw new BadRequestException('Poll option is required');
    }

    const ann = await this.announcementModel.findById(annId).exec();

    if (!ann) {
      throw new NotFoundException('Announcement not found');
    }

    const poll = (ann as any).poll;
    if (!poll || !Array.isArray(poll.options)) {
      throw new BadRequestException('Announcement does not have a poll');
    }

    if (poll.closed) {
      throw new BadRequestException('Poll is closed');
    }

    const hasOption = poll.options.some((option: any) => String(option?.id) === cleanOptionId);
    if (!hasOption) {
      throw new BadRequestException('Poll option not found');
    }

    const actorKey = actorId.toString();

    poll.options = poll.options.map((option: any) => {
      const votes = Array.isArray(option.votes) ? option.votes : [];
      const nextVotes = votes.filter((vote: any) => String(vote) !== actorKey);

      if (String(option.id) === cleanOptionId) {
        nextVotes.push(actorId);
      }

      return {
        ...option,
        votes: nextVotes,
      };
    });

    (ann as any).poll = poll;
    ann.markModified('poll');

    await ann.save();
    await ann.populate('authorId', this.userPopulateFields);
    await ann.populate('comments.authorId', this.userPopulateFields);
    return ann;
  }

  private async prepareCommentEmailEvent(
    announcement: AnnouncementDocument,
    actorId: string,
    commentId: Types.ObjectId,
  ): Promise<AnnouncementCommentEmailEvent | undefined> {
    // Keep disabled until the delivery worker and its tests are complete.
    if (process.env.ANNOUNCEMENT_COMMENT_EMAIL_ENABLED !== 'true' || announcement.archived) return;
    try {
      const projectId = commentEmailId(announcement.projectId);
      const actor = commentEmailId(actorId);
      if (!projectId || !actor) return;
      const project = await this.projectModel.findById(projectId)
        .select({ ownerId: 1, owner: 1, createdBy: 1, createdById: 1, members: 1,
          settings: 1, status: 1, isArchived: 1 }).lean().exec();
      if (announcementStanding(project, actor) !== 'writer') return;
      const recipients = announcementCommentRecipients(project, actor).filter((id) => {
        const standing = announcementStanding(project, id);
        return standing === 'writer' || standing === 'reader';
      });
      if (!recipients.length) return;
      if (recipients.length > COMMENT_EMAIL_LIMITS.recipientsPerEvent) {
        this.logger.warn('Announcement comment email suppressed: recipient limit');
        return;
      }
      return {
        commentId,
        actorId: new Types.ObjectId(actor),
        recipientIds: recipients.map((id) => new Types.ObjectId(id)),
        queuedAt: new Date(),
        nextAttemptAt: new Date(),
        leaseUntil: new Date(0),
        cursor: 0,
        attempts: 0,
      };
    } catch {
      // Notification-only lookup failure must not reject a valid comment.
      // No user content, addresses or provider credentials are logged.
      this.logger.warn('Announcement comment email eligibility lookup failed; comment will be saved without an email event');
      return;
    }
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
      attachments: normalizeAnnouncementAttachmentLinks(
        Array.isArray(attachments) ? attachments : [],
      ),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const emailEvent = await this.prepareCommentEmailEvent(existing, actorId, nextComment._id);

    // Conditional write caps the outbox even with concurrent comment submissions.
    // A rejected admission is not a rejected comment. Do not retry ambiguous write errors.
    const options = { new: true, runValidators: false };
    const present = (query: any) => query.select('-commentEmailOutbox')
      .populate('authorId', this.userPopulateFields)
      .populate('comments.authorId', this.userPopulateFields).exec();
    let updated: AnnouncementDocument | null = null;
    if (emailEvent) {
      updated = await present(this.announcementModel.findOneAndUpdate(
        { _id: annId, projectId: existing.projectId, archived: { $ne: true },
          ...commentEmailAdmission(emailEvent.actorId) },
        { $push: { comments: nextComment, commentEmailOutbox: emailEvent } }, options,
      ));
      if (!updated) this.logger.warn('Announcement comment email suppressed: outbox admission limit or announcement changed');
    }
    if (!updated) {
      updated = await present(this.announcementModel.findByIdAndUpdate(
        annId, { $push: { comments: nextComment } }, options,
      ));
    }

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
    const commentAuthorId = this.normalizeId(
      comment?.authorId || comment?.userId,
    );
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
    await ann.populate('comments.authorId', this.userPopulateFields);
    return ann;
  }
}
