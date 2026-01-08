// src/announcements/announcements.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Announcement, AnnouncementDocument } from './schemas/announcements.schema';

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
  constructor(
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<AnnouncementDocument>,
  ) {}

  private toObjectId(id: string, label: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label}`);
    }
    return new Types.ObjectId(id);
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
      .sort({ pinned: -1, createdAt: -1 })
      .exec();
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

    existing.pinned = !existing.pinned;
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
}
