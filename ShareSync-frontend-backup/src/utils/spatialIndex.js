/**
 * spatialIndex.js
 * Spatial indexing for efficient cursor proximity detection
 * 
 * Uses a grid-based spatial hash to find nearby cursors in O(1) time
 * instead of O(n²) brute force checking
 * 
 * Example:
 * - 100 cursors, brute force = 10,000 comparisons
 * - 100 cursors, spatial hash = ~400 comparisons (4x4 grid check)
 */

/**
 * SpatialIndex class for cursor proximity detection
 */
export class SpatialIndex {
    constructor(options = {}) {
      this.gridSize = options.gridSize || 50; // Grid cell size in pixels
      this.grid = new Map(); // Map of cellKey -> Set of cursorIds
      this.cursors = new Map(); // Map of cursorId -> cursor data
      
      // Cache for viewport dimensions
      this.viewportWidth = window.innerWidth;
      this.viewportHeight = window.innerHeight;
  
      // Listen for window resize
      this._resizeHandler = () => {
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
        this.rebuild();
      };
      
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', this._resizeHandler);
      }
    }
  
    /**
     * Convert grid position to cell key
     */
    getCellKey(gridX, gridY) {
      return `${gridX},${gridY}`;
    }
  
    /**
     * Get grid coordinates from cursor position (in viewport %)
     */
    getGridCoords(x, y) {
      const pixelX = (x / 100) * this.viewportWidth;
      const pixelY = (y / 100) * this.viewportHeight;
      
      return {
        gridX: Math.floor(pixelX / this.gridSize),
        gridY: Math.floor(pixelY / this.gridSize),
      };
    }
  
    /**
     * Add or update a cursor in the spatial index
     */
    update(cursorId, x, y, additionalData = {}) {
      // Remove old position if exists
      this.remove(cursorId);
  
      // Get grid coordinates
      const { gridX, gridY } = this.getGridCoords(x, y);
      const cellKey = this.getCellKey(gridX, gridY);
  
      // Add to grid
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, new Set());
      }
      this.grid.get(cellKey).add(cursorId);
  
      // Store cursor data
      this.cursors.set(cursorId, {
        id: cursorId,
        x,
        y,
        gridX,
        gridY,
        ...additionalData,
      });
    }
  
    /**
     * Remove a cursor from the spatial index
     */
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
  
    /**
     * Find cursors within a radius (in pixels)
     */
    findNearby(x, y, radius, excludeId = null) {
      const { gridX, gridY } = this.getGridCoords(x, y);
      const pixelX = (x / 100) * this.viewportWidth;
      const pixelY = (y / 100) * this.viewportHeight;
      
      // Calculate grid radius
      const gridRadius = Math.ceil(radius / this.gridSize);
      
      const nearby = [];
  
      // Check surrounding cells
      for (let dx = -gridRadius; dx <= gridRadius; dx++) {
        for (let dy = -gridRadius; dy <= gridRadius; dy++) {
          const cellKey = this.getCellKey(gridX + dx, gridY + dy);
          const cell = this.grid.get(cellKey);
          
          if (!cell) continue;
  
          // Check each cursor in this cell
          for (const cursorId of cell) {
            if (cursorId === excludeId) continue;
            
            const cursor = this.cursors.get(cursorId);
            if (!cursor) continue;
  
            // Calculate actual distance in pixels
            const cursorPixelX = (cursor.x / 100) * this.viewportWidth;
            const cursorPixelY = (cursor.y / 100) * this.viewportHeight;
            
            const dx = pixelX - cursorPixelX;
            const dy = pixelY - cursorPixelY;
            const distance = Math.sqrt(dx * dx + dy * dy);
  
            if (distance <= radius) {
              nearby.push({
                cursor,
                distance,
              });
            }
          }
        }
      }
  
      // Sort by distance
      nearby.sort((a, b) => a.distance - b.distance);
  
      return nearby;
    }
  
    /**
     * Find closest cursor to a point
     */
    findClosest(x, y, maxRadius = Infinity, excludeId = null) {
      const nearby = this.findNearby(x, y, maxRadius, excludeId);
      return nearby.length > 0 ? nearby[0] : null;
    }
  
    /**
     * Check if two cursors are within range
     */
    areNearby(cursorId1, cursorId2, radius) {
      const cursor1 = this.cursors.get(cursorId1);
      const cursor2 = this.cursors.get(cursorId2);
  
      if (!cursor1 || !cursor2) return false;
  
      const nearby = this.findNearby(cursor1.x, cursor1.y, radius, cursorId1);
      return nearby.some((item) => item.cursor.id === cursorId2);
    }
  
    /**
     * Get all cursors in a rectangular region
     */
    getRegion(x1, y1, x2, y2) {
      const { gridX: startX, gridY: startY } = this.getGridCoords(
        Math.min(x1, x2),
        Math.min(y1, y2)
      );
      const { gridX: endX, gridY: endY } = this.getGridCoords(
        Math.max(x1, x2),
        Math.max(y1, y2)
      );
  
      const cursors = new Set();
  
      for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
          const cellKey = this.getCellKey(x, y);
          const cell = this.grid.get(cellKey);
  
          if (cell) {
            for (const cursorId of cell) {
              cursors.add(this.cursors.get(cursorId));
            }
          }
        }
      }
  
      return Array.from(cursors).filter(Boolean);
    }
  
    /**
     * Get cursor by ID
     */
    get(cursorId) {
      return this.cursors.get(cursorId);
    }
  
    /**
     * Get all cursors
     */
    getAll() {
      return Array.from(this.cursors.values());
    }
  
    /**
     * Clear all cursors
     */
    clear() {
      this.grid.clear();
      this.cursors.clear();
    }
  
    /**
     * Rebuild index (useful after window resize)
     */
    rebuild() {
      const cursors = Array.from(this.cursors.values());
      this.clear();
      
      for (const cursor of cursors) {
        this.update(cursor.id, cursor.x, cursor.y);
      }
    }
  
    /**
     * Get statistics about the index
     */
    getStats() {
      const cellCount = this.grid.size;
      const cursorCount = this.cursors.size;
      const avgCursorsPerCell = cursorCount / (cellCount || 1);
      
      let maxCursorsInCell = 0;
      for (const cell of this.grid.values()) {
        maxCursorsInCell = Math.max(maxCursorsInCell, cell.size);
      }
  
      return {
        cursorCount,
        cellCount,
        avgCursorsPerCell: avgCursorsPerCell.toFixed(2),
        maxCursorsInCell,
        gridSize: this.gridSize,
        efficiency: ((1 - avgCursorsPerCell / cursorCount) * 100).toFixed(1) + '%',
      };
    }
  
    /**
     * Cleanup
     */
    destroy() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this._resizeHandler);
      }
      this.clear();
    }
  }
  
  /**
   * Create a proximity detector using spatial index
   * 
   * @param {Object} options - Configuration options
   * @returns {Object} Proximity detector
   */
  export function createProximityDetector(options = {}) {
    const {
      threshold = 50, // Proximity threshold in pixels
      checkInterval = 1000, // Check every second
      onProximity = () => {}, // Callback when cursors are near
    } = options;
  
    const index = new SpatialIndex({ gridSize: threshold });
    const lastProximityChecks = new Map();
    let intervalId = null;
  
    // Check all cursors for proximity
    const checkProximity = () => {
      const cursors = index.getAll();
      const now = Date.now();
  
      for (let i = 0; i < cursors.length; i++) {
        const cursor1 = cursors[i];
        
        const nearby = index.findNearby(
          cursor1.x,
          cursor1.y,
          threshold,
          cursor1.id
        );
  
        for (const { cursor: cursor2, distance } of nearby) {
          const pairKey = [cursor1.id, cursor2.id].sort().join('-');
          const lastCheck = lastProximityChecks.get(pairKey) || 0;
  
          // Throttle proximity events (max once per second per pair)
          if (now - lastCheck >= checkInterval) {
            lastProximityChecks.set(pairKey, now);
            onProximity({
              cursor1,
              cursor2,
              distance,
            });
          }
        }
      }
    };
  
    return {
      index,
  
      start() {
        if (!intervalId) {
          intervalId = setInterval(checkProximity, checkInterval);
        }
      },
  
      stop() {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      },
  
      updateCursor(cursorId, x, y, data) {
        index.update(cursorId, x, y, data);
      },
  
      removeCursor(cursorId) {
        index.remove(cursorId);
      },
  
      checkNow() {
        checkProximity();
      },
  
      destroy() {
        this.stop();
        index.destroy();
        lastProximityChecks.clear();
      },
    };
  }
  
  /**
   * Simple distance calculator
   */
  export function calculateDistance(x1, y1, x2, y2, viewportWidth, viewportHeight) {
    const pixelX1 = (x1 / 100) * viewportWidth;
    const pixelY1 = (y1 / 100) * viewportHeight;
    const pixelX2 = (x2 / 100) * viewportWidth;
    const pixelY2 = (y2 / 100) * viewportHeight;
  
    const dx = pixelX1 - pixelX2;
    const dy = pixelY1 - pixelY2;
  
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // ============================================
  // EXPORTS
  // ============================================
  
  export default {
    SpatialIndex,
    createProximityDetector,
    calculateDistance,
  };