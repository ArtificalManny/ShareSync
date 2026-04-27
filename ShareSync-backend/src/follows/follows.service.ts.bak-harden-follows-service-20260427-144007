// src/follows/follows.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FOLLOWS SERVICE - Instagram-style project following
// Handles follow/unfollow, status checks, and project retrieval
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class FollowsService {
  private readonly logger = new Logger(FollowsService.name);

  constructor(
    @InjectModel('Follow') private readonly FollowModel: Model<any>,
    @InjectModel('Project') private readonly ProjectModel: Model<any>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // FOLLOW a project (upsert to avoid duplicate-key errors)
  // ─────────────────────────────────────────────────────────────────────────────
  async follow(userId: string, projectId: string) {
    try {
      await this.FollowModel.findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          projectId: new Types.ObjectId(projectId),
        },
        {
          userId: new Types.ObjectId(userId),
          projectId: new Types.ObjectId(projectId),
        },
        { upsert: true, new: true },
      );

      const followersCount = await this.getFollowersCount(projectId);
      this.logger.log(`User ${userId} followed project ${projectId} (${followersCount} followers)`);

      return { success: true, following: true, followersCount };
    } catch (err) {
      this.logger.error(`Follow failed: ${err.message}`);
      return { success: false, following: false, error: err.message };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UNFOLLOW a project
  // ─────────────────────────────────────────────────────────────────────────────
  async unfollow(userId: string, projectId: string) {
    try {
      await this.FollowModel.deleteOne({
        userId: new Types.ObjectId(userId),
        projectId: new Types.ObjectId(projectId),
      });

      const followersCount = await this.getFollowersCount(projectId);
      this.logger.log(`User ${userId} unfollowed project ${projectId} (${followersCount} followers)`);

      return { success: true, following: false, followersCount };
    } catch (err) {
      this.logger.error(`Unfollow failed: ${err.message}`);
      return { success: false, following: true, error: err.message };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHECK if a single user follows a single project
  // ─────────────────────────────────────────────────────────────────────────────
  async isFollowing(userId: string, projectId: string): Promise<boolean> {
    const doc = await this.FollowModel.findOne({
      userId: new Types.ObjectId(userId),
      projectId: new Types.ObjectId(projectId),
    }).lean();
    return !!doc;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BULK STATUS CHECK - returns { [projectId]: true/false }
  // Used by Discover feed to show correct button state for all visible cards
  // ─────────────────────────────────────────────────────────────────────────────
  async getFollowStatusBulk(
    userId: string,
    projectIds: string[],
  ): Promise<Record<string, boolean>> {
    if (!projectIds.length) return {};

    const docs = await this.FollowModel.find({
      userId: new Types.ObjectId(userId),
      projectId: {
        $in: projectIds.map((id) => new Types.ObjectId(id)),
      },
    })
      .select('projectId')
      .lean();

    const followedSet = new Set(docs.map((d) => String(d.projectId)));
    const result: Record<string, boolean> = {};
    projectIds.forEach((id) => {
      result[id] = followedSet.has(id);
    });
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET ALL FOLLOWED PROJECT IDs for a user (lightweight, just IDs)
  // ─────────────────────────────────────────────────────────────────────────────
  async getFollowedProjectIds(userId: string): Promise<string[]> {
    const docs = await this.FollowModel.find({
      userId: new Types.ObjectId(userId),
    })
      .select('projectId')
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((d) => String(d.projectId));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET ALL FOLLOWED PROJECTS with full project data (for Projects page)
  // ─────────────────────────────────────────────────────────────────────────────
  async getFollowedProjects(userId: string) {
    const follows = await this.FollowModel.find({
      userId: new Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .lean();

    const projectIds = follows.map((f) => f.projectId);
    if (projectIds.length === 0) return [];

    const projects = await this.ProjectModel.find({
      _id: { $in: projectIds },
    })
      .populate('ownerId', 'firstName lastName username avatarUrl')
      .populate('owner', 'firstName lastName username avatarUrl')
      .lean();

    // Preserve the follow-order (most recently followed first)
    const projectMap = new Map(
      projects.map((p: any) => [String(p._id), p]),
    );
    const ordered = projectIds
      .map((id) => projectMap.get(String(id)))
      .filter(Boolean);

    return ordered;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET FOLLOWERS COUNT for a project
  // ─────────────────────────────────────────────────────────────────────────────
  async getFollowersCount(projectId: string): Promise<number> {
    return this.FollowModel.countDocuments({
      projectId: new Types.ObjectId(projectId),
    });
  }
}
