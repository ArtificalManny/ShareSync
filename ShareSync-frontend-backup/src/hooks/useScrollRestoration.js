// src/hooks/useScrollRestoration.js
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT PRESERVATION - Scroll Position Restoration
// ═══════════════════════════════════════════════════════════════════════════════
// Saves and restores scroll position per route.
// When user returns to a page, they're at the exact spot they left.
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'sharesync_scroll_positions';
const MAX_ROUTES = 20; // Keep scroll positions for last 20 routes
const RESTORE_DELAY = 100; // ms to wait before restoring (let DOM render)

/**
 * Load scroll positions from sessionStorage
 */
function loadScrollPositions() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * Save scroll positions to sessionStorage
 */
function saveScrollPositions(positions) {
  try {
    // Prune old entries if we have too many
    const entries = Object.entries(positions);
    if (entries.length > MAX_ROUTES) {
      // Sort by timestamp, keep most recent
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      positions = Object.fromEntries(entries.slice(0, MAX_ROUTES));
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // sessionStorage might be unavailable
  }
}

/**
 * Hook to save and restore scroll position per route
 * 
 * @param {Object} options
 * @param {boolean} options.enabled - Whether to enable scroll restoration
 * @param {string} options.scrollContainerId - ID of scroll container (if not window)
 * @param {boolean} options.restoreOnMount - Whether to restore on mount
 */
export default function useScrollRestoration({
  enabled = true,
  scrollContainerId = null,
  restoreOnMount = true,
} = {}) {
  const location = useLocation();
  const lastPathRef = useRef(location.pathname);
  const hasRestoredRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  /**
   * Get the scroll container element
   */
  const getScrollContainer = useCallback(() => {
    if (scrollContainerId) {
      return document.getElementById(scrollContainerId);
    }
    return window;
  }, [scrollContainerId]);

  /**
   * Get current scroll position
   */
  const getScrollPosition = useCallback(() => {
    const container = getScrollContainer();
    if (!container) return 0;
    
    if (container === window) {
      return window.scrollY || document.documentElement.scrollTop;
    }
    return container.scrollTop;
  }, [getScrollContainer]);

  /**
   * Set scroll position
   */
  const setScrollPosition = useCallback((position, smooth = false) => {
    const container = getScrollContainer();
    if (!container) return;
    
    const options = smooth ? { behavior: 'smooth' } : { behavior: 'instant' };
    
    if (container === window) {
      window.scrollTo({ top: position, ...options });
    } else {
      container.scrollTo({ top: position, ...options });
    }
  }, [getScrollContainer]);

  /**
   * Save current scroll position for a route
   */
  const savePosition = useCallback((route = location.pathname) => {
    if (!enabled) return;
    
    const position = getScrollPosition();
    const positions = loadScrollPositions();
    
    positions[route] = {
      scrollY: position,
      timestamp: Date.now(),
    };
    
    saveScrollPositions(positions);
  }, [enabled, location.pathname, getScrollPosition]);

  /**
   * Restore scroll position for a route
   */
  const restorePosition = useCallback((route = location.pathname, smooth = false) => {
    if (!enabled) return false;
    
    const positions = loadScrollPositions();
    const saved = positions[route];
    
    if (saved && typeof saved.scrollY === 'number') {
      // Small delay to let DOM render
      setTimeout(() => {
        setScrollPosition(saved.scrollY, smooth);
      }, RESTORE_DELAY);
      return true;
    }
    
    return false;
  }, [enabled, location.pathname, setScrollPosition]);

  /**
   * Get saved position for a route (without restoring)
   */
  const getSavedPosition = useCallback((route = location.pathname) => {
    const positions = loadScrollPositions();
    return positions[route]?.scrollY || 0;
  }, [location.pathname]);

  /**
   * Clear saved position for a route
   */
  const clearPosition = useCallback((route = location.pathname) => {
    const positions = loadScrollPositions();
    delete positions[route];
    saveScrollPositions(positions);
  }, [location.pathname]);

  /**
   * Clear all saved positions
   */
  const clearAll = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  // Save position on scroll (debounced)
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      // Debounce saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        savePosition();
      }, 200);
    };

    const container = getScrollContainer();
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled, getScrollContainer, savePosition]);

  // Save position when leaving route, restore when entering
  useEffect(() => {
    if (!enabled) return;

    const currentPath = location.pathname;
    const previousPath = lastPathRef.current;

    // Route changed
    if (currentPath !== previousPath) {
      // Save position for previous route (already saved via scroll handler, but ensure it)
      // Note: This is a backup, main saving happens on scroll
      
      // Restore position for new route
      if (restoreOnMount) {
        restorePosition(currentPath);
      }
      
      lastPathRef.current = currentPath;
    }
  }, [enabled, location.pathname, restoreOnMount, restorePosition]);

  // Restore on initial mount
  useEffect(() => {
    if (!enabled || !restoreOnMount || hasRestoredRef.current) return;
    
    hasRestoredRef.current = true;
    restorePosition();
  }, [enabled, restoreOnMount, restorePosition]);

  // Save before page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      savePosition();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, savePosition]);

  return {
    // Actions
    savePosition,
    restorePosition,
    clearPosition,
    clearAll,
    
    // Queries
    getSavedPosition,
    getScrollPosition,
    setScrollPosition,
  };
}
