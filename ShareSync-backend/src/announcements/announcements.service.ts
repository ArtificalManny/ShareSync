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

const USER_POPULATE = 'firstName lastName username email profilePicture avatar avatarUrl photoUrl image';

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
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid ${label}`);
    return new Types.ObjectId(id);
  }

  private normalizeId(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value?._id?.toString() || value?.id?.toString() || value?.toString() || '';
  }

  public async getProjectAnnouncements(projectId: string, opts: GetAnnouncementsOptions = {}) {
    const query: any = { projectId: this.toObjectId(projectId, 'projectId') };
    if (opts.pinnedOnly) query.pinned = true;

    return this.announcementModel
      .find(query)
      .populate('authorId', USER_POPULATE)
      .populate('comments.authorId', USER_POPULATE)
      .sort({ pinned: -1, createdAt: -1 })
      .lean() // ⭐ Use lean for cleaner JSON serialization
      .exec();
  }

  public async create(input: CreateAnnouncementInput) {
    const created = await this.announcementModel.create({
      projectId: this.toObjectId(input.projectId, 'projectId'),
      authorId: this.toObjectId(input.authorId, 'authorId'),
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      pinned: !!input.pinned,
      attachments: input.attachments || [],
    });

    return this.announcementModel
      .findById(created._id)
      .populate('authorId', USER_POPULATE)
      .lean()
      .exec();
  }

  public async toggleLike(announcementId: string, userId: string) {
    const ann = await this.announcementModel.findById(announcementId);
    if (!ann) throw new NotFoundException('Announcement not found');

    const uid = this.normalizeId(userId);
    const likes = (ann as any).likedBy || [];
    const idx = likes.findIndex(l => this.normalizeId(l) === uid);

    if (idx >= 0) likes.splice(idx, 1);
    else likes.push(new Types.ObjectId(uid));

    (ann as any).likedBy = likes;
    await ann.save();

    return this.announcementModel.findById(announcementId)
      .populate('authorId', USER_POPULATE)
      .populate('comments.authorId', USER_POPULATE)
      .lean()
      .exec();
  }

  public async addComment(announcementId: string, userId: string, text: string, attachments?: string[]) {
    const ann = await this.announcementModel.findById(announcementId);
    if (!ann) throw new NotFoundException('Announcement not found');

    const doc: any = ann as any;
    if (!doc.comments) doc.comments = [];
    doc.comments.push({
      _id: new Types.ObjectId(),
      authorId: new Types.ObjectId(userId), // ⭐ Ensure authorId is used for comments too
      text: text.trim(),
      attachments: attachments || [],
      createdAt: new Date(),
    });

    await ann.save();
    return this.announcementModel.findById(announcementId)
      .populate('authorId', USER_POPULATE)
      .populate('comments.authorId', USER_POPULATE)
      .lean()
      .exec();
  }

  public async togglePin(announcementId: string) {
    const ann = await this.announcementModel.findById(announcementId);
    if (!ann) throw new NotFoundException('Announcement not found');
    ann.pinned = !ann.pinned;
    await ann.save();
    return this.announcementModel.findById(announcementId).populate('authorId', USER_POPULATE).lean().exec();
  }

  public async delete(announcementId: string) {
    await this.announcementModel.findByIdAndDelete(announcementId);
    return { success: true };
  }

  public async markAsRead(announcementId: string, userId: string) {
    return this.announcementModel.findByIdAndUpdate(
      announcementId,
      { $addToSet: { readBy: new Types.ObjectId(userId) } },
      { new: true }
    ).populate('authorId', USER_POPULATE).lean().exec();
  }
}
