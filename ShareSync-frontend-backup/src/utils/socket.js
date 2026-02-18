// src/utils/socket.js
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

    // ✅ match AuthContext storage key
    const token = localStorage.getItem('ss.jwt');

    // ✅ match your .env (VITE_WS_URL=http://localhost:5050)
    const wsUrl = import.meta?.env?.VITE_WS_URL || 'http://localhost:5050';

    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connect error:', error?.message || error);
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
      this.currentProjectId = null;
    }
  }

  /**
   * Join a project room (Gateway expects: 'join' + { room })
   */
  joinProject(projectId) {
    if (!this.socket) {
      console.error('[Socket] Not connected');
      return;
    }
    if (!projectId) return;

    const room = `project:${projectId}`;
    console.log(`[Socket] Joining room: ${room}`);

    this.currentProjectId = projectId;
    this.socket.emit('join', { room });
  }

  /**
   * Leave a project room (Gateway expects: 'leave' + { room })
   */
  leaveProject(projectId) {
    if (!this.socket) return;
    if (!projectId) return;

    const room = `project:${projectId}`;
    console.log(`[Socket] Leaving room: ${room}`);

    this.socket.emit('leave', { room });
    this.currentProjectId = null;
  }

  /**
   * Subscribe to task updates (Gateway emits: 'taskUpdated')
   */
  onTaskUpdated(callback) {
    if (!this.socket) return;
    this.socket.on('taskUpdated', callback);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    if (!this.socket) return;
    this.socket.removeAllListeners();
  }
}

export default new SocketService();
