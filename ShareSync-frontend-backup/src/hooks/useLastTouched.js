// src/hooks/useLastTouched.js
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT PRESERVATION - Last Touched Tracker
// ═══════════════════════════════════════════════════════════════════════════════
// Tracks which items (tasks, projects, cards) the user recently interacted with.
// Used to show "You were here" highlights and "Edited X ago" badges.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'sharesync_last_touched';
const MAX_ITEMS = 50; // Keep track of last 50 touched items
const HIGHLIGHT_DURATION = 5000; // How long "you were here" highlight shows (ms)

/**
 * Get relative time string (e.g., "2h ago", "just now")
 */
function getRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

/**
 * Load touched items from localStorage
 */
function loadTouchedItems() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * Save touched items to localStorage
 */
function saveTouchedItems(items) {
  try {
    // Prune old items if we have too many
    const entries = Object.entries(items);
    if (entries.length > MAX_ITEMS) {
      // Sort by timestamp, keep most recent
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      items = Object.fromEntries(entries.slice(0, MAX_ITEMS));
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage might be unavailable
  }
}

/**
 * Hook to track and query last touched items
 */
export default function useLastTouched() {
  const [touchedItems, setTouchedItems] = useState(() => loadTouchedItems());
  const [highlightedId, setHighlightedId] = useState(null);
  const highlightTimeoutRef = useRef(null);

  // Save to localStorage when items change
  useEffect(() => {
    saveTouchedItems(touchedItems);
  }, [touchedItems]);

  /**
   * Mark an item as touched (user interacted with it)
   */
  const touch = useCallback((itemId, metadata = {}) => {
    if (!itemId) return;
    
    setTouchedItems(prev => ({
      ...prev,
      [itemId]: {
        timestamp: Date.now(),
        type: metadata.type || 'unknown', // 'task', 'project', 'card'
        title: metadata.title || '',
        route: metadata.route || window.location.pathname,
        scrollY: window.scrollY,
        ...metadata,
      },
    }));
  }, []);

  /**
   * Get touch info for an item
   */
  const getTouchInfo = useCallback((itemId) => {
    const item = touchedItems[itemId];
    if (!item) return null;
    
    return {
      ...item,
      relativeTime: getRelativeTime(item.timestamp),
      isRecent: Date.now() - item.timestamp < 24 * 60 * 60 * 1000, // Within 24h
      isVeryRecent: Date.now() - item.timestamp < 60 * 60 * 1000, // Within 1h
    };
  }, [touchedItems]);

  /**
   * Check if an item was touched recently
   */
  const wasTouchedRecently = useCallback((itemId, withinMs = 24 * 60 * 60 * 1000) => {
    const item = touchedItems[itemId];
    if (!item) return false;
    return Date.now() - item.timestamp < withinMs;
  }, [touchedItems]);

  /**
   * Get the most recently touched item (for "you were here" on return)
   */
  const getMostRecentItem = useCallback(() => {
    const entries = Object.entries(touchedItems);
    if (entries.length === 0) return null;
    
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    const [id, data] = entries[0];
    
    return {
      id,
      ...data,
      relativeTime: getRelativeTime(data.timestamp),
    };
  }, [touchedItems]);

  /**
   * Get items touched on current route
   */
  const getItemsOnCurrentRoute = useCallback(() => {
    const currentRoute = window.location.pathname;
    return Object.entries(touchedItems)
      .filter(([_, data]) => data.route === currentRoute)
      .map(([id, data]) => ({
        id,
        ...data,
        relativeTime: getRelativeTime(data.timestamp),
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [touchedItems]);

  /**
   * Highlight an item temporarily (for "you were here" effect)
   */
  const highlightItem = useCallback((itemId, duration = HIGHLIGHT_DURATION) => {
    // Clear any existing timeout
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    
    setHighlightedId(itemId);
    
    // Clear highlight after duration
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedId(null);
    }, duration);
  }, []);

  /**
   * Check if an item is currently highlighted
   */
  const isHighlighted = useCallback((itemId) => {
    return highlightedId === itemId;
  }, [highlightedId]);

  /**
   * Clear all touched items
   */
  const clearAll = useCallback(() => {
    setTouchedItems({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Actions
    touch,
    highlightItem,
    clearAll,
    
    // Queries
    getTouchInfo,
    wasTouchedRecently,
    getMostRecentItem,
    getItemsOnCurrentRoute,
    isHighlighted,
    
    // State
    highlightedId,
    touchedItems,
  };
}

// Export utility function for use outside React
export { getRelativeTime };
