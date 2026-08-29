/**
 * useCursor.js
 * Custom hook for tracking cursor position and activity
 * 
 * NOW WITH:
 * - Spatial index for O(1) proximity detection
 * - Smart throttling
 * - Zustand integration
 * - Performance optimizations
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useCursorContext } from '../context/CursorContext';
import { throttleFPS } from '../utils/cursorThrottle';

export function useCursor(options = {}) {
  const {
    enabled = true,
    detectActivity = true,
    detectProximity = true,
    proximityThreshold = 50,
  } = options;

  const {
    updateCursorPosition,
    sendFlash,
    sendProximity,
    cursorsMap,
    isConnected,
    spatialIndex, // ⭐ NEW: Spatial index from context
  } = useCursorContext();

  // Local cursor position (viewport %)
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [activity, setActivity] = useState('idle');

  // Drag state
  const isDragging = useRef(false);
  
  // Typing timeout
  const typingTimeoutRef = useRef(null);

  // ============================================
  // ⭐ OPTIMIZED PROXIMITY DETECTION
  // ============================================

  // Throttled proximity check using spatial index
  const checkProximity = useRef(
    throttleFPS((mouseX, mouseY) => {
      if (!spatialIndex) return;

      // Convert pixels to viewport %
      const x = (mouseX / window.innerWidth) * 100;
      const y = (mouseY / window.innerHeight) * 100;

      // ⭐ USE SPATIAL INDEX: O(1) lookup instead of O(n)
      const nearby = spatialIndex.findNearby(x, y, proximityThreshold);

      nearby.forEach(({ cursor, distance }) => {
        console.log(`💓 Near ${cursor.userName || cursor.userId} (${Math.round(distance)}px)`);
        sendProximity(cursor.id);
      });
    }, 1) // Check once per second
  ).current;

  // ============================================
  // MOUSE POSITION TRACKING
  // ============================================

  const handleMouseMove = useCallback((event) => {
    if (!enabled || !isConnected) return;

    // Calculate position as percentage of viewport
    const x = (event.clientX / window.innerWidth) * 100;
    const y = (event.clientY / window.innerHeight) * 100;

    // Update local state
    setPosition({ x, y });

    // Determine activity
    let currentActivity = 'idle';
    if (isDragging.current) {
      currentActivity = 'dragging';
    }

    // ⭐ THROTTLED UPDATE (handled in CursorContext)
    updateCursorPosition(x, y, currentActivity);

    // ⭐ PROXIMITY CHECK (using spatial index)
    if (detectProximity) {
      checkProximity(event.clientX, event.clientY);
    }
  }, [enabled, isConnected, updateCursorPosition, detectProximity, checkProximity]);

  // ============================================
  // ACTIVITY DETECTION
  // ============================================

  const handleMouseDown = useCallback(() => {
    if (!enabled || !detectActivity) return;

    setActivity('clicking');
    sendFlash('clicking');
    isDragging.current = true;
  }, [enabled, detectActivity, sendFlash]);

  const handleMouseUp = useCallback(() => {
    if (!enabled || !detectActivity) return;

    isDragging.current = false;
    setActivity('idle');
  }, [enabled, detectActivity]);

  const handleKeyDown = useCallback((event) => {
    if (!enabled || !detectActivity) return;

    // Ignore modifier keys
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    
    // Ignore if typing in input/textarea (handled by component)
    const tag = event.target?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    setActivity('typing');
    sendFlash('typing');

    // Reset to idle after 500ms of no typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setActivity('idle');
    }, 500);
  }, [enabled, detectActivity, sendFlash]);

  // ============================================
  // EVENT LISTENERS
  // ============================================

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [enabled, handleMouseMove, handleMouseDown, handleMouseUp, handleKeyDown]);

  // ============================================
  // RETURN VALUE
  // ============================================

  return {
    position,
    activity,
    isTracking: enabled && isConnected,
  };
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

/**
 * Hook for tracking cursor within a specific element
 */
export function useElementCursor(elementRef, options = {}) {
  const { updateCursorPosition, isConnected } = useCursorContext();
  const [relativePosition, setRelativePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((event) => {
    if (!elementRef.current || !isConnected) return;

    const rect = elementRef.current.getBoundingClientRect();

    // Position relative to element (0-100%)
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Clamp to bounds
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setRelativePosition({ x: clampedX, y: clampedY });

    // Convert to viewport % for server
    const viewportX = (event.clientX / window.innerWidth) * 100;
    const viewportY = (event.clientY / window.innerHeight) * 100;
    
    updateCursorPosition(viewportX, viewportY);
  }, [elementRef, isConnected, updateCursorPosition]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => element.removeEventListener('mousemove', handleMouseMove);
  }, [elementRef, handleMouseMove]);

  return {
    position: relativePosition,
    isTracking: isConnected,
  };
}

/**
 * Hook for sending cursor flashes
 */
export function useCursorFlash() {
  const { sendFlash } = useCursorContext();

  const flash = useCallback((type = 'clicking') => {
    sendFlash(type);
  }, [sendFlash]);

  return {
    flash,
    flashTyping: useCallback(() => flash('typing'), [flash]),
    flashClicking: useCallback(() => flash('clicking'), [flash]),
    flashDragging: useCallback(() => flash('dragging'), [flash]),
    flashShip: useCallback(() => flash('ship'), [flash]),
  };
}

/**
 * Hook for focus together (follow someone)
 */
export function useFocusTogether() {
  const { focusTogether, cursorsMap } = useCursorContext();

  const focusOnUser = useCallback((userId) => {
    const cursor = cursorsMap.get(userId);
    
    if (!cursor) {
      console.warn('Cannot focus on user: not found');
      return;
    }

    console.log(`👀 Focusing on ${cursor.userName}`);
    focusTogether(userId);
  }, [focusTogether, cursorsMap]);

  return { focusOnUser };
}

/**
 * ⭐ NEW: Hook for advanced proximity detection
 */
export function useProximityDetection(options = {}) {
  const {
    threshold = 50,
    interval = 1000,
    onProximity = () => {},
  } = options;

  const { spatialIndex, cursorsMap } = useCursorContext();
  const [nearbyUsers, setNearbyUsers] = useState([]);

  useEffect(() => {
    if (!spatialIndex) return;

    const checkInterval = setInterval(() => {
      const allCursors = Array.from(cursorsMap.values());
      const nearby = [];

      allCursors.forEach((cursor) => {
        const found = spatialIndex.findNearby(
          cursor.x,
          cursor.y,
          threshold,
          cursor.userId
        );

        found.forEach(({ cursor: nearbyCursor, distance }) => {
          nearby.push({
            user1: cursor,
            user2: nearbyCursor,
            distance,
          });
          
          onProximity({
            user1: cursor,
            user2: nearbyCursor,
            distance,
          });
        });
      });

      setNearbyUsers(nearby);
    }, interval);

    return () => clearInterval(checkInterval);
  }, [spatialIndex, cursorsMap, threshold, interval, onProximity]);

  return { nearbyUsers };
}

/**
 * ⭐ NEW: Hook to get cursor stats
 */
export function useCursorStats() {
  const { cursorsMap, spatialIndex } = useCursorContext();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    idle: 0,
    typing: 0,
    clicking: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const cursors = Array.from(cursorsMap.values());
      
      const newStats = {
        total: cursors.length,
        active: cursors.filter(c => c.activity !== 'idle').length,
        idle: cursors.filter(c => c.activity === 'idle').length,
        typing: cursors.filter(c => c.activity === 'typing').length,
        clicking: cursors.filter(c => c.activity === 'clicking').length,
        spatial: spatialIndex?.getStats() || {},
      };

      setStats(newStats);
    }, 1000);

    return () => clearInterval(interval);
  }, [cursorsMap, spatialIndex]);

  return stats;
}

export default useCursor;