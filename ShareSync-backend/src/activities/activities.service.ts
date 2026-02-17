// src/activities/activities.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Activity } from './schemas/activity.schema';

type AnyObj = Record<string, any>;

function toObjectId(v?: string | null) {
  if (!v) return undefined;
  return Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : undefined;
}

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<AnyObj>,
  ) {}

  async record(data: {
    userId: string;
    projectId?: string;
    type: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    details?: AnyObj;
    metadata?: AnyObj;
    payload?: AnyObj;
  }) {
    try {
      const userObjectId = toObjectId(data.userId);
      if (!userObjectId) {
        throw new Error(`ActivitiesService.record: invalid userId "${data.userId}"`);
      }

      const projectObjectId = toObjectId(data.projectId ?? null);
      const entityObjectId = toObjectId(data.entityId ?? null);

      // IMPORTANT:
      // Do NOT write nulls for fields with enum/default validators.
      // Omit the property entirely so Mongoose can apply defaults cleanly.
      const doc: AnyObj = {
        userId: userObjectId,
        type: data.type,
        entityType: data.entityType ?? null,

        details: data.details || {},
        metadata: data.metadata || {},
        payload: data.payload || {},
      };

      if (projectObjectId) doc.projectId = projectObjectId;
      if (entityObjectId) doc.entityId = entityObjectId;
      if (data.entityId) doc.entityKey = data.entityId; // extra debug string
      if (data.action) doc.action = data.action; // otherwise schema default applies

      const saved = await new this.activityModel(doc).save();
      return saved;
    } catch (err: any) {
      this.logger.error(
        `Failed to record activity (type=${data?.type})`,
        err?.stack || String(err),
      );
      throw err;
    }
  }

  async list(args: {
    scope: 'user' | 'project' | 'global';
    userId?: string;
    projectId?: string;
    range?: string;
    limit?: number;
    cursor?: string | null;
    type?: string | null;
    entityId?: string | null;
  }) {
    const limit = Math.max(1, Math.min(1000, Number(args.limit ?? 50)));
    const q: AnyObj = {};

    if (args.scope === 'user' && args.userId && Types.ObjectId.isValid(args.userId)) {
      q.userId = new Types.ObjectId(args.userId);
    }

    if (args.scope === 'project' && args.projectId && Types.ObjectId.isValid(args.projectId)) {
      q.projectId = new Types.ObjectId(args.projectId);
    }

    if (args.type) q.type = args.type;

    if (args.entityId) {
      const oid = toObjectId(args.entityId);
      if (oid) q.entityId = oid;
      else q.entityKey = args.entityId;
    }

    if (args.cursor) {
      const dt = new Date(args.cursor);
      if (!Number.isNaN(dt.getTime())) {
        q.createdAt = { $lt: dt };
      }
    }

    if (args.range && args.range !== 'all') {
      const m = String(args.range).match(/^(\d+)(d|h)$/i);
      if (m) {
        const n = Number(m[1]);
        const unit = m[2].toLowerCase();
        const since = new Date();
        since.setTime(
          since.getTime() - (unit === 'h' ? n * 3600_000 : n * 24 * 3600_000),
        );
        q.createdAt = { ...(q.createdAt || {}), $gte: since };
      }
    }

    const items = await this.activityModel
      .find(q)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();

    const nextCursor =
      items && items.length
        ? new Date(items[items.length - 1].createdAt).toISOString()
        : null;

    return { items: items || [], nextCursor };
  }

  async listProject(args: {
    projectId: string;
    userId: string;
    limit?: number;
    cursor?: string | null;
    type?: string | null;
    entityId?: string | null;
  }) {
    return this.list({
      scope: 'project',
      projectId: args.projectId,
      userId: args.userId,
      limit: args.limit ?? 20,
      cursor: args.cursor ?? null,
      type: args.type ?? null,
      entityId: args.entityId ?? null,
      range: 'all',
    });
  }

  async listProjectActivityTimeline(args: any) {
    return this.listProject(args);
  }

  async logActivity(args: any) {
    return this.record(args);
  }

  async createFromTaskEvent(event: any) {
    return this.record({
      userId: String(event?.userId || event?.actorId || event?.by || event?.sub || ''),
      projectId: event?.projectId ? String(event.projectId) : undefined,
      type: String(event?.type || 'task.mutation'),
      entityType: 'TASK',
      entityId: event?.taskId ? String(event.taskId) : undefined,
      action: event?.action ? String(event.action) : undefined, // omit if absent
      details: event?.details || {},
      metadata: event?.metadata || {},
      payload: event || {},
    });
  }
}
