/**
 * useCursor.js
 * Custom hook for tracking cursor position and activity
 * 
 * Features:
 * - Mouse position tracking (viewport %)
 * - Activity detection (typing, clicking, dragging)
 * - Automatic cursor updates to server
 * - Proximity detection
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useCursorContext } from '../context/CursorContext';

export function useCursor(options = {}) {
  const {
    enabled = true,           // Enable cursor tracking
    detectActivity = true,    // Detect typing/clicking/dragging
    detectProximity = true,   // Detect when near other cursors
    proximityThreshold = 50,  // Distance in pixels to trigger proximity
  } = options;

  const {
    updateCursorPosition,
    sendFlash,
    sendProximity,
    cursorsMap,
    isConnected,
  } = useCursorContext();

  // Local cursor position (viewport %)
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [activity, setActivity] = useState('idle');

  // Drag state
  const isDragging = useRef(false);

  // Last proximity check
  const lastProximityCheck = useRef(0);
  const PROXIMITY_CHECK_INTERVAL = 1000; // Check every second

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

    // Determine activity based on mouse buttons
    let currentActivity = 'idle';
    
    if (isDragging.current) {
      currentActivity = 'dragging';
    }

    // Send to server (throttled in CursorContext)
    updateCursorPosition(x, y, currentActivity);

    // Check proximity to other cursors
    if (detectProximity) {
      checkProximity(event.clientX, event.clientY);
    }
  }, [enabled, isConnected, updateCursorPosition, detectProximity]);

  // ============================================
  // ACTIVITY DETECTION
  // ============================================

  const handleMouseDown = useCallback((event) => {
    if (!enabled || !detectActivity) return;

    setActivity('clicking');
    sendFlash('clicking');

    // Track if dragging starts
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

    setActivity('typing');
    sendFlash('typing');

    // Reset to idle after 500ms of no typing
    clearTimeout(handleKeyDown.timeoutId);
    handleKeyDown.timeoutId = setTimeout(() => {
      setActivity('idle');
    }, 500);
  }, [enabled, detectActivity, sendFlash]);

  // ============================================
  // PROXIMITY DETECTION
  // ============================================

  const checkProximity = useCallback((mouseX, mouseY) => {
    const now = Date.now();
    
    // Throttle proximity checks
    if (now - lastProximityCheck.current < PROXIMITY_CHECK_INTERVAL) {
      return;
    }
    
    lastProximityCheck.current = now;

    // Check distance to all other cursors
    cursorsMap.forEach((cursor, userId) => {
      // Convert cursor's viewport % to pixels
      const cursorX = (cursor.x / 100) * window.innerWidth;
      const cursorY = (cursor.y / 100) * window.innerHeight;

      // Calculate distance
      const dx = mouseX - cursorX;
      const dy = mouseY - cursorY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If within threshold, trigger proximity event
      if (distance < proximityThreshold) {
        console.log(`💓 Near ${cursor.userName} (${Math.round(distance)}px)`);
        sendProximity(userId);
      }
    });
  }, [cursorsMap, proximityThreshold, sendProximity]);

  // ============================================
  // EVENT LISTENERS
  // ============================================

  useEffect(() => {
    if (!enabled) return;

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleMouseMove, handleMouseDown, handleMouseUp, handleKeyDown]);

  // ============================================
  // RETURN VALUE
  // ============================================

  return {
    position,        // Current cursor position { x, y } (viewport %)
    activity,        // Current activity: 'idle' | 'typing' | 'clicking' | 'dragging'
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
  const {
    updateCursorPosition,
    isConnected,
  } = useCursorContext();

  const [relativePosition, setRelativePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((event) => {
    if (!elementRef.current || !isConnected) return;

    const rect = elementRef.current.getBoundingClientRect();

    // Position relative to element (0-100%)
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Clamp to element bounds
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setRelativePosition({ x: clampedX, y: clampedY });

    // Convert back to viewport % for server
    const viewportX = (event.clientX / window.innerWidth) * 100;
    const viewportY = (event.clientY / window.innerHeight) * 100;
    
    updateCursorPosition(viewportX, viewportY);
  }, [elementRef, isConnected, updateCursorPosition]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('mousemove', handleMouseMove);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
    };
  }, [elementRef, handleMouseMove]);

  return {
    position: relativePosition,  // Position relative to element (0-100%)
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

  const flashTyping = useCallback(() => flash('typing'), [flash]);
  const flashClicking = useCallback(() => flash('clicking'), [flash]);
  const flashDragging = useCallback(() => flash('dragging'), [flash]);
  const flashShip = useCallback(() => flash('ship'), [flash]);

  return {
    flash,
    flashTyping,
    flashClicking,
    flashDragging,
    flashShip,
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

  return {
    focusOnUser,
  };
}

export default useCursor;