/**
 * cursorWorkerClient.js
 * Client wrapper for CursorWorker - Makes Web Worker easy to use
 * 
 * COPY THIS FILE TO: src/utils/cursorWorkerClient.js
 */

import React from 'react';

export class CursorWorkerClient {
  constructor() {
    this.worker = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.isReady = false;
    this.readyPromise = null;
  }

  async init(options = {}) {
    if (this.worker) {
      console.warn('[CursorWorker] Already initialized');
      return;
    }

    try {
      // Create worker
      this.worker = new Worker(
        new URL('../workers/cursorWorker.js', import.meta.url),
        { type: 'module' }
      );

      // Setup message handler
      this.worker.addEventListener('message', this.handleMessage.bind(this));

      // Setup error handler
      this.worker.addEventListener('error', (error) => {
        console.error('[CursorWorker] Error:', error);
      });

      // Wait for ready signal
      this.readyPromise = new Promise((resolve) => {
        const handler = (event) => {
          if (event.data.type === 'ready') {
            this.isReady = true;
            this.worker.removeEventListener('message', handler);
            resolve();
          }
        };
        this.worker.addEventListener('message', handler);
      });

      await this.readyPromise;

      // Send init message
      await this.send('init', {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        proximityThreshold: options.proximityThreshold || 50,
      });

      console.log('[CursorWorker] Initialized');
    } catch (error) {
      console.error('[CursorWorker] Failed to initialize:', error);
      throw error;
    }
  }

  handleMessage(event) {
    const { type, requestId, ...data } = event.data;

    if (requestId && this.pendingRequests.has(requestId)) {
      const { resolve } = this.pendingRequests.get(requestId);
      this.pendingRequests.delete(requestId);
      resolve(data);
      return;
    }

    switch (type) {
      case 'error':
        console.error('[CursorWorker] Error:', data.error);
        break;
      
      case 'initialized':
        console.log('[CursorWorker] Initialized successfully');
        break;
    }
  }

  send(type, data = {}) {
    if (!this.worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }

    const requestId = ++this.requestId;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Worker request timeout'));
        }
      }, 5000);

      this.worker.postMessage({ type, data: { ...data, requestId } });
    });
  }

  sendFire(type, data = {}) {
    if (!this.worker) return;
    this.worker.postMessage({ type, data });
  }

  updateViewport(width, height) {
    this.sendFire('updateViewport', { viewportWidth: width, viewportHeight: height });
  }

  updateCursor(cursorId, x, y) {
    this.sendFire('updateCursor', { cursorId, x, y });
  }

  removeCursor(cursorId) {
    this.sendFire('removeCursor', { cursorId });
  }

  async findNearby(x, y, radius, excludeId) {
    const result = await this.send('findNearby', { x, y, radius, excludeId });
    return result.nearby;
  }

  async checkProximity() {
    const result = await this.send('checkProximity', {});
    return result.proximities;
  }

  async interpolatePath(start, end, steps) {
    const result = await this.send('interpolatePath', { start, end, steps });
    return result.path;
  }

  async batchUpdate(updates) {
    const result = await this.send('batchUpdate', { updates });
    return result.count;
  }

  clear() {
    this.sendFire('clear');
  }

  async getStats() {
    const result = await this.send('getStats', {});
    return result.stats;
  }

  async measureLatency() {
    const start = Date.now();
    await this.send('ping', { timestamp: start });
    return Date.now() - start;
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.pendingRequests.clear();
      console.log('[CursorWorker] Terminated');
    }
  }
}

let workerInstance = null;

export async function getCursorWorker() {
  if (!workerInstance) {
    workerInstance = new CursorWorkerClient();
    await workerInstance.init();
  }
  return workerInstance;
}

export function useCursorWorker() {
  const [worker, setWorker] = React.useState(null);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    getCursorWorker().then((w) => {
      if (mounted) {
        setWorker(w);
        setIsReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { worker, isReady };
}

export default CursorWorkerClient;