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

// ✅ NEW: Comment input type
export type AddCommentInput = {
  announcementId: string;
  authorId: string;
  text: string;
  attachments?: string[];
};

// ─── Shared author populate fields ─────────────────────────────────────────
const AUTHOR_POPULATE = {
  path: 'authorId',
  select: 'firstName lastName username avatar profilePicture',
};
const COMMENT_AUTHOR_POPULATE = {
  path: 'comments.authorId',
  select: 'firstName lastName username avatar profilePicture',
};
const LIKES_POPULATE = {
  path: 'likes',
  select: 'firstName lastName username avatar profilePicture',
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

  // ═══════════════════════════════════════════════════════════════════════════
  // GET announcements (with author + comment author + likes populated)
  // ═══════════════════════════════════════════════════════════════════════════

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
      .populate(AUTHOR_POPULATE)
      .populate(COMMENT_AUTHOR_POPULATE)
      .populate(LIKES_POPULATE)
      .exec();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE announcement
  // ═══════════════════════════════════════════════════════════════════════════

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

    // Return populated version
    return this.announcementModel
      .findById(doc._id)
      .populate(AUTHOR_POPULATE)
      .populate(COMMENT_AUTHOR_POPULATE)
      .populate(LIKES_POPULATE)
      .exec();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MARK AS READ
  // ═══════════════════════════════════════════════════════════════════════════

  public async markAsRead(announcementId: string, userId: string) {
    const annId = this.toObjectId(announcementId, 'announcementId');
    const userObjectId = this.toObjectId(userId, 'userId');

    const updated = await this.announcementModel
      .findByIdAndUpdate(
        annId,
        { $addToSet: { readBy: userObjectId } },
        { new: true },
      )
      .populate(AUTHOR_POPULATE)
      .populate(COMMENT_AUTHOR_POPULATE)
      .populate(LIKES_POPULATE)
      .exec();

    if (!updated) throw new NotFoundException('Announcement not found');
    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOGGLE PIN
  // ═══════════════════════════════════════════════════════════════════════════

  public async togglePin(announcementId: string) {
    const annId = this.toObjectId(announcementId, 'announcementId');

    const existing = await this.announcementModel.findById(annId).exec();
    if (!existing) throw new NotFoundException('Announcement not found');

    existing.pinned = !existing.pinned;
    await existing.save();

    return this.announcementModel
      .findById(annId)
      .populate(AUTHOR_POPULATE)
      .populate(COMMENT_AUTHOR_POPULATE)
      .populate(LIKES_POPULATE)
      .exec();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE
  // ═══════════════════════════════════════════════════════════════════════════

  public async delete(announcementId: string) {
    const annId = this.toObjectId(announcementId, 'announcementId');

    const deleted = await this.announcementModel.findByIdAndDelete(annId).exec();
    if (!deleted) throw new NotFoundException('Announcement not found');

    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READ STATUS
  // ═══════════════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ NEW: TOGGLE LIKE
  // ═══════════════════════════════════════════════════════════════════════════

  public async toggleLike(announcementId: string, userId: string) {
    const annId = this.toObjectId(announcementId, 'announcementId');
    const userObjectId = this.toObjectId(userId, 'userId');

    const ann = await this.announcementModel.findById(annId).exec();
    if (!ann) throw new NotFoundException('Announcement not found');

    const likesStrings = (ann.likes || []).map((x) => String(x));
    const alreadyLiked = likesStrings.includes(String(userObjectId));

    if (alreadyLiked) {
      await this.announcementModel.findByIdAndUpdate(annId, {
        $pull: { likes: userObjectId },
      }).exec();
    } else {
      await this.announcementModel.findByIdAndUpdate(annId, {
        $addToSet: { likes: userObjectId },
      }).exec();
    }

    return this.announcementModel
      .findById(annId)
      .populate(AUTHOR_POPULATE)
      .populate(COMMENT_AUTHOR_POPULATE)
      .populate(LIKES_POPULATE)
      .exec();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ NEW: ADD COMMENT
  // ═══════════════════════════════════════════════════════════════════════════

  public async addComment(input: AddCommentInput) {
    const annId = this.toObjectId(input.announcementId, 'announcementId');
    const authorObjectId = this.toObjectId(input.authorId, 'authorId');

    const ann = await this.announcementModel.findById(annId).exec();
    if (!ann) throw new NotFoundException('Announcement not found');

    const comment = {
      _id: new Types.ObjectId(),
      authorId: authorObjectId,
      text: input.text,
      attachments: input.attachments || [],
      createdAt: new Date(),
    };

    ann.comments.push(comment as any);
    await ann.save();

    return this.announcementModel
      .findById(annId)
      .populate(AUTHOR_POPULATE)
      .populate(COMMENT_AUTHOR_POPULATE)
      .populate(LIKES_POPULATE)
      .exec();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ NEW: DELETE COMMENT
  // ═══════════════════════════════════════════════════════════════════════════

  public async deleteComment(announcementId: string, commentId: string) {
    const annId = this.toObjectId(announcementId, 'announcementId');

    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Invalid commentId');
    }

    const ann = await this.announcementModel.findById(annId).exec();
    if (!ann) throw new NotFoundException('Announcement not found');

    const commentObjId = new Types.ObjectId(commentId);
    ann.comments = ann.comments.filter(
      (c: any) => String(c._id) !== String(commentObjId),
    );
    await ann.save();

    return this.announcementModel
      .findById(annId)
      .populate(AUTHOR_POPULATE)
      .populate(COMMENT_AUTHOR_POPULATE)
      .populate(LIKES_POPULATE)
      .exec();
  }
}
