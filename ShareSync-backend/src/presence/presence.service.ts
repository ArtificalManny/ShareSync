// src/presence/presence.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PRESENCE SERVICE
// Manages user presence state and provides presence data to other services
// Works alongside AppGateway which handles the WebSocket events
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Presence status types
export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  FOCUS = 'focus',
  OFFLINE = 'offline',
}

// User presence data structure
export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: Date;
  lastActivity: Date;
  currentProject?: string;
  currentView?: string;
  focusSession?: {
    startedAt: Date;
    endsAt?: Date;
    taskId?: string;
  };
}

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  
  // In-memory presence store (could be Redis for multi-instance)
  private presenceMap: Map<string, UserPresence> = new Map();
  
  // Track activity for momentum calculations
  private activityLog: Map<string, Date[]> = new Map();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // PRESENCE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Set user as online
   */
  setOnline(userId: string, projectId?: string): UserPresence {
    const presence: UserPresence = {
      userId,
      status: PresenceStatus.ONLINE,
      lastSeen: new Date(),
      lastActivity: new Date(),
      currentProject: projectId,
    };
    
    this.presenceMap.set(userId, presence);
    this.logActivity(userId);
    
    this.eventEmitter.emit('presence.changed', { userId, status: PresenceStatus.ONLINE });
    this.logger.debug(`User ${userId} is now ONLINE`);
    
    return presence;
  }

  /**
   * Set user as offline
   */
  setOffline(userId: string): void {
    const existing = this.presenceMap.get(userId);
    
    if (existing) {
      existing.status = PresenceStatus.OFFLINE;
      existing.lastSeen = new Date();
      this.presenceMap.set(userId, existing);
    }
    
    this.eventEmitter.emit('presence.changed', { userId, status: PresenceStatus.OFFLINE });
    this.logger.debug(`User ${userId} is now OFFLINE`);
  }

  /**
   * Update user status
   */
  updateStatus(userId: string, status: PresenceStatus): UserPresence | null {
    const existing = this.presenceMap.get(userId);
    
    if (!existing) {
      // User not tracked, create new presence
      return this.setOnline(userId);
    }
    
    existing.status = status;
    existing.lastActivity = new Date();
    
    if (status !== PresenceStatus.OFFLINE) {
      existing.lastSeen = new Date();
    }
    
    this.presenceMap.set(userId, existing);
    this.logActivity(userId);
    
    this.eventEmitter.emit('presence.changed', { userId, status });
    this.logger.debug(`User ${userId} status updated to ${status}`);
    
    return existing;
  }

  /**
   * Start a focus session
   */
  startFocusSession(userId: string, durationMs?: number, taskId?: string): UserPresence | null {
    const existing = this.presenceMap.get(userId);
    
    if (!existing) return null;
    
    existing.status = PresenceStatus.FOCUS;
    existing.focusSession = {
      startedAt: new Date(),
      endsAt: durationMs ? new Date(Date.now() + durationMs) : undefined,
      taskId,
    };
    existing.lastActivity = new Date();
    
    this.presenceMap.set(userId, existing);
    
    this.eventEmitter.emit('presence.focus.started', { 
      userId, 
      taskId,
      duration: durationMs,
    });
    
    this.logger.debug(`User ${userId} started FOCUS session`);
    
    return existing;
  }

  /**
   * End a focus session
   */
  endFocusSession(userId: string): UserPresence | null {
    const existing = this.presenceMap.get(userId);
    
    if (!existing) return null;
    
    const focusSession = existing.focusSession;
    existing.status = PresenceStatus.ONLINE;
    existing.focusSession = undefined;
    existing.lastActivity = new Date();
    
    this.presenceMap.set(userId, existing);
    
    if (focusSession) {
      const duration = Date.now() - focusSession.startedAt.getTime();
      this.eventEmitter.emit('presence.focus.ended', { 
        userId, 
        taskId: focusSession.taskId,
        duration,
      });
    }
    
    this.logger.debug(`User ${userId} ended FOCUS session`);
    
    return existing;
  }

  /**
   * Update user's current location (project/view)
   */
  updateLocation(userId: string, projectId?: string, view?: string): void {
    const existing = this.presenceMap.get(userId);
    
    if (existing) {
      existing.currentProject = projectId;
      existing.currentView = view;
      existing.lastActivity = new Date();
      this.presenceMap.set(userId, existing);
      this.logActivity(userId);
    }
  }

  /**
   * Record heartbeat (keep-alive)
   */
  heartbeat(userId: string): void {
    const existing = this.presenceMap.get(userId);
    
    if (existing) {
      existing.lastSeen = new Date();
      existing.lastActivity = new Date();
      this.presenceMap.set(userId, existing);
      this.logActivity(userId);
    } else {
      this.setOnline(userId);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRESENCE QUERIES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get user's presence
   */
  getPresence(userId: string): UserPresence | null {
    return this.presenceMap.get(userId) || null;
  }

  /**
   * Get presence for multiple users
   */
  getPresenceMultiple(userIds: string[]): Record<string, UserPresence | null> {
    const result: Record<string, UserPresence | null> = {};
    
    for (const userId of userIds) {
      result[userId] = this.presenceMap.get(userId) || null;
    }
    
    return result;
  }

  /**
   * Check if user is online
   */
  isOnline(userId: string): boolean {
    const presence = this.presenceMap.get(userId);
    return presence ? presence.status !== PresenceStatus.OFFLINE : false;
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): UserPresence[] {
    return Array.from(this.presenceMap.values())
      .filter(p => p.status !== PresenceStatus.OFFLINE);
  }

  /**
   * Get users in a specific project
   */
  getUsersInProject(projectId: string): UserPresence[] {
    return Array.from(this.presenceMap.values())
      .filter(p => p.currentProject === projectId && p.status !== PresenceStatus.OFFLINE);
  }

  /**
   * Get online user count
   */
  getOnlineCount(): number {
    return this.getOnlineUsers().length;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTIVITY TRACKING (for momentum)
  // ─────────────────────────────────────────────────────────────────────────────

  private logActivity(userId: string): void {
    const now = new Date();
    const log = this.activityLog.get(userId) || [];
    
    // Keep last hour of activity
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const filtered = log.filter(d => d.getTime() > oneHourAgo);
    filtered.push(now);
    
    this.activityLog.set(userId, filtered);
  }

  /**
   * Get user's activity level (for momentum visualization)
   * Returns a value 0-100 based on recent activity frequency
   */
  getActivityLevel(userId: string): number {
    const log = this.activityLog.get(userId) || [];
    
    if (log.length === 0) return 0;
    
    // Count activities in last 15 minutes
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    const recentCount = log.filter(d => d.getTime() > fifteenMinutesAgo).length;
    
    // Normalize to 0-100 (assuming ~20 activities in 15 min is "high")
    return Math.min(100, Math.round((recentCount / 20) * 100));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mark stale users as offline (run periodically)
   */
  cleanupStalePresence(staleThresholdMs: number = 5 * 60 * 1000): void {
    const now = Date.now();
    
    for (const [userId, presence] of this.presenceMap.entries()) {
      if (presence.status !== PresenceStatus.OFFLINE) {
        const lastSeenMs = presence.lastSeen.getTime();
        
        if (now - lastSeenMs > staleThresholdMs) {
          this.setOffline(userId);
          this.logger.debug(`User ${userId} marked OFFLINE due to inactivity`);
        }
      }
    }
  }
}
