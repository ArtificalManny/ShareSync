import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Announcement, AnnouncementDocument } from './schemas/announcements.schema';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<AnnouncementDocument>,
  ) {}

  async create(dto: Partial<Announcement>) {
    const created = await this.announcementModel.create(dto);
    return created;
  }

  async list(filter: { projectId?: string; includeArchived?: boolean } = {}) {
    const q: any = {};
    if (filter.projectId) q.projectId = filter.projectId;
    if (!filter.includeArchived) q.archived = { $ne: true };

    return this.announcementModel
      .find(q)
      .sort({ pinned: -1, createdAt: -1 })
      .lean()
      .exec();
  }

  async pin(id: string, pinned: boolean) {
    return this.announcementModel
      .findByIdAndUpdate(id, { $set: { pinned: !!pinned } }, { new: true })
      .lean()
      .exec();
  }

  async archive(id: string, archived: boolean) {
    return this.announcementModel
      .findByIdAndUpdate(id, { $set: { archived: !!archived } }, { new: true })
      .lean()
      .exec();
  }
}
