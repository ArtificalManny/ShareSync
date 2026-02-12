// src/follows/project-follow.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT FOLLOW SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ProjectFollow,
  ProjectFollowDocument,
  FollowFrequency,
} from './schemas/project-follow.schema';
import { FollowProjectDto } from './dto/follow-project.dto';

@Injectable()
export class ProjectFollowService {
  constructor(
    @InjectModel(ProjectFollow.name)
    private readonly followModel: Model<ProjectFollowDocument>,
  ) {}

  async followProject(
    projectId: string,
    userId: string,
    dto: FollowProjectDto,
  ) {
    const follow = await this.followModel.findOneAndUpdate(
      {
        projectId: new Types.ObjectId(projectId),
        userId: new Types.ObjectId(userId),
      },
      {
        $set: {
          channelPrefs: {
            inApp: dto.inApp ?? true,
            email: dto.email ?? false,
            sms: dto.sms ?? false,
          },
          frequency: dto.frequency ?? FollowFrequency.INSTANT,
        },
      },
      { upsert: true, new: true },
    );

    return follow;
  }

  async unfollowProject(projectId: string, userId: string) {
    await this.followModel.deleteOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(userId),
    });

    return { success: true };
  }

  async getFollowStatus(projectId: string, userId: string) {
    const follow = await this.followModel.findOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(userId),
    });

    return {
      isFollowing: !!follow,
      preferences: follow?.channelPrefs ?? null,
      frequency: follow?.frequency ?? null,
    };
  }

  async getUserFollows(userId: string) {
    return this.followModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('projectId')
      .lean();
  }
}
