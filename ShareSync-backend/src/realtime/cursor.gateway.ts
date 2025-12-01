/**
 * cursor.gateway.ts
 * WebSocket gateway for Live Human Cursor real-time events
 * 
 * Handles:
 * - Cursor position updates (throttled to 30fps)
 * - Cursor activity flashes (typing, clicking, dragging)
 * - Cursor state changes (idle, active, focused)
 */

import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { Injectable, UseGuards } from '@nestjs/common';
  import { CursorService } from './cursor.service';
  import { PresenceService } from './presence.service';
  import { WsJwtGuard } from '../auth/ws-jwt.guard';
  
  // Cursor position update DTO
  export interface CursorUpdateDto {
    projectId: string;
    x: number;           // X coordinate (0-100% of viewport)
    y: number;           // Y coordinate (0-100% of viewport)
    activity?: 'typing' | 'clicking' | 'dragging' | 'idle';
    timestamp?: number;
  }
  
  // Cursor state
  export interface CursorState {
    userId: string;
    userName: string;
    userAvatar: string;
    x: number;
    y: number;
    activity: 'typing' | 'clicking' | 'dragging' | 'idle';
    lastSeen: number;
    mode: 'ghost' | 'team' | 'focus';  // Visibility mode
  }
  
  @Injectable()
  @WebSocketGateway({
    namespace: '/cursors',
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:54693',
      credentials: true,
    },
    // Optimize for real-time cursor updates
    transports: ['websocket', 'polling'],
    pingInterval: 10000,    // Ping every 10s
    pingTimeout: 5000,      // Timeout after 5s
  })
  export class CursorGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    // In-memory cursor state for ultra-low latency
    // Structure: Map<projectId, Map<userId, CursorState>>
    private cursors = new Map<string, Map<string, CursorState>>();
  
    // Throttle map to prevent spam (max 30 updates/sec per user)
    private throttleMap = new Map<string, number>();
    private readonly THROTTLE_MS = 33; // ~30fps
  
    constructor(
      private readonly cursorService: CursorService,
      private readonly presenceService: PresenceService,
    ) {}
  
    // ============================================
    // CONNECTION MANAGEMENT
    // ============================================
  
    async handleConnection(@ConnectedSocket() client: Socket) {
      try {
        // Extract user from JWT token (set by WsJwtGuard)
        const user = (client as any).user;
        
        if (!user?.id) {
          console.log('❌ Cursor connection rejected: No user');
          client.disconnect();
          return;
        }
  
        console.log(`✅ Cursor connected: ${user.id}`);
  
        // Mark user as online
        await this.presenceService.setOnline(user.id, client.id);
  
        // Send welcome message with current session info
        client.emit('cursor:connected', {
          userId: user.id,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Cursor connection error:', error);
        client.disconnect();
      }
    }
  
    async handleDisconnect(@ConnectedSocket() client: Socket) {
      try {
        const user = (client as any).user;
        
        if (!user?.id) return;
  
        console.log(`👋 Cursor disconnected: ${user.id}`);
  
        // Mark user as offline
        await this.presenceService.setOffline(user.id);
  
        // Remove cursor from all projects
        this.cursors.forEach((projectCursors, projectId) => {
          if (projectCursors.has(user.id)) {
            projectCursors.delete(user.id);
            
            // Broadcast removal to project room
            this.server.to(`project:${projectId}`).emit('cursor:removed', {
              userId: user.id,
              timestamp: Date.now(),
            });
          }
        });
  
        // Clean up throttle map
        this.throttleMap.delete(user.id);
  
      } catch (error) {
        console.error('Cursor disconnect error:', error);
      }
    }
  
    // ============================================
    // JOIN / LEAVE PROJECT ROOMS
    // ============================================
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('cursor:join')
    async handleJoinProject(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { projectId: string },
    ) {
      try {
        const user = (client as any).user;
        const { projectId } = data;
  
        // Join Socket.IO room for this project
        await client.join(`project:${projectId}`);
  
        // Initialize project cursor map if needed
        if (!this.cursors.has(projectId)) {
          this.cursors.set(projectId, new Map());
        }
  
        const projectCursors = this.cursors.get(projectId)!;
  
        // Get user details from presence service
        const userPresence = await this.presenceService.getPresence(user.id);
  
        // Add user's cursor to project
        projectCursors.set(user.id, {
          userId: user.id,
          userName: userPresence?.name || 'Anonymous',
          userAvatar: userPresence?.avatar || '',
          x: 50,  // Start in center
          y: 50,
          activity: 'idle',
          lastSeen: Date.now(),
          mode: userPresence?.mode || 'team',
        });
  
        // Send current cursors in project to joining user
        const currentCursors = Array.from(projectCursors.values())
          .filter(c => c.userId !== user.id); // Don't send user's own cursor
  
        client.emit('cursor:state', {
          projectId,
          cursors: currentCursors,
        });
  
        // Broadcast new cursor to others in project
        client.to(`project:${projectId}`).emit('cursor:joined', {
          projectId,
          cursor: projectCursors.get(user.id),
        });
  
        console.log(`🎯 ${user.id} joined project ${projectId} cursors`);
  
      } catch (error) {
        console.error('Join project error:', error);
        client.emit('cursor:error', { message: 'Failed to join project' });
      }
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('cursor:leave')
    async handleLeaveProject(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { projectId: string },
    ) {
      try {
        const user = (client as any).user;
        const { projectId } = data;
  
        // Leave Socket.IO room
        await client.leave(`project:${projectId}`);
  
        // Remove cursor from project
        const projectCursors = this.cursors.get(projectId);
        if (projectCursors) {
          projectCursors.delete(user.id);
  
          // Broadcast removal
          this.server.to(`project:${projectId}`).emit('cursor:removed', {
            userId: user.id,
            projectId,
            timestamp: Date.now(),
          });
        }
  
        console.log(`👋 ${user.id} left project ${projectId} cursors`);
  
      } catch (error) {
        console.error('Leave project error:', error);
      }
    }
  
    // ============================================
    // CURSOR POSITION UPDATES (THE MAGIC!)
    // ============================================
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('cursor:move')
    async handleCursorMove(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: CursorUpdateDto,
    ) {
      try {
        const user = (client as any).user;
        const { projectId, x, y, activity = 'idle' } = data;
  
        // Throttle updates to 30fps per user
        const now = Date.now();
        const lastUpdate = this.throttleMap.get(user.id) || 0;
        
        if (now - lastUpdate < this.THROTTLE_MS) {
          return; // Drop update (too fast)
        }
  
        this.throttleMap.set(user.id, now);
  
        // Validate coordinates (0-100%)
        const validX = Math.max(0, Math.min(100, x));
        const validY = Math.max(0, Math.min(100, y));
  
        // Update cursor state in memory
        const projectCursors = this.cursors.get(projectId);
        if (!projectCursors) return;
  
        const cursor = projectCursors.get(user.id);
        if (!cursor) return;
  
        cursor.x = validX;
        cursor.y = validY;
        cursor.activity = activity;
        cursor.lastSeen = now;
  
        // Broadcast to all others in project (NOT to sender)
        client.to(`project:${projectId}`).emit('cursor:update', {
          userId: user.id,
          x: validX,
          y: validY,
          activity,
          timestamp: now,
        });
  
        // Optional: Persist cursor position to DB every 5 seconds for heatmaps
        // (We'll implement this in cursor.service.ts later)
  
      } catch (error) {
        console.error('Cursor move error:', error);
      }
    }
  
    // ============================================
    // ACTIVITY FLASHES (Muzzle Flash Effect!)
    // ============================================
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('cursor:flash')
    async handleCursorFlash(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {
        projectId: string;
        type: 'typing' | 'clicking' | 'dragging' | 'ship';
      },
    ) {
      try {
        const user = (client as any).user;
        const { projectId, type } = data;
  
        // Broadcast flash to all in project (including sender for feedback)
        this.server.to(`project:${projectId}`).emit('cursor:flash', {
          userId: user.id,
          type,
          timestamp: Date.now(),
        });
  
        // Special handling for 'ship' - this is the GOLD FLASH moment
        if (type === 'ship') {
          this.server.to(`project:${projectId}`).emit('cursor:ship-flash', {
            userId: user.id,
            timestamp: Date.now(),
          });
        }
  
      } catch (error) {
        console.error('Cursor flash error:', error);
      }
    }
  
    // ============================================
    // FOCUS TOGETHER (Click to Follow)
    // ============================================
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('cursor:focus-together')
    async handleFocusTogether(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {
        projectId: string;
        targetUserId: string;
      },
    ) {
      try {
        const user = (client as any).user;
        const { projectId, targetUserId } = data;
  
        // Get target user's current cursor position
        const projectCursors = this.cursors.get(projectId);
        const targetCursor = projectCursors?.get(targetUserId);
  
        if (!targetCursor) {
          client.emit('cursor:error', { message: 'User not found' });
          return;
        }
  
        // Send target position to requester
        client.emit('cursor:focus-target', {
          userId: targetUserId,
          x: targetCursor.x,
          y: targetCursor.y,
          timestamp: Date.now(),
        });
  
        // Notify target that someone is focusing on them
        this.server.to(`project:${projectId}`).emit('cursor:being-watched', {
          watcherId: user.id,
          watchedId: targetUserId,
          timestamp: Date.now(),
        });
  
        console.log(`👀 ${user.id} is focusing on ${targetUserId}`);
  
      } catch (error) {
        console.error('Focus together error:', error);
      }
    }
  
    // ============================================
    // SYNC PULSE (Two cursors near each other)
    // ============================================
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('cursor:proximity')
    async handleCursorProximity(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {
        projectId: string;
        nearUserId: string;
      },
    ) {
      try {
        const user = (client as any).user;
        const { projectId, nearUserId } = data;
  
        // Trigger sync pulse for both users
        this.server.to(`project:${projectId}`).emit('cursor:sync-pulse', {
          user1: user.id,
          user2: nearUserId,
          timestamp: Date.now(),
        });
  
        // Optional: Haptic feedback trigger
        client.emit('cursor:haptic', { intensity: 'light' });
  
        console.log(`💓 Sync pulse: ${user.id} <-> ${nearUserId}`);
  
      } catch (error) {
        console.error('Proximity error:', error);
      }
    }
  
    // ============================================
    // HEARTBEAT RING (Activity indicator)
    // ============================================
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('cursor:heartbeat')
    async handleHeartbeat(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { projectId: string },
    ) {
      try {
        const user = (client as any).user;
        const { projectId } = data;
  
        // Broadcast heartbeat to project
        this.server.to(`project:${projectId}`).emit('cursor:heartbeat', {
          userId: user.id,
          timestamp: Date.now(),
        });
  
        // Update last activity in presence service
        await this.presenceService.recordActivity(user.id);
  
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }
  
    // ============================================
    // UTILITY METHODS
    // ============================================
  
    /**
     * Get all active cursors in a project
     */
    getProjectCursors(projectId: string): CursorState[] {
      const projectCursors = this.cursors.get(projectId);
      if (!projectCursors) return [];
      return Array.from(projectCursors.values());
    }
  
    /**
     * Clean up stale cursors (no activity for 30+ seconds)
     */
    cleanupStaleCursors() {
      const now = Date.now();
      const STALE_THRESHOLD = 30000; // 30 seconds
  
      this.cursors.forEach((projectCursors, projectId) => {
        projectCursors.forEach((cursor, userId) => {
          if (now - cursor.lastSeen > STALE_THRESHOLD) {
            projectCursors.delete(userId);
            
            // Broadcast removal
            this.server.to(`project:${projectId}`).emit('cursor:removed', {
              userId,
              reason: 'stale',
              timestamp: now,
            });
          }
        });
      });
    }
  }