/**
 * cursorWorker.js
 * Web Worker for offloading heavy cursor calculations
 * 
 * Runs in separate thread to avoid blocking main thread
 * Handles:
 * - Proximity calculations
 * - Path interpolation
 * - Collision detection
 * - Spatial indexing
 */

/* eslint-disable no-restricted-globals */

// ============================================
// SPATIAL INDEX (Worker version)
// ============================================

class WorkerSpatialIndex {
    constructor(gridSize = 50) {
      this.gridSize = gridSize;
      this.grid = new Map();
      this.cursors = new Map();
    }
  
    getCellKey(gridX, gridY) {
      return `${gridX},${gridY}`;
    }
  
    getGridCoords(x, y, viewportWidth, viewportHeight) {
      const pixelX = (x / 100) * viewportWidth;
      const pixelY = (y / 100) * viewportHeight;
      
      return {
        gridX: Math.floor(pixelX / this.gridSize),
        gridY: Math.floor(pixelY / this.gridSize),
      };
    }
  
    update(cursorId, x, y, viewportWidth, viewportHeight) {
      this.remove(cursorId);
  
      const { gridX, gridY } = this.getGridCoords(x, y, viewportWidth, viewportHeight);
      const cellKey = this.getCellKey(gridX, gridY);
  
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, new Set());
      }
      this.grid.get(cellKey).add(cursorId);
  
      this.cursors.set(cursorId, { id: cursorId, x, y, gridX, gridY });
    }
  
    remove(cursorId) {
      const cursor = this.cursors.get(cursorId);
      
      if (cursor) {
        const cellKey = this.getCellKey(cursor.gridX, cursor.gridY);
        const cell = this.grid.get(cellKey);
        
        if (cell) {
          cell.delete(cursorId);
          if (cell.size === 0) {
            this.grid.delete(cellKey);
          }
        }
        
        this.cursors.delete(cursorId);
      }
    }
  
    findNearby(x, y, radius, viewportWidth, viewportHeight, excludeId = null) {
      const { gridX, gridY } = this.getGridCoords(x, y, viewportWidth, viewportHeight);
      const pixelX = (x / 100) * viewportWidth;
      const pixelY = (y / 100) * viewportHeight;
      
      const gridRadius = Math.ceil(radius / this.gridSize);
      const nearby = [];
  
      for (let dx = -gridRadius; dx <= gridRadius; dx++) {
        for (let dy = -gridRadius; dy <= gridRadius; dy++) {
          const cellKey = this.getCellKey(gridX + dx, gridY + dy);
          const cell = this.grid.get(cellKey);
          
          if (!cell) continue;
  
          for (const cursorId of cell) {
            if (cursorId === excludeId) continue;
            
            const cursor = this.cursors.get(cursorId);
            if (!cursor) continue;
  
            const cursorPixelX = (cursor.x / 100) * viewportWidth;
            const cursorPixelY = (cursor.y / 100) * viewportHeight;
            
            const dx = pixelX - cursorPixelX;
            const dy = pixelY - cursorPixelY;
            const distance = Math.sqrt(dx * dx + dy * dy);
  
            if (distance <= radius) {
              nearby.push({ cursor, distance });
            }
          }
        }
      }
  
      return nearby.sort((a, b) => a.distance - b.distance);
    }
  
    clear() {
      this.grid.clear();
      this.cursors.clear();
    }
  }
  
  // ============================================
  // WORKER STATE
  // ============================================
  
  const state = {
    spatialIndex: new WorkerSpatialIndex(),
    viewportWidth: 1920,
    viewportHeight: 1080,
    proximityThreshold: 50,
  };
  
  // ============================================
  // MESSAGE HANDLERS
  // ============================================
  
  const handlers = {
    // Initialize worker
    init: (data) => {
      state.viewportWidth = data.viewportWidth;
      state.viewportHeight = data.viewportHeight;
      state.proximityThreshold = data.proximityThreshold || 50;
      
      postMessage({ type: 'initialized', success: true });
    },
  
    // Update viewport dimensions
    updateViewport: (data) => {
      state.viewportWidth = data.viewportWidth;
      state.viewportHeight = data.viewportHeight;
    },
  
    // Update a cursor
    updateCursor: (data) => {
      const { cursorId, x, y } = data;
      state.spatialIndex.update(
        cursorId,
        x,
        y,
        state.viewportWidth,
        state.viewportHeight
      );
    },
  
    // Remove a cursor
    removeCursor: (data) => {
      state.spatialIndex.remove(data.cursorId);
    },
  
    // Find nearby cursors
    findNearby: (data) => {
      const { x, y, radius, excludeId, requestId } = data;
      
      const nearby = state.spatialIndex.findNearby(
        x,
        y,
        radius || state.proximityThreshold,
        state.viewportWidth,
        state.viewportHeight,
        excludeId
      );
  
      postMessage({
        type: 'nearbyResult',
        requestId,
        nearby,
      });
    },
  
    // Check all cursors for proximity
    checkProximity: (data) => {
      const cursors = Array.from(state.spatialIndex.cursors.values());
      const proximities = [];
  
      for (let i = 0; i < cursors.length; i++) {
        const cursor1 = cursors[i];
        
        const nearby = state.spatialIndex.findNearby(
          cursor1.x,
          cursor1.y,
          state.proximityThreshold,
          state.viewportWidth,
          state.viewportHeight,
          cursor1.id
        );
  
        for (const { cursor: cursor2, distance } of nearby) {
          proximities.push({
            cursor1Id: cursor1.id,
            cursor2Id: cursor2.id,
            distance,
          });
        }
      }
  
      postMessage({
        type: 'proximityResult',
        requestId: data.requestId,
        proximities,
      });
    },
  
    // Calculate interpolated path between two points
    interpolatePath: (data) => {
      const { start, end, steps, requestId } = data;
      const path = [];
  
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = start.x + (end.x - start.x) * t;
        const y = start.y + (end.y - start.y) * t;
        path.push({ x, y });
      }
  
      postMessage({
        type: 'pathResult',
        requestId,
        path,
      });
    },
  
    // Batch update multiple cursors
    batchUpdate: (data) => {
      const { updates } = data;
      
      for (const update of updates) {
        state.spatialIndex.update(
          update.cursorId,
          update.x,
          update.y,
          state.viewportWidth,
          state.viewportHeight
        );
      }
  
      postMessage({
        type: 'batchUpdateComplete',
        requestId: data.requestId,
        count: updates.length,
      });
    },
  
    // Clear all cursors
    clear: () => {
      state.spatialIndex.clear();
      postMessage({ type: 'cleared' });
    },
  
    // Get statistics
    getStats: (data) => {
      const cursorCount = state.spatialIndex.cursors.size;
      const cellCount = state.spatialIndex.grid.size;
  
      postMessage({
        type: 'statsResult',
        requestId: data.requestId,
        stats: {
          cursorCount,
          cellCount,
          avgCursorsPerCell: cursorCount / (cellCount || 1),
        },
      });
    },
  };
  
  // ============================================
  // MESSAGE LISTENER
  // ============================================
  
  self.addEventListener('message', (event) => {
    const { type, data } = event.data;
  
    const handler = handlers[type];
    
    if (handler) {
      try {
        handler(data);
      } catch (error) {
        postMessage({
          type: 'error',
          error: error.message,
          requestId: data?.requestId,
        });
      }
    } else {
      postMessage({
        type: 'error',
        error: `Unknown message type: ${type}`,
      });
    }
  });
  
  // ============================================
  // PING/PONG FOR LATENCY TESTING
  // ============================================
  
  self.addEventListener('message', (event) => {
    if (event.data.type === 'ping') {
      postMessage({
        type: 'pong',
        timestamp: Date.now(),
        requestId: event.data.requestId,
      });
    }
  });
  
  // Signal ready
  postMessage({ type: 'ready' });