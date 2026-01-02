import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
  ) {}

  // ⭐ UPDATED: record() method (supports both 'type' and 'action')
  async record(data: {
    projectId?: string;
    userId: string;
    type?: string;      // for user.controller compatibility
    action?: string;    // for activity feed compatibility
    payload?: any;      // for user.controller compatibility
    details?: Record<string, any>;
    metadata?: any;
  }): Promise<Activity> {
    // Support both 'type' and 'action' fields
    const actionValue = data.action || data.type || 'unknown';
    const detailsValue = data.details || data.payload || {};
    
    return this.logActivity({
      projectId: data.projectId,
      userId: data.userId,
      action: actionValue,
      details: detailsValue,
      metadata: data.metadata,
    });
  }

  // ⭐ UPDATED: list() method (returns { items } and supports scope/range/cursor)
  async list(options: {
    userId?: string;
    projectId?: string;
    scope?: string;     // 'user' or 'project'
    range?: string;     // '7d', '30d', etc.
    cursor?: string | null;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ items: Activity[]; nextCursor?: string | null }> {
    const query: any = {};
    
    // Handle scope
    if (options.scope === 'user' && options.userId) {
      query.userId = new Types.ObjectId(options.userId);
    } else if (options.scope === 'project' && options.projectId) {
      query.projectId = new Types.ObjectId(options.projectId);
    } else {
      // Fallback: use userId or projectId directly
      if (options.userId) {
        query.userId = new Types.ObjectId(options.userId);
      }
      if (options.projectId) {
        query.projectId = new Types.ObjectId(options.projectId);
      }
    }

    // Handle range (e.g., '7d', '30d')
    if (options.range) {
      const days = parseInt(options.range.replace('d', ''), 10);
      if (!isNaN(days)) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        query.createdAt = { $gte: since };
      }
    }

    // Handle cursor pagination
    if (options.cursor) {
      query._id = { $lt: new Types.ObjectId(options.cursor) };
    }

    const limit = Math.min(options.limit || 50, 500);

    const items = await this.activityModel
      .find(query)
      .populate('userId', 'name email avatar firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(options.offset || 0)
      .exec();

    // Generate next cursor if there are more results
    const nextCursor = items.length === limit ? String(items[items.length - 1]._id) : null;

    return { items, nextCursor };
  }

  async logActivity(data: {
    projectId?: string;
    userId: string;
    action: string;
    details?: Record<string, any>;
    metadata?: {
      taskTitle?: string;
      fileName?: string;
      fileSize?: number;
      recipientName?: string;
      amount?: number;
      messagePreview?: string;
    };
  }): Promise<Activity> {
    const activityData: any = {
      userId: new Types.ObjectId(data.userId),
      action: data.action,
      details: data.details || {},
      metadata: data.metadata || {}
    };

    // projectId is optional
    if (data.projectId) {
      activityData.projectId = new Types.ObjectId(data.projectId);
    }

    const activity = new this.activityModel(activityData);
    await activity.save();
    return activity.populate('userId', 'name email avatar firstName lastName');
  }

  async getProjectActivities(
    projectId: string,
    options: {
      limit?: number;
      offset?: number;
      type?: string;
    } = {}
  ): Promise<{ activities: Activity[]; total: number; hasMore: boolean }> {
    const limit = Math.min(options.limit || 50, 200);
    const offset = options.offset || 0;

    const query: any = { projectId: new Types.ObjectId(projectId) };
    
    if (options.type && options.type !== 'all') {
      query.action = { $regex: options.type, $options: 'i' };
    }

    const [activities, total] = await Promise.all([
      this.activityModel
        .find(query)
        .populate('userId', 'name email avatar firstName lastName')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .exec(),
      this.activityModel.countDocuments(query)
    ]);

    return {
      activities,
      total,
      hasMore: offset + activities.length < total
    };
  }
}
