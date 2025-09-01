// src/activities/activities.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';

type AnyObj = Record<string, any>;

export interface ListParams {
  scope: 'user' | 'project';
  userId?: string;
  projectId?: string;
  type?: string;                 // e.g., 'task.create' or comma-separated
  range?: '24h' | '7d' | '30d' | 'all';
  cursor?: string | null;        // ISO createdAt of last item to paginate older
  limit?: number;                // page size (max 100)
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel('Activity') private readonly activityModel: Model<AnyObj>,
  ) {}

  /**
   * Persist an activity row.
   * Minimal contract: userId?, projectId?, type (string), payload? (free-form)
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
      // normalize a few common shapes for convenience:
      text: event.payload?.text ?? '',
      meta: event.payload ?? {},
      createdAt: now,
      updatedAt: now,
    });

    return typeof (doc as any).toObject === 'function' ? (doc as any).toObject() : doc;
  }

  /**
   * Back-compat wrapper used by ActivitiesController:
   * create(projectId, userId, dto) -> record({...})
   */
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
    // If you want the controller to receive a slightly different shape,
    // you could transform the return here as needed.
  }

  /**
   * List activities with simple filters + cursor pagination.
   * Returns { items, nextCursor }, ordered newest -> oldest.
   */
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
      const types = String(type)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (types.length === 1) q.type = types[0];
      else if (types.length > 1) q.type = { $in: types };
    }

    // Range
    if (range !== 'all') {
      const now = Date.now();
      let sinceMs = 0;
      if (range === '24h') sinceMs = 24 * 60 * 60 * 1000;
      else if (range === '7d') sinceMs = 7 * 24 * 60 * 60 * 1000;
      else if (range === '30d') sinceMs = 30 * 24 * 60 * 60 * 1000;
      q.createdAt = { ...(q.createdAt || {}), $gte: new Date(now - sinceMs) };
    }

    // Cursor (older than createdAt)
    if (cursor) {
      q.createdAt = { ...(q.createdAt || {}), $lt: new Date(cursor) };
    }

    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const rows = await this.activityModel
      .find(q)
      .sort({ createdAt: -1 })
      .limit(pageSize + 1) // overfetch to detect next page
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

  /**
   * Basic CSV exporter for a set of activity rows.
   */
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