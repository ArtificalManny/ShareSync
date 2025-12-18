// src/services/socket.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.currentProjectId = null;
  }

  /**
   * Initialize socket connection
   */
  connect() {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return;
    }

    const token = localStorage.getItem('ss.token');
    
    this.socket = io('http://localhost:3000', { // ← CHANGED FROM 5000 TO 3000
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('[Socket] Error:', error);
    });
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Join a project room
   */
  joinProject(projectId, userId) {
    if (!this.socket) {
      console.error('[Socket] Not connected');
      return;
    }

    console.log(`[Socket] Joining project: ${projectId}`);
    this.currentProjectId = projectId;
    this.socket.emit('join:project', { projectId, userId });
  }

  /**
   * Leave a project room
   */
  leaveProject(projectId, userId) {
    if (!this.socket) return;

    console.log(`[Socket] Leaving project: ${projectId}`);
    this.socket.emit('leave:project', { projectId, userId });
    this.currentProjectId = null;
  }

  /**
   * Listen for new messages
   */
  onNewMessage(callback) {
    if (!this.socket) return;
    this.socket.on('message:new', callback);
  }

  /**
   * Listen for message updates
   */
  onMessageUpdated(callback) {
    if (!this.socket) return;
    this.socket.on('message:updated', callback);
  }

  /**
   * Listen for message deletions
   */
  onMessageDeleted(callback) {
    if (!this.socket) return;
    this.socket.on('message:deleted', callback);
  }

  /**
   * Listen for reactions added
   */
  onReactionAdded(callback) {
    if (!this.socket) return;
    this.socket.on('reaction:added', callback);
  }

  /**
   * Listen for reactions removed
   */
  onReactionRemoved(callback) {
    if (!this.socket) return;
    this.socket.on('reaction:removed', callback);
  }

  /**
   * Listen for message resolved
   */
  onMessageResolved(callback) {
    if (!this.socket) return;
    this.socket.on('message:resolved', callback);
  }

  /**
   * Listen for typing indicators
   */
  onTypingStart(callback) {
    if (!this.socket) return;
    this.socket.on('typing:start', callback);
  }

  onTypingStop(callback) {
    if (!this.socket) return;
    this.socket.on('typing:stop', callback);
  }

  /**
   * Emit typing start
   */
  emitTypingStart(projectId, userId, userName) {
    if (!this.socket) return;
    this.socket.emit('typing:start', { projectId, userId, userName });
  }

  /**
   * Emit typing stop
   */
  emitTypingStop(projectId, userId) {
    if (!this.socket) return;
    this.socket.emit('typing:stop', { projectId, userId });
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    if (!this.socket) return;
    this.socket.removeAllListeners();
  }
}

// Export singleton instance
export default new SocketService();
