#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/follows/follows.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[harden_follows_service] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


NEW_CONTENT = """// src/follows/follows.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FOLLOWS SERVICE - Instagram-style project following
// Handles follow/unfollow, status checks, and project retrieval.
//
// Product rule:
// - A follow is a spectator/subscriber relationship.
// - It does NOT add the user as a project member.
// - Users may follow public projects.
// - Owners/members do not need a separate follow relationship.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class FollowsService {
  private readonly logger = new Logger(FollowsService.name);

  constructor(
    @InjectModel('Follow') private readonly FollowModel: Model<any>,
    @InjectModel('Project') private readonly ProjectModel: Model<any>,
  ) {}

  private toObjectId(value: string, label: string): Types.ObjectId {
    const id = String(value || '').trim();

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label}`);
    }

    return new Types.ObjectId(id);
  }

  private isProjectPublic(project: any): boolean {
    const visibility = String(project?.visibility || '').trim().toLowerCase();
    const settings = project?.settings || {};

    return (
      visibility === 'public' ||
      visibility === 'listed' ||
      project?.isPublic === true ||
      project?.public === true ||
      settings?.isPublic === true
    );
  }

  private isProjectArchived(project: any): boolean {
    const status = String(project?.status || '').trim().toLowerCase();

    return (
      project?.isArchived === true ||
      status === 'archived' ||
      status === 'deleted'
    );
  }

  private isOwnerOrMember(project: any, userId: string): boolean {
    const normalizedUserId = String(userId || '').trim();

    const ownerId =
      project?.ownerId?._id ||
      project?.ownerId ||
      project?.owner?._id ||
      project?.owner ||
      project?.createdBy?._id ||
      project?.createdBy;

    if (ownerId && String(ownerId) === normalizedUserId) {
      return true;
    }

    const members = Array.isArray(project?.members) ? project.members : [];

    return members.some((member: any) => {
      const memberId =
        member?.userId?._id ||
        member?.userId ||
        member?.user?._id ||
        member?.user ||
        member?._id ||
        member?.id;

      return memberId && String(memberId) === normalizedUserId;
    });
  }

  private async findFollowableProject(projectId: string, userId: string) {
    const projectObjectId = this.toObjectId(projectId, 'projectId');
    this.toObjectId(userId, 'userId');

    const project = await this.ProjectModel.findById(projectObjectId)
      .select(
        'name title visibility isPublic public settings status isArchived owner ownerId createdBy members followersCount',
      )
      .lean();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (this.isProjectArchived(project)) {
      throw new ForbiddenException('Archived projects cannot be followed');
    }

    if (!this.isProjectPublic(project)) {
      throw new ForbiddenException('Only public projects can be followed');
    }

    if (this.isOwnerOrMember(project, userId)) {
      throw new ForbiddenException('Project members do not need to follow their own project');
    }

    return project;
  }

  private async syncProjectFollowersCount(projectId: string): Promise<number> {
    const projectObjectId = this.toObjectId(projectId, 'projectId');
    const followersCount = await this.FollowModel.countDocuments({
      projectId: projectObjectId,
    });

    await this.ProjectModel.updateOne(
      { _id: projectObjectId },
      { $set: { followersCount } },
    );

    return followersCount;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FOLLOW a project
  // ─────────────────────────────────────────────────────────────────────────────
  async follow(userId: string, projectId: string) {
    const userObjectId = this.toObjectId(userId, 'userId');
    const projectObjectId = this.toObjectId(projectId, 'projectId');

    await this.findFollowableProject(projectId, userId);

    await this.FollowModel.findOneAndUpdate(
      {
        userId: userObjectId,
        projectId: projectObjectId,
      },
      {
        $setOnInsert: {
          userId: userObjectId,
          projectId: projectObjectId,
          createdAt: new Date(),
        },
        $set: {
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    const followersCount = await this.syncProjectFollowersCount(projectId);

    this.logger.log(
      `User ${userId} followed project ${projectId} (${followersCount} followers)`,
    );

    return {
      success: true,
      following: true,
      followersCount,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UNFOLLOW a project
  // ─────────────────────────────────────────────────────────────────────────────
  async unfollow(userId: string, projectId: string) {
    const userObjectId = this.toObjectId(userId, 'userId');
    const projectObjectId = this.toObjectId(projectId, 'projectId');

    await this.FollowModel.deleteOne({
      userId: userObjectId,
      projectId: projectObjectId,
    });

    const followersCount = await this.syncProjectFollowersCount(projectId);

    this.logger.log(
      `User ${userId} unfollowed project ${projectId} (${followersCount} followers)`,
    );

    return {
      success: true,
      following: false,
      followersCount,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHECK if a single user follows a single project
  // ─────────────────────────────────────────────────────────────────────────────
  async isFollowing(userId: string, projectId: string): Promise<boolean> {
    const userObjectId = this.toObjectId(userId, 'userId');
    const projectObjectId = this.toObjectId(projectId, 'projectId');

    const doc = await this.FollowModel.findOne({
      userId: userObjectId,
      projectId: projectObjectId,
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
    const userObjectId = this.toObjectId(userId, 'userId');

    const cleanIds = Array.from(
      new Set(
        (Array.isArray(projectIds) ? projectIds : [])
          .map((id) => String(id || '').trim())
          .filter((id) => Types.ObjectId.isValid(id)),
      ),
    );

    const result: Record<string, boolean> = {};
    cleanIds.forEach((id) => {
      result[id] = false;
    });

    if (cleanIds.length === 0) return result;

    const docs = await this.FollowModel.find({
      userId: userObjectId,
      projectId: {
        $in: cleanIds.map((id) => new Types.ObjectId(id)),
      },
    })
      .select('projectId')
      .lean();

    const followedSet = new Set(docs.map((d) => String(d.projectId)));

    cleanIds.forEach((id) => {
      result[id] = followedSet.has(id);
    });

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET ALL FOLLOWED PROJECT IDs for a user
  // ─────────────────────────────────────────────────────────────────────────────
  async getFollowedProjectIds(userId: string): Promise<string[]> {
    const userObjectId = this.toObjectId(userId, 'userId');

    const docs = await this.FollowModel.find({
      userId: userObjectId,
    })
      .select('projectId')
      .sort({ createdAt: -1 })
      .lean();

    return docs.map((d) => String(d.projectId));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET ALL FOLLOWED PROJECTS with full project data
  // ─────────────────────────────────────────────────────────────────────────────
  async getFollowedProjects(userId: string) {
    const userObjectId = this.toObjectId(userId, 'userId');

    const follows = await this.FollowModel.find({
      userId: userObjectId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const projectIds = follows.map((f) => f.projectId);
    if (projectIds.length === 0) return [];

    const projects = await this.ProjectModel.find({
      _id: { $in: projectIds },
      $or: [
        { visibility: 'public' },
        { visibility: 'listed' },
        { isPublic: true },
        { public: true },
        { 'settings.isPublic': true },
      ],
      status: { $ne: 'archived' },
      isArchived: { $ne: true },
    })
      .populate('ownerId', 'firstName lastName username avatarUrl')
      .populate('owner', 'firstName lastName username avatarUrl')
      .lean();

    // Preserve follow-order, most recently followed first.
    const projectMap = new Map(
      projects.map((p: any) => [String(p._id), p]),
    );

    return projectIds
      .map((id) => projectMap.get(String(id)))
      .filter(Boolean);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET FOLLOWERS COUNT for a project
  // ─────────────────────────────────────────────────────────────────────────────
  async getFollowersCount(projectId: string): Promise<number> {
    const projectObjectId = this.toObjectId(projectId, 'projectId');

    return this.FollowModel.countDocuments({
      projectId: projectObjectId,
    });
  }
}
"""


def main():
    print("[harden_follows_service] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    original = TARGET.read_text(encoding="utf-8")

    required_markers = [
        "export class FollowsService",
        "async follow(userId: string, projectId: string)",
        "async unfollow(userId: string, projectId: string)",
        "async isFollowing(userId: string, projectId: string): Promise<boolean>",
        "async getFollowStatusBulk(",
        "async getFollowedProjectIds(userId: string): Promise<string[]>",
        "async getFollowedProjects(userId: string)",
        "async getFollowersCount(projectId: string): Promise<number>",
        "@InjectModel('Follow')",
        "@InjectModel('Project')",
    ]

    for marker in required_markers:
        if marker not in original:
            fail(f"Missing expected marker before rewrite: {marker}")

    required_after = [
        "BadRequestException",
        "ForbiddenException",
        "NotFoundException",
        "private toObjectId(value: string, label: string): Types.ObjectId",
        "private isProjectPublic(project: any): boolean",
        "private isOwnerOrMember(project: any, userId: string): boolean",
        "private async findFollowableProject(projectId: string, userId: string)",
        "private async syncProjectFollowersCount(projectId: string): Promise<number>",
        "Project members do not need to follow their own project",
        "Only public projects can be followed",
        "$set: { followersCount }",
        "success: true",
        "following: true",
        "following: false",
    ]

    for marker in required_after:
        if marker not in NEW_CONTENT:
            fail(f"Internal safety check failed. Missing marker in new content: {marker}")

    if original == NEW_CONTENT:
        print("[harden_follows_service] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-harden-follows-service-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[harden_follows_service] backup created: {backup}")

    TARGET.write_text(NEW_CONTENT, encoding="utf-8")
    print(f"[harden_follows_service] patched: {TARGET}")

    print("")
    print("[harden_follows_service] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"BadRequestException|ForbiddenException|NotFoundException|toObjectId|isProjectPublic|isOwnerOrMember|findFollowableProject|syncProjectFollowersCount|follow\\(|unfollow\\(|getFollowStatusBulk|getFollowedProjects|getFollowersCount\" src/follows/follows.service.ts -C 8")
    print("  git diff -- src/follows/follows.service.ts")


if __name__ == "__main__":
    main()
