// src/discovery/discovery.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    @InjectModel('Project') private readonly ProjectModel: Model<any>,
    @InjectModel('Suggestion') private readonly SuggestionModel: Model<any>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEM 8: DASGUPTA-INFORMED CRON ENGINE (Global Base Score)
  // Runs every 15 minutes to compute w1*Momentum + w2*Freshness + w3*SocialProof
  // ═══════════════════════════════════════════════════════════════════════════
  @Cron('*/15 * * * *')
  async calculateTrendingScores() {
    this.logger.log('Starting Dasgupta-informed trending score calculation...');
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      // 1. Fetch eligible public projects
      const projects = await this.ProjectModel.find({
        $or: [{ visibility: 'public' }, { visibility: 'listed' }, { isPublic: true }, { 'settings.isListed': true }],
        status: { $ne: 'archived' },
        isArchived: { $ne: true },
      }).select('metrics followersCount createdAt updatedAt').lean();

      const bulkOps = [];

      for (const p of projects) {
        // Anti-Gaming Rule 1: Must be at least 7 days old
        const isOldEnough = new Date(p.createdAt || now) <= sevenDaysAgo;
        // Anti-Gaming Rule 2: Minimum 3 tasks
        const hasEnoughTasks = (p.metrics?.totalTasks || 0) >= 3;

        if (!isOldEnough || !hasEnoughTasks) {
          bulkOps.push({
            updateOne: { filter: { _id: p._id }, update: { $set: { trendingScore: 0 } } }
          });
          continue;
        }

        // --- w1: Momentum (0.35 weight) ---
        // Normalized weekly ships. Anti-Gaming: Cap momentum at 95th percentile (assume 10 is excellent)
        const weeklyShips = Math.min(Number(p.metrics?.weeklyShips || 0), 10);
        const w1_momentum = (weeklyShips / 10) * 100 * 0.35;

        // --- w2: Freshness (0.25 weight) ---
        // 1 / (1 + hours_since_last_activity / 24). Exponential decay.
        const lastActive = new Date(p.metrics?.lastActivityAt || p.updatedAt || now).getTime();
        const hoursSince = Math.max((now.getTime() - lastActive) / (1000 * 60 * 60), 0);
        const w2_freshness = (1 / (1 + (hoursSince / 24))) * 100 * 0.25;

        // --- w3: Social Proof (0.25 weight) ---
        // log(1 + followers) * (1 + avg_suggestion_votes / 10)
        const followers = Number(p.followersCount || 0);
        
        // Aggregate avg suggestion votes
        const voteStats = await this.SuggestionModel.aggregate([
          { $match: { projectId: p._id } },
          { $group: { _id: null, avgVotes: { $avg: { $add: ["$votes", { $size: { $ifNull: ["$upvotes", []] } }] } } } }
        ]);
        const avgVotes = voteStats.length > 0 ? voteStats[0].avgVotes : 0;

        const socialProofFactor = Math.log10(1 + followers) * (1 + (avgVotes / 10));
        // Cap social proof contribution
        const w3_socialProof = Math.min(socialProofFactor * 20, 100) * 0.25;

        // --- Calculate Base Score (w1 + w2 + w3) ---
        // w4 (Diversity Bonus) is applied at read-time, not write-time.
        const trendingScore = Math.round(w1_momentum + w2_freshness + w3_socialProof);

        bulkOps.push({
          updateOne: {
            filter: { _id: p._id },
            update: { $set: { trendingScore } }
          }
        });
      }

      // Execute safely in bulk
      if (bulkOps.length > 0) {
        await this.ProjectModel.bulkWrite(bulkOps);
        this.logger.log(`Successfully updated trending scores for ${bulkOps.length} projects.`);
      }

    } catch (error) {
      this.logger.error('Failed to calculate trending scores', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEM 8: READ ENGINE WITH w4 DIVERSITY BONUS
  // ═══════════════════════════════════════════════════════════════════════════
  async getPersonalizedFeed(userId: string, cursor?: string, limit = 10) {
    const filter: any = {
      $and: [
        {
          $or: [
            { visibility: 'public' }, { visibility: 'listed' },
            { isPublic: true }, { 'settings.isPublic': true }, { 'settings.isListed': true },
          ],
        },
        { status: { $ne: 'archived' } },
        { isArchived: { $ne: true } },
      ],
    };

    // Pull candidates sorted by the CRON's pre-computed base score
    const candidates = await this.ProjectModel.find(filter)
      .sort({ trendingScore: -1, updatedAt: -1 })
      .limit(100) // Pull top 100 to apply diversity shuffling
      .populate('ownerId', 'firstName lastName username avatarUrl')
      .lean();

    // In a full prod environment, we would pull the user's last 20 viewed categories here.
    // For now, we simulate the Diversity Bonus (w4 = 0.15) by applying a slight entropy 
    // boost to projects with unique categories to prevent filter bubbles.
    const categoryFrequency = new Map<string, number>();
    
    const scoredCandidates = candidates.map((p: any) => {
      const baseScore = p.trendingScore || 0;
      const cat = p.category || 'general';
      
      const currentCatCount = categoryFrequency.get(cat) || 0;
      categoryFrequency.set(cat, currentCatCount + 1);

      // w4: Diversity Bonus. The fewer times we've seen this category in the top stack, the higher the boost.
      const diversityBoost = Math.max(0, (1 - (currentCatCount / 10))) * 100 * 0.15;
      
      const finalAlgorithmicScore = baseScore + diversityBoost;
      
      return { project: p, score: finalAlgorithmicScore };
    });

    // Re-sort with diversity bonus applied
    scoredCandidates.sort((a, b) => b.score - a.score);

    let startIndex = 0;
    if (cursor) {
      const cursorIndex = scoredCandidates.findIndex(c => String(c.project._id) === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginated = scoredCandidates.slice(startIndex, startIndex + limit);
    const items = paginated.map(c => {
      const mapped = this.mapProjectToFeedItem(c.project);
      return { ...mapped, algorithmicScore: Math.round(c.score) };
    });
    
    const nextCursor = paginated.length === limit ? String(paginated[paginated.length - 1].project._id) : null;

    return { success: true, items, nextCursor, hasMore: !!nextCursor };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STANDARD ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  async getDiscoveryFeed(query: any = {}) {
    const rawLimit = parseInt(query.limit ?? '30', 10);
    const limit = Math.min(Number.isFinite(rawLimit) ? rawLimit : 30, 100);
    const rawPage = parseInt(query.page ?? '1', 10);
    const page = Math.max(Number.isFinite(rawPage) ? rawPage : 1, 1);
    const skip = (page - 1) * limit;

    const q = (query.q ?? '').toString().trim();
    const sort = (query.sort ?? 'trending').toString(); // Default to algorithmic
    const category = (query.category ?? '').toString().trim();

    const filter: any = {
      $and: [
        {
          $or: [
            { visibility: 'public' }, { visibility: 'listed' },
            { isPublic: true }, { public: true },
            { 'settings.isPublic': true }, { 'settings.isListed': true },
          ],
        },
        {
          $or: [
            { isListed: { $ne: false } }, { listed: { $ne: false } },
            { 'settings.isListed': { $ne: false } },
          ],
        },
        {
          $or: [ { status: { $ne: 'archived' } }, { isArchived: { $ne: true } } ],
        },
      ],
    };

    if (category) filter.$and.push({ category: { $regex: category, $options: 'i' } });
    if (q) filter.$and.push({
      $or: [
        { title: { $regex: q, $options: 'i' } }, { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }, { tags: { $in: [new RegExp(q, 'i')] } },
      ],
    });

    const sortMap: Record<string, any> = {
      recent: { updatedAt: -1 },
      trending: { trendingScore: -1, 'metrics.weeklyShips': -1, updatedAt: -1 }, // Powered by Cron
      streak: { streakDays: -1, updatedAt: -1 },
      popular: { 'metrics.memberCount': -1, followersCount: -1, updatedAt: -1 },
      ships: { 'metrics.totalShips': -1, updatedAt: -1 },
    };

    const sortClause = sortMap[sort] ?? sortMap.trending;
    
    // Kept projection exactly the same per instructions
    const projection = {
      name: 1, title: 1, description: 1, tags: 1, emoji: 1, icon: 1, color: 1, category: 1,
      streakDays: 1, streak: 1, memberCount: 1, members: 1, lastShip: 1, lastShipAt: 1,
      latestUpdate: 1, latestActivity: 1, momentum: 1, updatedAt: 1, createdAt: 1, teamName: 1,
      orgName: 1, ownerName: 1, ownerId: 1, owner: 1, visibility: 1, isPublic: 1, public: 1,
      isListed: 1, listed: 1, settings: 1, metrics: 1, followersCount: 1, trendingScore: 1,
    };

    const [docs, total] = await Promise.all([
      this.ProjectModel.find(filter).select(projection).sort(sortClause).skip(skip).limit(limit)
        .populate('ownerId', 'firstName lastName username avatarUrl')
        .populate('owner', 'firstName lastName username avatarUrl').lean(),
      this.ProjectModel.countDocuments(filter),
    ]);

    const data = (docs || []).map((p: any) => this.mapProjectToFeedItem(p));

    return {
      success: true, data,
      meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1), sort, q: q || null, category: category || null, hasMore: skip + data.length < total },
      timestamp: new Date().toISOString(),
    };
  }

  async getTrendingProjects(limit = 10) {
    const docs = await this.ProjectModel.find({
      $or: [{ visibility: 'public' }, { visibility: 'listed' }, { isPublic: true }, { 'settings.isListed': true }],
      status: { $ne: 'archived' }, isArchived: { $ne: true },
    }).sort({ trendingScore: -1, 'metrics.weeklyShips': -1, 'metrics.memberCount': -1, updatedAt: -1 }).limit(limit).populate('ownerId', 'firstName lastName username avatarUrl').lean();
    return { success: true, data: (docs || []).map((p: any) => this.mapProjectToFeedItem(p)) };
  }

  async getCategories() {
    return {
      success: true,
      data: [
        { id: 'tech', name: 'Technology', icon: '💻', color: '#3B82F6' },
        { id: 'design', name: 'Design', icon: '🎨', color: '#EC4899' },
        { id: 'business', name: 'Business', icon: '📊', color: '#10B981' },
      ],
    };
  }

  async getDiscoverySections() {
    const publicFilter = {
      $or: [{ visibility: 'public' }, { visibility: 'listed' }, { isPublic: true }, { 'settings.isListed': true }],
      status: { $ne: 'archived' }, isArchived: { $ne: true },
    };

    const hotStreaksPromise = this.ProjectModel.find({ ...publicFilter, streakDays: { $gte: 10 } })
      .sort({ streakDays: -1, 'metrics.weeklyShips': -1 }).limit(6).populate('ownerId', 'firstName lastName username avatarUrl').lean();

    const quietPromisingPromise = this.ProjectModel.find({ ...publicFilter, 'metrics.totalTasks': { $gte: 5 } })
      .sort({ 'metrics.lastActivityAt': 1 }).limit(4).populate('ownerId', 'firstName lastName username avatarUrl').lean();

    const recentlyShippedPromise = this.ProjectModel.find({ ...publicFilter, lastShipAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
      .sort({ lastShipAt: -1 }).limit(6).populate('ownerId', 'firstName lastName username avatarUrl').lean();

    const [hotStreaksRaw, quietPromisingRaw, recentlyShippedRaw] = await Promise.all([ hotStreaksPromise, quietPromisingPromise, recentlyShippedPromise ]);

    const hotStreaks = (hotStreaksRaw || []).map((p: any) => ({
      id: String(p._id), projectName: p.name || p.title || 'Untitled', teamName: this.getTeamName(p),
      emoji: p.emoji || p.icon || '🚀', streak: Number(p.streakDays || 0), members: Number(p.metrics?.memberCount || p.members?.length || 1),
      lastShip: p.lastShip || 'Shipped recently', momentum: this.getMomentumLevel(p), moderationStatus: 'approved',
    }));

    const quietPromising = (quietPromisingRaw || []).map((p: any) => ({
      id: String(p._id), projectName: p.name || p.title || 'Untitled', ownerName: this.getOwnerName(p),
      emoji: p.emoji || p.icon || '🌱', completionRate: this.getCompletionRate(p), totalShips: Number(p.metrics?.totalShips || p.metrics?.weeklyShips || 0),
      lastActivity: this.getLastActivityText(p), reason: 'Great progress - could use some momentum!', moderationStatus: 'approved',
    }));

    return { success: true, hotStreaks, quietPromising, recentlyShipped: (recentlyShippedRaw || []).map((p: any) => this.mapProjectToFeedItem(p)), peopleLikeYou: [], timestamp: new Date().toISOString() };
  }

  private mapProjectToFeedItem(p: any) {
    const owner = p.ownerId || p.owner || {};
    const displayName = this.getOwnerDisplayName(owner);

    return {
      id: String(p._id ?? p.id), _id: String(p._id ?? p.id), projectName: p.name || p.title || 'Untitled Project', name: p.name || p.title || 'Untitled Project',
      description: p.description || '', teamName: this.getTeamName(p), emoji: p.emoji || p.icon || '📁', color: p.color || '#7C3AED', category: p.category || null,
      streak: Number(p.streakDays ?? p.streak ?? 0), streakDays: Number(p.streakDays ?? p.streak ?? 0), members: Number(p.metrics?.memberCount ?? p.members?.length ?? 1),
      lastShip: p.lastShip || p.latestUpdate || 'Updated recently', momentum: this.getMomentumLevel(p), updatedAt: p.updatedAt, createdAt: p.createdAt,
      tags: Array.isArray(p.tags) ? p.tags : [],
      stats: { memberCount: Number(p.metrics?.memberCount ?? p.members?.length ?? 1), totalShips: Number(p.metrics?.totalShips ?? p.metrics?.weeklyShips ?? 0), likes: Number(p.metrics?.likes ?? 0), comments: Number(p.metrics?.comments ?? 0) },
      ownerInfo: { _id: owner._id, firstName: owner.firstName, lastName: owner.lastName, username: owner.username, avatarUrl: owner.avatarUrl },
      user: displayName,
      displayName,
      ownerName: displayName,
      isFollowing: false, moderationStatus: 'approved',
      trendingScore: p.trendingScore // Expose to frontend
    };
  }

  private getOwnerDisplayName(owner: any): string {
    const first = String(owner?.firstName || '').trim();
    const last = String(owner?.lastName || '').trim();
    const full = [first, last].filter(Boolean).join(' ').trim();

    if (full) return full;
    if (owner?.username) return String(owner.username).trim();
    return 'Unknown';
  }

  private getTeamName(p: any): string { const owner = p.ownerId || p.owner || {}; return ( p.teamName || p.orgName || p.ownerName || owner.username || (owner.firstName ? `${owner.firstName} ${owner.lastName || ''}`.trim() : null) || 'Unknown' ); }
  private getOwnerName(p: any): string { const owner = p.ownerId || p.owner || {}; return ( this.getOwnerDisplayName(owner) || p.ownerName || 'Unknown' ); }
  private getMomentumLevel(p: any): string { const ships = p.metrics?.weeklyShips || 0; const streak = p.streakDays || 0; if (ships >= 10 || streak >= 14) return 'blazing'; if (ships >= 5 || streak >= 7) return 'high'; if (ships >= 2 || streak >= 3) return 'steady'; return 'warming'; }
  private getCompletionRate(p: any): number { const total = p.metrics?.totalTasks || 0; const completed = p.metrics?.completedTasks || 0; if (total === 0) return 0; return Math.round((completed / total) * 100); }
  private getLastActivityText(p: any): string { const lastActivity = p.metrics?.lastActivityAt || p.updatedAt; if (!lastActivity) return 'Unknown'; const diff = Date.now() - new Date(lastActivity).getTime(); const days = Math.floor(diff / (1000 * 60 * 60 * 24)); if (days === 0) return 'Today'; if (days === 1) return 'Yesterday'; if (days < 7) return `${days} days ago`; if (days < 30) return `${Math.floor(days / 7)} weeks ago`; return `${Math.floor(days / 30)} months ago`; }
}
