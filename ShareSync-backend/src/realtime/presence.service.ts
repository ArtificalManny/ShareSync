/**
 * presence.service.ts
 * User presence tracking (online/idle/focus mode)
 * 
 * Handles:
 * - Online/offline status
 * - Idle detection (no activity for 5+ minutes)
 * - Focus mode (deep work, no distractions)
 * - Last seen timestamps
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// ============================================
// PRESENCE STATES
// ============================================

export enum PresenceStatus {
  ONLINE = 'online',      // Actively working
  IDLE = 'idle',          // No activity for 5+ minutes
  FOCUS = 'focus',        // Deep work mode
  OFFLINE = 'offline',    // Disconnected
}

export enum PresenceMode {
  GHOST = 'ghost',        // Anonymous viewing
  TEAM = 'team',          // Full visibility
  FOCUS = 'focus',        // Minimal distractions
}

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  mode: PresenceMode;
  lastSeen: Date;
  lastActivity: Date;
  socketId?: string;
  name?: string;
  avatar?: string;
  currentProject?: string;
}

@Injectable()
export class PresenceService {
  // In-memory presence cache for ultra-low latency
  private presenceCache = new Map<string, UserPresence>();

  // Idle detection threshold (5 minutes)
  private readonly IDLE_THRESHOLD = 5 * 60 * 1000;

  constructor(
    // Uncomment when you create the schema
    // @InjectModel('UserPresence') private presenceModel: Model<UserPresence>,
  ) {
    // Start idle detection loop
    this.startIdleDetection();
  }

  // ============================================
  // ONLINE / OFFLINE MANAGEMENT
  // ============================================

  /**
   * Mark user as online
   */
  async setOnline(userId: string, socketId?: string) {
    try {
      const presence: UserPresence = {
        userId,
        status: PresenceStatus.ONLINE,
        mode: PresenceMode.TEAM, // Default mode
        lastSeen: new Date(),
        lastActivity: new Date(),
        socketId,
      };

      // Update cache
      this.presenceCache.set(userId, presence);

      // Persist to database
      // await this.presenceModel.findOneAndUpdate(
      //   { userId },
      //   presence,
      //   { upsert: true, new: true },
      // );

      console.log(`✅ ${userId} is now ONLINE`);

      return presence;
    } catch (error) {
      console.error('Failed to set online:', error);
      throw error;
    }
  }

  /**
   * Mark user as offline
   */
  async setOffline(userId: string) {
    try {
      const presence = this.presenceCache.get(userId);
      
      if (presence) {
        presence.status = PresenceStatus.OFFLINE;
        presence.lastSeen = new Date();
        presence.socketId = undefined;

        // Update cache
        this.presenceCache.set(userId, presence);

        // Persist to database
        // await this.presenceModel.findOneAndUpdate(
        //   { userId },
        //   {
        //     status: PresenceStatus.OFFLINE,
        //     lastSeen: new Date(),
        //     $unset: { socketId: '' },
        //   },
        // );

        console.log(`👋 ${userId} is now OFFLINE`);
      }

      return presence;
    } catch (error) {
      console.error('Failed to set offline:', error);
      throw error;
    }
  }

  /**
   * Get user's current presence
   */
  async getPresence(userId: string): Promise<UserPresence | null> {
    try {
      // Check cache first
      let presence = this.presenceCache.get(userId);

      if (!presence) {
        // Load from database
        // presence = await this.presenceModel.findOne({ userId }).lean();
        
        // Mock data for now
        presence = {
          userId,
          status: PresenceStatus.OFFLINE,
          mode: PresenceMode.TEAM,
          lastSeen: new Date(),
          lastActivity: new Date(),
        };

        if (presence) {
          this.presenceCache.set(userId, presence);
        }
      }

      return presence || null;
    } catch (error) {
      console.error('Failed to get presence:', error);
      return null;
    }
  }

  /**
   * Get presence for multiple users
   */
  async getMultiplePresence(userIds: string[]): Promise<Map<string, UserPresence>> {
    const presenceMap = new Map<string, UserPresence>();

    await Promise.all(
      userIds.map(async (userId) => {
        const presence = await this.getPresence(userId);
        if (presence) {
          presenceMap.set(userId, presence);
        }
      }),
    );

    return presenceMap;
  }

  // ============================================
  // ACTIVITY TRACKING
  // ============================================

  /**
   * Record user activity (resets idle timer)
   */
  async recordActivity(userId: string) {
    try {
      const presence = this.presenceCache.get(userId);

      if (presence) {
        presence.lastActivity = new Date();
        
        // If was idle, set back to online
        if (presence.status === PresenceStatus.IDLE) {
          presence.status = PresenceStatus.ONLINE;
          console.log(`🔄 ${userId} is now ACTIVE again`);
        }

        this.presenceCache.set(userId, presence);

        // Async update to database (don't block)
        // this.presenceModel.findOneAndUpdate(
        //   { userId },
        //   {
        //     lastActivity: presence.lastActivity,
        //     status: presence.status,
        //   },
        // ).exec();
      }
    } catch (error) {
      console.error('Failed to record activity:', error);
    }
  }

  /**
   * Start idle detection loop (runs every minute)
   */
  private startIdleDetection() {
    setInterval(() => {
      this.detectIdleUsers();
    }, 60 * 1000); // Check every minute
  }

  /**
   * Detect and mark idle users
   */
  private detectIdleUsers() {
    const now = Date.now();

    this.presenceCache.forEach((presence, userId) => {
      if (presence.status !== PresenceStatus.ONLINE) return;

      const timeSinceActivity = now - presence.lastActivity.getTime();

      if (timeSinceActivity > this.IDLE_THRESHOLD) {
        presence.status = PresenceStatus.IDLE;
        this.presenceCache.set(userId, presence);

        console.log(`😴 ${userId} is now IDLE (${Math.floor(timeSinceActivity / 60000)} minutes)`);

        // Async update to database
        // this.presenceModel.findOneAndUpdate(
        //   { userId },
        //   { status: PresenceStatus.IDLE },
        // ).exec();
      }
    });
  }

  // ============================================
  // PRESENCE MODES
  // ============================================

  /**
   * Set user's presence mode (ghost/team/focus)
   */
  async setMode(userId: string, mode: PresenceMode) {
    try {
      const presence = this.presenceCache.get(userId);

      if (presence) {
        presence.mode = mode;
        
        // Focus mode also changes status
        if (mode === PresenceMode.FOCUS) {
          presence.status = PresenceStatus.FOCUS;
        } else if (presence.status === PresenceStatus.FOCUS) {
          presence.status = PresenceStatus.ONLINE;
        }

        this.presenceCache.set(userId, presence);

        // Persist to database
        // await this.presenceModel.findOneAndUpdate(
        //   { userId },
        //   {
        //     mode,
        //     status: presence.status,
        //   },
        // );

        console.log(`🎭 ${userId} mode: ${mode}`);

        return presence;
      }
    } catch (error) {
      console.error('Failed to set mode:', error);
      throw error;
    }
  }

  /**
   * Enter focus mode (deep work)
   */
  async enterFocusMode(userId: string, duration?: number) {
    try {
      await this.setMode(userId, PresenceMode.FOCUS);

      // Optional: Set auto-exit timer
      if (duration) {
        setTimeout(() => {
          this.exitFocusMode(userId);
        }, duration);
      }

      console.log(`🔥 ${userId} entered FOCUS mode (${duration ? duration / 60000 + ' min' : 'unlimited'})`);
    } catch (error) {
      console.error('Failed to enter focus mode:', error);
    }
  }

  /**
   * Exit focus mode
   */
  async exitFocusMode(userId: string) {
    try {
      await this.setMode(userId, PresenceMode.TEAM);
      console.log(`✅ ${userId} exited FOCUS mode`);
    } catch (error) {
      console.error('Failed to exit focus mode:', error);
    }
  }

  // ============================================
  // PROJECT PRESENCE
  // ============================================

  /**
   * Set user's current project
   */
  async setCurrentProject(userId: string, projectId: string) {
    try {
      const presence = this.presenceCache.get(userId);

      if (presence) {
        presence.currentProject = projectId;
        this.presenceCache.set(userId, presence);

        // Persist to database
        // await this.presenceModel.findOneAndUpdate(
        //   { userId },
        //   { currentProject: projectId },
        // );
      }
    } catch (error) {
      console.error('Failed to set current project:', error);
    }
  }

  /**
   * Get all users in a project
   */
  async getUsersInProject(projectId: string): Promise<UserPresence[]> {
    try {
      const usersInProject: UserPresence[] = [];

      this.presenceCache.forEach((presence) => {
        if (presence.currentProject === projectId && presence.status !== PresenceStatus.OFFLINE) {
          usersInProject.push(presence);
        }
      });

      return usersInProject;
    } catch (error) {
      console.error('Failed to get users in project:', error);
      return [];
    }
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get presence statistics for a project
   */
  async getProjectStats(projectId: string) {
    try {
      const users = await this.getUsersInProject(projectId);

      const stats = {
        total: users.length,
        online: users.filter(u => u.status === PresenceStatus.ONLINE).length,
        idle: users.filter(u => u.status === PresenceStatus.IDLE).length,
        focus: users.filter(u => u.status === PresenceStatus.FOCUS).length,
        modes: {
          ghost: users.filter(u => u.mode === PresenceMode.GHOST).length,
          team: users.filter(u => u.mode === PresenceMode.TEAM).length,
          focus: users.filter(u => u.mode === PresenceMode.FOCUS).length,
        },
      };

      return stats;
    } catch (error) {
      console.error('Failed to get project stats:', error);
      return null;
    }
  }

  /**
   * Get user's activity history
   */
  async getUserActivityHistory(userId: string, days = 7) {
    try {
      // const history = await this.presenceModel.find({
      //   userId,
      //   lastActivity: {
      //     $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      //   },
      // })
      // .sort({ lastActivity: -1 })
      // .lean();

      // Mock data for now
      const history = Array.from({ length: days * 3 }, (_, i) => ({
        date: new Date(Date.now() - i * 8 * 60 * 60 * 1000),
        status: PresenceStatus.ONLINE,
        duration: Math.floor(Math.random() * 180), // minutes
      }));

      return history;
    } catch (error) {
      console.error('Failed to get activity history:', error);
      return [];
    }
  }

  /**
   * Get peak activity hours for a user
   */
  async getPeakHours(userId: string) {
    try {
      // Aggregate activity by hour of day
      // const peakHours = await this.presenceModel.aggregate([
      //   { $match: { userId } },
      //   {
      //     $group: {
      //       _id: { $hour: '$lastActivity' },
      //       count: { $sum: 1 },
      //     },
      //   },
      //   { $sort: { count: -1 } },
      //   { $limit: 3 },
      // ]);

      // Mock data for now
      const peakHours = [
        { hour: 14, count: 120 }, // 2 PM
        { hour: 10, count: 95 },  // 10 AM
        { hour: 21, count: 87 },  // 9 PM
      ];

      return peakHours;
    } catch (error) {
      console.error('Failed to get peak hours:', error);
      return [];
    }
  }

  // ============================================
  // CLEANUP
  // ============================================

  /**
   * Clean up stale presence records
   */
  async cleanup() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Remove offline users not seen in 30 days
      // await this.presenceModel.deleteMany({
      //   status: PresenceStatus.OFFLINE,
      //   lastSeen: { $lt: thirtyDaysAgo },
      // });

      console.log('🧹 Cleaned up stale presence records');
    } catch (error) {
      console.error('Failed to cleanup presence:', error);
    }
  }
}