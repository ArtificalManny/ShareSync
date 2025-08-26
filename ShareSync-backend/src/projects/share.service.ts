import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model } from 'mongoose';

type AnyObj = Record<string, any>;

@Injectable()
export class ProjectShareService {
  constructor(
    @InjectModel('ProjectShare') private readonly shareModel: Model<AnyObj>,
    @InjectModel('Project') private readonly projectModel: Model<AnyObj>,
  ) {}

  private makeToken() {
    return randomBytes(16).toString('hex'); // 32 chars
  }

  async createShare(projectId: string, userId: string) {
    // optionally: check ownership/permissions here
    const token = this.makeToken();
    const doc = await this.shareModel.create({ projectId, token, createdBy: userId });
    return { token: doc.token };
  }

  async resolve(token: string) {
    const share = await this.shareModel.findOne({ token }).lean();
    if (!share) return null;

    const project = await this.projectModel
      .findById(share.projectId, {
        // public-safe projection of a project:
        title: 1,
        description: 1,
        status: 1,
        members: 1,
        updatedAt: 1,
        createdAt: 1,
        // omit private fields if any
      })
      .lean();
    if (!project) return null;

    return {
      token: share.token,
      projectId: share.projectId,
      project,
    };
  }
}
