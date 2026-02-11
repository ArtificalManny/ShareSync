import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectModel('Project') private readonly ProjectModel: Model<any>,
  ) {}

  /**
   * Minimal v1:
   * - Return ONLY public/listed projects (defensive checks because field names vary)
   * - Shape is tolerant; frontend is defensive.
   */
  async getDiscoveryFeed(query: any = {}) {
    const limit = Math.min(parseInt(query.limit ?? '30', 10) || 30, 100);
    const q = (query.q ?? '').toString().trim();
    const sort = (query.sort ?? 'recent').toString();

    const filter: any = {
      $and: [
        // visibility: 'public' OR isPublic: true OR public: true
        {
          $or: [
            { visibility: 'public' },
            { isPublic: true },
            { public: true },
          ],
        },
        // optionally exclude explicitly unlisted projects
        {
          $or: [
            { isListed: { $ne: false } },
            { listed: { $ne: false } },
          ],
        },
      ],
    };

    if (q) {
      filter.$and.push({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } },
        ],
      });
    }

    const sortMap: any = {
      recent: { updatedAt: -1 },
      trending: { updatedAt: -1 },
      streak: { streakDays: -1 },
    };

    const docs = await this.ProjectModel
      .find(filter)
      .sort(sortMap[sort] ?? sortMap.recent)
      .limit(limit)
      .lean();

    // Normalize to a Discover-friendly shape (no hard dependency on your DB fields)
    return (docs || []).map((p: any) => {
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
        // If you don’t have streak yet, default 0
        streak: Number(p.streakDays ?? p.streak ?? 0),
        members: Number(p.memberCount ?? p.members?.length ?? 1),
        lastShip: p.lastShip || p.latestUpdate || p.latestActivity || 'Updated recently',
        momentum: p.momentum || 'steady',
        // Optional fields you can expand later
        updatedAt: p.updatedAt,
        tags: p.tags || [],
      };
    });
  }
}
