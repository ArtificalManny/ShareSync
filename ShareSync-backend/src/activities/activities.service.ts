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
  type?: string;          // optional filter, e.g. 'task.create'
  range?: '24h' | '7d' | '30d' | 'all';
  cursor?: string | null; // ISO timestamp string
  limit?: number;         // page size
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

  /** List with simple cursor pagination (by createdAt desc). */
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

    if (type) q.type = type;

    // Range filter (by createdAt)
    const now = Date.now();
    let sinceMs = 0;
    if (range === '24h') sinceMs = 24 * 60 * 60 * 1000;
    else if (range === '7d') sinceMs = 7 * 24 * 60 * 60 * 1000;
    else if (range === '30d') sinceMs = 30 * 24 * 60 * 60 * 1000;
    if (range !== 'all') {
      q.createdAt = { ...(q.createdAt || {}), $gte: new Date(now - sinceMs) };
    }

    // Cursor (fetch older than cursor)
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
}