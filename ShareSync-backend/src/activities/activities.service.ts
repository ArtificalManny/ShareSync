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

  // INSIGHTS ACTIVITY ACTOR RESPONSE BRIDGE
  // The Insights ActivityFeed reads actorName/userName/user/avatarUrl fields.
  // Activity rows are stored with userId, so this bridge serializes populated
  // userId data into frontend-friendly actor fields without changing the DB schema.
  private activityFeedExtractId(value: any): string {
    if (!value) return '';

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (value?._id) return String(value._id);
    if (value?.id) return String(value.id);

    if (value?.userId) {
      const nested = value.userId;

      if (typeof nested === 'string' || typeof nested === 'number') {
        return String(nested);
      }

      if (nested?._id) return String(nested._id);
      if (nested?.id) return String(nested.id);
    }

    if (typeof value?.toString === 'function') {
      const str = value.toString();
      if (str && str !== '[object Object]') return String(str);
    }

    return '';
  }

  private activityFeedPickString(...values: any[]): string {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  private activityFeedImageValue(value: any): string {
    if (!value) return '';

    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'object') {
      return this.activityFeedPickString(
        value.url,
        value.secure_url,
        value.src,
        value.path,
        value.location,
      );
    }

    return '';
  }

  private activityFeedBuildDisplayName(userLike: any): string {
    if (!userLike || typeof userLike !== 'object') return '';

    const firstLast = [userLike.firstName, userLike.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    const emailName =
      typeof userLike.email === 'string' && userLike.email.includes('@')
        ? userLike.email.split('@')[0]
        : '';

    return this.activityFeedPickString(
      userLike.displayName,
      userLike.name,
      userLike.fullName,
      firstLast,
      userLike.username,
      emailName,
    );
  }

  private activityFeedBuildAvatarUrl(userLike: any): string | null {
    if (!userLike || typeof userLike !== 'object') return null;

    const profile = userLike.profile || {};

    const candidates = [
      userLike.avatarUrl,
      userLike.profilePicture,
      userLike.profileImage,
      userLike.avatar,
      userLike.imageUrl,
      userLike.photoUrl,
      userLike.picture,
      profile.avatarUrl,
      profile.profilePicture,
      profile.profileImage,
      profile.photoUrl,
      profile.picture,
    ];

    for (const candidate of candidates) {
      const value = this.activityFeedImageValue(candidate);
      if (value) return value;
    }

    return null;
  }

  private activityFeedIsGenericActorName(value: any): boolean {
    const name = typeof value === 'string' ? value.trim().toLowerCase() : '';

    if (!name) return true;

    return [
      'project member',
      'team member',
      'someone',
      'unknown',
      'unknown user',
      'user',
    ].includes(name);
  }

  private activityFeedResolveUserLike(item: AnyObj): any {
    const candidates = [
      item?.actor,
      item?.actorUser,
      item?.user,
      item?.author,
      item?.member,
      item?.createdBy,
      item?.updatedBy,
      item?.performedBy,
      item?.payload?.actor,
      item?.payload?.user,
      item?.metadata?.actor,
      item?.metadata?.user,
      item?.details?.actor,
      item?.details?.user,
      item?.userId,
    ];

    return candidates.find((candidate) => candidate && typeof candidate === 'object') || null;
  }

  private activityFeedSerializeActor(userLike: any): AnyObj | null {
    if (!userLike || typeof userLike !== 'object') return null;

    const id = this.activityFeedExtractId(userLike);
    const name = this.activityFeedBuildDisplayName(userLike);
    const avatarUrl = this.activityFeedBuildAvatarUrl(userLike);

    // Avoid turning a raw ObjectId into a fake actor object.
    if (!name && !avatarUrl) return null;

    return {
      id,
      _id: id,
      name,
      displayName: name,
      firstName: userLike.firstName || '',
      lastName: userLike.lastName || '',
      username: userLike.username || '',
      email: userLike.email || '',
      avatar: avatarUrl,
      avatarUrl,
      profilePicture: avatarUrl,
      profileImage: avatarUrl,
    };
  }

  private serializeActivityItemForClient(item: AnyObj): AnyObj {
    const sourceUser = this.activityFeedResolveUserLike(item);
    const actor = this.activityFeedSerializeActor(sourceUser);

    const existingName = [
      item?.actorName,
      item?.userName,
      item?.payload?.actorName,
      item?.metadata?.actorName,
      item?.details?.actorName,
    ].find((value) => !this.activityFeedIsGenericActorName(value));

    const actorName = existingName ? String(existingName).trim() : actor?.name || '';

    const actorAvatar =
      this.activityFeedImageValue(item?.actorAvatar) ||
      this.activityFeedImageValue(item?.avatarUrl) ||
      this.activityFeedImageValue(item?.profilePicture) ||
      this.activityFeedImageValue(item?.profileImage) ||
      actor?.avatarUrl ||
      null;

    const normalizedActor = actor
      ? {
          ...actor,
          name: actorName || actor.name,
          displayName: actorName || actor.displayName || actor.name,
          avatar: actorAvatar || actor.avatar || null,
          avatarUrl: actorAvatar || actor.avatarUrl || null,
          profilePicture: actorAvatar || actor.profilePicture || null,
          profileImage: actorAvatar || actor.profileImage || null,
        }
      : null;

    return {
      ...item,
      actor: normalizedActor || item?.actor || null,
      user: normalizedActor || item?.user || null,
      actorId:
        item?.actorId ||
        (normalizedActor as any)?.id ||
        this.activityFeedExtractId(item?.userId),
      actorName: actorName || null,
      userName: actorName || null,
      displayName: actorName || null,
      actorAvatar: actorAvatar || null,
      avatar: actorAvatar || item?.avatar || null,
      avatarUrl: actorAvatar || item?.avatarUrl || null,
      profilePicture: actorAvatar || item?.profilePicture || null,
      profileImage: actorAvatar || item?.profileImage || null,
    };
  }

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
      if (data.entityId) doc.entityKey = data.entityId;
      if (data.action) doc.action = data.action;

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

  async listUserActivityForRange(args: {
    userId: string;
    since: Date;
    until: Date;
    limit?: number;
  }): Promise<AnyObj[]> {
    if (!Types.ObjectId.isValid(args.userId)) return [];

    const userObjectId = new Types.ObjectId(args.userId);
    const limit = Math.max(1, Math.min(5000, Number(args.limit ?? 2500)));

    return this.activityModel
      .find({
        $or: [
          { userId: userObjectId },
          { actorId: userObjectId },
        ],
        createdAt: {
          $gte: args.since,
          $lt: args.until,
        },
      })
      .select(
        '_id projectId type actorId entityType entityId entityKey message payload userId action details metadata createdAt updatedAt',
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();
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
      .populate(
        'userId',
        'firstName lastName name displayName username email avatar avatarUrl profilePicture profileImage imageUrl photoUrl picture profile',
      )
      .lean()
      .exec();

    const nextCursor =
      items && items.length
        ? new Date(items[items.length - 1].createdAt).toISOString()
        : null;

    const normalizedItems = (items || []).map((item) =>
      this.serializeActivityItemForClient(item),
    );

    return { items: normalizedItems, nextCursor };
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

  async getFeed(userId: string, limit = 50) {
    return this.list({
      scope: 'global',
      userId,
      limit,
      range: 'all',
      cursor: null,
      type: null,
      entityId: null,
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
      action: event?.action ? String(event.action) : undefined,
      details: event?.details || {},
      metadata: event?.metadata || {},
      payload: event || {},
    });
  }
}
