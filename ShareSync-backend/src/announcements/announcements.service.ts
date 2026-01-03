import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Announcement, AnnouncementDocument } from './schemas/announcements.schema';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectModel(Announcement.name) 
    private announcementModel: Model<AnnouncementDocument>,
    private activitiesService: ActivitiesService,
  ) {}

  async create(data: {
    projectId: string;
    authorId: string;
    title: string;
    message: string;
    type?: string;
    pinned?: boolean;
    attachments?: string[];
  }): Promise<Announcement> {
    const announcement = new this.announcementModel({
      projectId: new Types.ObjectId(data.projectId),
      authorId: new Types.ObjectId(data.authorId),
      title: data.title,
      message: data.message,
      type: data.type || 'general',
      pinned: data.pinned ?? true,
      attachments: data.attachments || [],
    });

    await announcement.save();

    // ⭐ FIX: Use 'details' instead of 'metadata' for custom fields
    await this.activitiesService.logActivity({
      projectId: data.projectId,
      userId: data.authorId,
      action: 'announcement_created',
      details: { 
        announcementId: announcement._id,
        title: data.title,
        type: data.type 
      },
    });

    return announcement.populate('authorId', 'firstName lastName avatar');
  }

  async getProjectAnnouncements(
    projectId: string,
    options: {
      pinnedOnly?: boolean;
      limit?: number;
    } = {}
  ): Promise<Announcement[]> {
    const query: any = { projectId: new Types.ObjectId(projectId) };
    
    if (options.pinnedOnly) {
      query.pinned = true;
    }

    return this.announcementModel
      .find(query)
      .populate('authorId', 'firstName lastName avatar')
      .sort({ pinned: -1, createdAt: -1 })
      .limit(options.limit || 50)
      .exec();
  }

  async markAsRead(
    announcementId: string,
    userId: string
  ): Promise<Announcement> {
    const announcement = await this.announcementModel.findById(announcementId);
    
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    // Check if already read
    const alreadyRead = announcement.readBy.some(
      (r: any) => r.userId.toString() === userId
    );

    if (!alreadyRead) {
      announcement.readBy.push({
        userId: new Types.ObjectId(userId) as any,
        readAt: new Date(),
      });
      await announcement.save();
    }

    return announcement;
  }

  async getReadStatus(
    announcementId: string,
    projectMemberIds: string[]
  ): Promise<{
    total: number;
    read: number;
    unread: number;
    readByUsers: string[];
  }> {
    const announcement = await this.announcementModel.findById(announcementId);
    
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    const readByUserIds = announcement.readBy.map((r: any) => r.userId.toString());
    
    return {
      total: projectMemberIds.length,
      read: readByUserIds.length,
      unread: projectMemberIds.length - readByUserIds.length,
      readByUsers: readByUserIds,
    };
  }

  async togglePin(
    announcementId: string
  ): Promise<Announcement> {
    const announcement = await this.announcementModel.findById(announcementId);
    
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    announcement.pinned = !announcement.pinned;
    return announcement.save();
  }

  async delete(announcementId: string): Promise<void> {
    await this.announcementModel.findByIdAndDelete(announcementId);
  }
}
