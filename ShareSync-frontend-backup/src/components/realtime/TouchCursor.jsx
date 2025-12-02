/**
 * TouchCursor.jsx
 * Mobile touch-to-cursor mapping
 * 
 * Converts touch events to cursor movements for mobile devices
 */

import React, { useEffect, useRef } from 'react';
import { useCursorContext } from '../../context/CursorContext';
import { detectTouchGesture } from '../../utils/mobileGestures';

export function TouchCursor() {
  const { updateCursorPosition, setCursorActivity } = useCursorContext();
  const touchStartRef = useRef(null);
  const lastTouchRef = useRef({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    // Check if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      updateCursorPosition(touch.clientX, touch.clientY);
      setCursorActivity('clicking');
    };

    const handleTouchMove = (e) => {
      e.preventDefault(); // Prevent scrolling
      const touch = e.touches[0];
      const now = Date.now();

      // Throttle updates (30fps)
      if (now - lastTouchRef.current.time < 33) return;

      lastTouchRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: now,
      };

      updateCursorPosition(touch.clientX, touch.clientY);
      
      // Detect gesture
      if (touchStartRef.current) {
        const gesture = detectTouchGesture(
          touchStartRef.current,
          { x: touch.clientX, y: touch.clientY, time: now }
        );

        if (gesture === 'swipe') {
          setCursorActivity('dragging');
        } else {
          setCursorActivity('typing');
        }
      }
    };

    const handleTouchEnd = () => {
      setCursorActivity('idle');
      touchStartRef.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [updateCursorPosition, setCursorActivity]);

  // No visible UI - just event handlers
  return null;
}

export default TouchCursor;