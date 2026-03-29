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

  // ═══════════════════════════════════════════════════════════════════════════════
  // POPULATE HELPER: Ensures Profile Pictures and Names always map to the frontend
  // ═══════════════════════════════════════════════════════════════════════════════
  private get populatedFields() {
    return [
      { path: 'authorId', select: 'firstName lastName username profilePicture avatar avatarUrl' },
      { path: 'comments.authorId', select: 'firstName lastName username profilePicture avatar avatarUrl' },
    ];
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
      .populate(this.populatedFields)
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
      likes: [],
      comments: [],
    });

    // Return populated doc so the frontend renders the avatar instantly on post
    return doc.populate(this.populatedFields);
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
      .populate(this.populatedFields)
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
    return existing.populate(this.populatedFields);
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // NEW: Likes and Comments Logic
  // ═══════════════════════════════════════════════════════════════════════════════

  public async toggleLike(announcementId: string, userId: string) {
    const annId = this.toObjectId(announcementId, 'announcementId');
    const userObjId = this.toObjectId(userId, 'userId');

    const announcement = await this.announcementModel.findById(annId).exec();
    if (!announcement) throw new NotFoundException('Announcement not found');

    const hasLiked = announcement.likes.some((id) => id.toString() === userObjId.toString());

    const updateQuery = hasLiked
      ? { $pull: { likes: userObjId } }
      : { $addToSet: { likes: userObjId } };

    const updated = await this.announcementModel
      .findByIdAndUpdate(annId, updateQuery, { new: true })
      .populate(this.populatedFields)
      .exec();

    return updated;
  }

  public async addComment(announcementId: string, userId: string, text: string, attachments: string[] = []) {
    const annId = this.toObjectId(announcementId, 'announcementId');
    const userObjId = this.toObjectId(userId, 'userId');

    if (!text || !text.trim()) throw new BadRequestException('Comment text is required');

    const comment = {
      _id: new Types.ObjectId(),
      text: text.trim(),
      authorId: userObjId,
      attachments,
      createdAt: new Date(),
    };

    const updated = await this.announcementModel
      .findByIdAndUpdate(
        annId,
        { $push: { comments: comment } },
        { new: true }
      )
      .populate(this.populatedFields)
      .exec();

    if (!updated) throw new NotFoundException('Announcement not found');
    return updated;
  }

  public async deleteComment(announcementId: string, commentId: string, userId: string) {
    const annId = this.toObjectId(announcementId, 'announcementId');
    const commId = this.toObjectId(commentId, 'commentId');
    // Note: In a robust app, we should check if the user is the author of the comment before deleting.
    // For now, we simply remove it based on commentId.

    const updated = await this.announcementModel
      .findByIdAndUpdate(
        annId,
        { $pull: { comments: { _id: commId } } },
        { new: true }
      )
      .populate(this.populatedFields)
      .exec();

    if (!updated) throw new NotFoundException('Announcement not found');
    return updated;
  }
}
