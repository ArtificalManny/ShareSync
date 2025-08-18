// src/activities/activity.query.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

type AnyObj = Record<string, any>;

@Injectable()
export class ActivityQueryService {
  constructor(
    @InjectModel('Activity') private readonly activityModel: Model<AnyObj>,
  ) {}

  async getUserActivity(opts: {
    userId: string;
    projectId?: string;
    limit?: number;
    cursor?: string | null;
  }) {
    const { userId, projectId, limit = 20, cursor } = opts;

    const q: FilterQuery<AnyObj> = {
      userId: new Types.ObjectId(userId),
    };

    if (projectId && Types.ObjectId.isValid(projectId)) {
      q.projectId = new Types.ObjectId(projectId);
    }

    if (cursor && Types.ObjectId.isValid(cursor)) {
      q._id = { $lt: new Types.ObjectId(cursor) };
    }

    const items = await this.activityModel
      .find(q)
      .sort({ _id: -1 })
      .limit(Math.max(1, Math.min(100, limit)))
      .lean();

    const nextCursor = items.length > 0 ? String(items[items.length - 1]._id) : null;

    return { items, nextCursor };
  }

  async getProjectActivity(opts: {
    projectId: string;
    limit?: number;
    cursor?: string | null;
  }) {
    const { projectId, limit = 20, cursor } = opts;

    const q: FilterQuery<AnyObj> = {
      projectId: new Types.ObjectId(projectId),
    };

    if (cursor && Types.ObjectId.isValid(cursor)) {
      q._id = { $lt: new Types.ObjectId(cursor) };
    }

    const items = await this.activityModel
      .find(q)
      .sort({ _id: -1 })
      .limit(Math.max(1, Math.min(100, limit)))
      .lean();

    const nextCursor = items.length > 0 ? String(items[items.length - 1]._id) : null;

    return { items, nextCursor };
  }
}
