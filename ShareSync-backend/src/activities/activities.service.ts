// src/activities/activities.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { CreateActivityDto } from './dto/create-activity.dto';

type AnyObj = Record<string, any>;

export interface ListParams {
  scope: 'user' | 'project';
  userId?: string;
  projectId?: string;
  type?: string;                 // e.g. 'task.create' or comma-separated
  range?: '24h' | '7d' | '30d' | 'all';
  cursor?: string | null;        // ISO timestamp (createdAt) to paginate older
  limit?: number;                // page size
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel('Activity')
    private readonly activityModel: Model<AnyObj>,
  ) {}

  /** Create a new activity document. Contract: (projectId, userId, dto) */
  async create(projectId: string, userId: string, dto: CreateActivityDto): Promise<AnyObj> {
    const now = new Date();
    const payload: AnyObj = {
      projectId,
      userId,
      type: dto.type ?? 'update',
      text: dto.text ?? '',
      meta: dto.meta ?? {},
      createdAt: now,
      updatedAt: now,
    };
    const doc = await this.activityModel.create(payload);
    return typeof (doc as any).toObject === 'function' ? (doc as any).toObject() : doc;
  }

  /** List with cursor pagination (createdAt DESC). */
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

    if (scope === 'user') {
      if (userId) q.userId = userId;
    } else if (scope === 'project') {
      if (projectId) q.projectId = projectId;
    }

    // type can be a single value or comma-separated list
    if (type) {
      const types = String(type)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (types.length === 1) q.type = types[0];
      else if (types.length > 1) q.type = { $in: types };
    }

    // Range filter (by createdAt)
    if (range !== 'all') {
      const now = Date.now();
      let sinceMs = 0;
      if (range === '24h') sinceMs = 24 * 60 * 60 * 1000;
      else if (range === '7d') sinceMs = 7 * 24 * 60 * 60 * 1000;
      else if (range === '30d') sinceMs = 30 * 24 * 60 * 60 * 1000;
      q.createdAt = { ...(q.createdAt || {}), $gte: new Date(now - sinceMs) };
    }

    // Cursor (older than given createdAt)
    if (cursor) {
      q.createdAt = { ...(q.createdAt || {}), $lt: new Date(cursor) };
    }

    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const rows = await this.activityModel
      .find(q)
      .sort({ createdAt: -1 })
      .limit(pageSize + 1) // overfetch to know if next page exists
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

  /** Produce a simple CSV export for the current query results. */
  toCsv(items: AnyObj[]): string {
    const header = [
      'createdAt',
      'type',
      'userId',
      'projectId',
      'message',
    ];
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