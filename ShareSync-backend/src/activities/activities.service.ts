// backend/src/activities/activities.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { RealtimeGateway } from '../realtime/realtime.gateway';

type AnyObj = Record<string, any>;

export interface ListParams {
  scope: 'user' | 'project';
  userId?: string;
  projectId?: string;
  type?: string;
  range?: '24h' | '7d' | '30d' | 'all';
  cursor?: string | null;
  limit?: number;
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel('Activity') private readonly activityModel: Model<AnyObj>,
    @Inject('REALTIME_GATEWAY') private readonly rt: RealtimeGateway,   // ← FIXED
  ) {}

  /**
   * Persist an activity row.
   */
  async record(event: {
    userId?: string;
    projectId?: string;
    type: string;
    payload?: AnyObj;
  }) {
    const now = new Date();
    const doc = await this.activityModel.create({
      userId: event.userId ?? null,
      projectId: event.projectId ?? null,
      type: event.type,
      text: event.payload?.text ?? '',
      meta: event.payload ?? {},
      createdAt: now,
      updatedAt: now,
    });

    const plain = doc.toObject ? doc.toObject() : doc;

    try {
      const pid = event.projectId ? String(event.projectId) : '';
      const uid = event.userId ? String(event.userId) : '';
      if (pid) {
        this.rt.emitToProject(pid, 'activity:new', {
          _id: plain._id.toString(),
          type: plain.type,
          text: plain.text,
          meta: plain.meta,
          userId: plain.userId,
          projectId: plain.projectId,
          createdAt: plain.createdAt,
        });
      }
      if (uid) {
        this.rt.emitToUser(uid, 'habits:updated', { projectId: pid, kind: 'activity' });
      }
    } catch {}

    return plain;
  }

  async create(
    projectId: string,
    userId: string,
    dto: { type?: string; text?: string; meta?: AnyObj },
  ): Promise<AnyObj> {
    return this.record({
      projectId,
      userId,
      type: dto?.type ?? 'update',
      payload: {
        text: dto?.text ?? '',
        ...(dto?.meta ?? {}),
      },
    });
  }

  async list(params: ListParams): Promise<{ items: AnyObj[]; nextCursor: string | null }> {
    const {
      scope,
      userId,
      projectId,
      type,
      range = '7d',
      cursor,
      limit = 20,
    } = params;

    const q: FilterQuery<AnyObj> = {};
    if (scope === 'user' && userId) q.userId = userId;
    if (scope === 'project' && projectId) q.projectId = projectId;

    if (type) {
      const types = String(type).split(',').map(s => s.trim()).filter(Boolean);
      if (types.length === 1) q.type = types[0];
      else if (types.length > 1) q.type = { $in: types };
    }

    if (range !== 'all') {
      const now = Date.now();
      let sinceMs = 0;
      if (range === '24h') sinceMs = 24 * 60 * 60 * 1000;
      else if (range === '7d') sinceMs = 7 * 24 * 60 * 60 * 1000;
      else if (range === '30d') sinceMs = 30 * 24 * 60 * 60 * 1000;
      q.createdAt = { ...(q.createdAt || {}), $gte: new Date(now - sinceMs) };
    }

    if (cursor) {
      q.createdAt = { ...(q.createdAt || {}), $lt: new Date(cursor) };
    }

    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const rows = await this.activityModel
      .find(q)
      .sort({ createdAt: -1 })
      .limit(pageSize + 1)
      .lean()
      .exec();

    let nextCursor: string | null = null;
    let items = rows;

    if (rows.length > pageSize) {
      const last = rows[pageSize - 1];
      nextCursor = last?.createdAt ? new Date(last.createdAt).toISOString() : null;
      items = rows.slice(0, pageSize);
    }

    return { items, nextCursor };
  }

  toCsv(items: AnyObj[]): string {
    const header = ['createdAt', 'type', 'userId', 'projectId', 'message'];
    const rows = items.map((it) => [
      new Date(it.createdAt ?? Date.now()).toISOString(),
      JSON.stringify(it.type ?? ''),
      JSON.stringify(it.userId ?? ''),
      JSON.stringify(it.projectId ?? ''),
      JSON.stringify(it.text ?? it.message ?? ''),
    ]);
    return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}