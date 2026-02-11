import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectModel('Project') private readonly ProjectModel: Model<any>,
  ) {}

  /**
   * Discovery Feed v1
   * - Only public/listed projects (defensive checks: field names can vary)
   * - Supports: page, limit, q, sort
   * - Returns consistent ShareSync-style envelope
   */
  async getDiscoveryFeed(query: any = {}) {
    const rawLimit = parseInt(query.limit ?? '30', 10);
    const limit = Math.min(Number.isFinite(rawLimit) ? rawLimit : 30, 100);

    const rawPage = parseInt(query.page ?? '1', 10);
    const page = Math.max(Number.isFinite(rawPage) ? rawPage : 1, 1);

    const skip = (page - 1) * limit;

    const q = (query.q ?? '').toString().trim();
    const sort = (query.sort ?? 'recent').toString();

    const filter: any = {
      $and: [
        // visibility: 'public' OR isPublic: true OR public: true
        {
          $or: [{ visibility: 'public' }, { isPublic: true }, { public: true }],
        },
        // exclude explicitly unlisted projects
        {
          $or: [{ isListed: { $ne: false } }, { listed: { $ne: false } }],
        },
      ],
    };

    if (q) {
      // Safe-ish search: regex on title/name/description + tags contains
      filter.$and.push({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } },
        ],
      });
    }

    // NOTE: If you later add real "trendingScore", wire it here.
    const sortMap: Record<string, any> = {
      recent: { updatedAt: -1 },
      trending: { updatedAt: -1 },
      streak: { streakDays: -1, updatedAt: -1 },
    };

    const sortClause = sortMap[sort] ?? sortMap.recent;

    // Keep the query lightweight: select only likely-needed fields
    const projection = {
      title: 1,
      name: 1,
      description: 1,
      tags: 1,
      emoji: 1,
      streakDays: 1,
      streak: 1,
      memberCount: 1,
      members: 1,
      lastShip: 1,
      latestUpdate: 1,
      latestActivity: 1,
      momentum: 1,
      updatedAt: 1,
      teamName: 1,
      orgName: 1,
      ownerName: 1,
      owner: 1,
      visibility: 1,
      isPublic: 1,
      public: 1,
      isListed: 1,
      listed: 1,
    };

    const [docs, total] = await Promise.all([
      this.ProjectModel.find(filter)
        .select(projection)
        .sort(sortClause)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.ProjectModel.countDocuments(filter),
    ]);

    const data = (docs || []).map((p: any) => {
      const projectName = p.title || p.name || 'Untitled Project';
      const teamName =
        p.teamName ||
        p.orgName ||
        p.ownerName ||
        (p.owner?.username ?? p.owner?.name ?? 'Unknown');

      return {
        id: String(p._id ?? p.id),
        projectName,
        teamName,
        emoji: p.emoji || '✨',
        streak: Number(p.streakDays ?? p.streak ?? 0),
        members: Number(p.memberCount ?? p.members?.length ?? 1),
        lastShip: p.lastShip || p.latestUpdate || p.latestActivity || 'Updated recently',
        momentum: p.momentum || 'steady',
        updatedAt: p.updatedAt,
        tags: Array.isArray(p.tags) ? p.tags : [],
      };
    });

    return {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        sort,
        q: q || null,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
