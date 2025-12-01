/**
 * cursorThrottle.js
 * Throttle cursor updates to exactly 30fps (33.33ms intervals)
 * 
 * Why 30fps:
 * - Smooth enough to feel real-time
 * - Low enough to save bandwidth
 * - Standard for multiplayer games
 * - Reduces server load by 50% vs 60fps
 */

/**
 * Throttle function that ensures exactly 30fps update rate
 * 
 * @param {Function} callback - Function to throttle
 * @param {number} fps - Target frame rate (default: 30)
 * @returns {Function} Throttled function
 */
export function throttleFPS(callback, fps = 30) {
    const delay = 1000 / fps; // 33.33ms for 30fps
    let lastCall = 0;
    let timeoutId = null;
  
    return function throttled(...args) {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;
  
      // If enough time has passed, call immediately
      if (timeSinceLastCall >= delay) {
        lastCall = now;
        callback.apply(this, args);
      } else {
        // Otherwise, schedule for next frame
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
  
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          callback.apply(this, args);
        }, delay - timeSinceLastCall);
      }
    };
  }
  
  /**
   * Throttle function using requestAnimationFrame
   * Better for visual updates, but less precise for network
   * 
   * @param {Function} callback - Function to throttle
   * @returns {Function} Throttled function
   */
  export function throttleRAF(callback) {
    let rafId = null;
    let lastArgs = null;
  
    return function throttled(...args) {
      lastArgs = args;
  
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          callback.apply(this, lastArgs);
          rafId = null;
        });
      }
    };
  }
  
  /**
   * Advanced throttle with adaptive FPS
   * Reduces FPS when CPU is busy, increases when idle
   * 
   * @param {Function} callback - Function to throttle
   * @param {Object} options - Configuration options
   * @returns {Function} Throttled function
   */
  export function adaptiveThrottle(callback, options = {}) {
    const {
      minFPS = 15,
      maxFPS = 60,
      targetFPS = 30,
      cpuThreshold = 0.8, // 80% CPU = reduce FPS
    } = options;
  
    let currentFPS = targetFPS;
    let lastCall = 0;
    let timeoutId = null;
    let frameCount = 0;
    let lastFPSCheck = Date.now();
  
    // Monitor performance
    const checkPerformance = () => {
      const now = Date.now();
      const elapsed = now - lastFPSCheck;
  
      if (elapsed >= 1000) {
        const actualFPS = (frameCount / elapsed) * 1000;
        frameCount = 0;
        lastFPSCheck = now;
  
        // Adjust FPS based on performance
        if (actualFPS < currentFPS * 0.8) {
          // Struggling to maintain FPS, reduce target
          currentFPS = Math.max(minFPS, currentFPS - 5);
          console.log(`[Cursor] Reducing FPS to ${currentFPS}`);
        } else if (actualFPS > currentFPS * 0.95 && currentFPS < maxFPS) {
          // Doing well, try to increase
          currentFPS = Math.min(maxFPS, currentFPS + 5);
          console.log(`[Cursor] Increasing FPS to ${currentFPS}`);
        }
      }
    };
  
    return function throttled(...args) {
      const delay = 1000 / currentFPS;
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;
  
      if (timeSinceLastCall >= delay) {
        lastCall = now;
        frameCount++;
        callback.apply(this, args);
        checkPerformance();
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
  
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          frameCount++;
          callback.apply(this, args);
          checkPerformance();
        }, delay - timeSinceLastCall);
      }
    };
  }
  
  /**
   * Batch multiple cursor updates into a single network call
   * Useful for sending updates from multiple users at once
   * 
   * @param {Function} callback - Function to call with batched updates
   * @param {number} batchDelay - Time to wait before sending batch (ms)
   * @returns {Function} Batched function
   */
  export function batchCursorUpdates(callback, batchDelay = 100) {
    let batch = [];
    let timeoutId = null;
  
    const flush = () => {
      if (batch.length > 0) {
        callback(batch);
        batch = [];
      }
      timeoutId = null;
    };
  
    return function batched(update) {
      batch.push(update);
  
      if (!timeoutId) {
        timeoutId = setTimeout(flush, batchDelay);
      }
    };
  }
  
  /**
   * Debounce function for less frequent updates
   * Good for idle detection, settings saves, etc.
   * 
   * @param {Function} callback - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  export function debounce(callback, delay = 300) {
    let timeoutId = null;
  
    return function debounced(...args) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
  
      timeoutId = setTimeout(() => {
        callback.apply(this, args);
      }, delay);
    };
  }
  
  /**
   * Rate limiter that prevents excessive calls
   * Hard limit on call frequency
   * 
   * @param {Function} callback - Function to rate limit
   * @param {number} maxCalls - Max calls allowed per interval
   * @param {number} interval - Time interval in ms
   * @returns {Function} Rate-limited function
   */
  export function rateLimit(callback, maxCalls = 30, interval = 1000) {
    const calls = [];
  
    return function rateLimited(...args) {
      const now = Date.now();
  
      // Remove old calls outside the interval
      while (calls.length > 0 && calls[0] < now - interval) {
        calls.shift();
      }
  
      // Check if under limit
      if (calls.length < maxCalls) {
        calls.push(now);
        callback.apply(this, args);
      } else {
        console.warn('[Cursor] Rate limit exceeded, dropping update');
      }
    };
  }
  
  /**
   * Smart throttle that combines FPS throttle with deduplication
   * Prevents redundant updates when cursor hasn't moved significantly
   * 
   * @param {Function} callback - Function to throttle
   * @param {Object} options - Configuration
   * @returns {Function} Smart throttled function
   */
  export function smartThrottle(callback, options = {}) {
    const {
      fps = 30,
      minDistance = 1, // Minimum movement in % of viewport
      minTimeGap = 33, // Minimum time between updates (ms)
    } = options;
  
    const delay = 1000 / fps;
    let lastCall = 0;
    let lastPosition = { x: 0, y: 0 };
    let timeoutId = null;
  
    return function throttled(position, ...args) {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;
  
      // Calculate distance moved
      const dx = Math.abs(position.x - lastPosition.x);
      const dy = Math.abs(position.y - lastPosition.y);
      const distance = Math.sqrt(dx * dx + dy * dy);
  
      // Only update if moved enough AND enough time passed
      if (distance >= minDistance && timeSinceLastCall >= minTimeGap) {
        lastCall = now;
        lastPosition = { x: position.x, y: position.y };
        callback.apply(this, [position, ...args]);
      } else if (timeSinceLastCall >= delay) {
        // Force update after delay even if small movement
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
  
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          lastPosition = { x: position.x, y: position.y };
          callback.apply(this, [position, ...args]);
        }, delay - timeSinceLastCall);
      }
    };
  }
  
  /**
   * FPS counter for monitoring performance
   * 
   * @returns {Object} FPS counter with start/stop/getFPS methods
   */
  export function createFPSCounter() {
    let frameCount = 0;
    let lastTime = Date.now();
    let fps = 0;
    let intervalId = null;
  
    return {
      start() {
        if (intervalId) return;
  
        intervalId = setInterval(() => {
          const now = Date.now();
          const delta = now - lastTime;
          fps = Math.round((frameCount / delta) * 1000);
          frameCount = 0;
          lastTime = now;
        }, 1000);
      },
  
      stop() {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      },
  
      tick() {
        frameCount++;
      },
  
      getFPS() {
        return fps;
      },
    };
  }
  
  // ============================================
  // EXPORTS
  // ============================================
  
  export default {
    throttleFPS,
    throttleRAF,
    adaptiveThrottle,
    batchCursorUpdates,
    debounce,
    rateLimit,
    smartThrottle,
    createFPSCounter,
  };