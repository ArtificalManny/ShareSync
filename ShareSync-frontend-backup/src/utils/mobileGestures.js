/**
 * mobileGestures.js
 * Touch gesture detection utilities
 * 
 * Detects:
 * - Tap
 * - Swipe (left, right, up, down)
 * - Pinch zoom
 * - Long press
 */

/**
 * Detect gesture type from touch start and end points
 */
export function detectTouchGesture(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dt = end.time - start.time;
    const distance = Math.sqrt(dx * dx + dy * dy);
  
    // Tap (short duration, small distance)
    if (dt < 200 && distance < 10) {
      return 'tap';
    }
  
    // Long press (long duration, small distance)
    if (dt > 500 && distance < 10) {
      return 'longpress';
    }
  
    // Swipe (fast movement, large distance)
    if (distance > 50 && dt < 500) {
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
      if (Math.abs(angle) < 45) return 'swipe-right';
      if (Math.abs(angle) > 135) return 'swipe-left';
      if (angle > 45 && angle < 135) return 'swipe-down';
      if (angle < -45 && angle > -135) return 'swipe-up';
  
      return 'swipe';
    }
  
    // Drag (slow movement)
    if (distance > 10) {
      return 'drag';
    }
  
    return 'unknown';
  }
  
  /**
   * Detect pinch zoom gesture
   */
  export function detectPinchZoom(touches) {
    if (touches.length !== 2) return null;
  
    const [touch1, touch2] = touches;
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  
    return distance;
  }
  
  /**
   * Check if device is mobile
   */
  export function isMobileDevice() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }
  
  /**
   * Check if device supports touch
   */
  export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
  
  /**
   * Get touch position relative to viewport
   */
  export function getTouchPosition(touch) {
    return {
      x: (touch.clientX / window.innerWidth) * 100,
      y: (touch.clientY / window.innerHeight) * 100,
    };
  }
  
  /**
   * Throttle touch events to target FPS
   */
  export function throttleTouchEvents(callback, fps = 30) {
    const interval = 1000 / fps;
    let lastTime = 0;
  
    return (event) => {
      const now = Date.now();
      if (now - lastTime >= interval) {
        lastTime = now;
        callback(event);
      }
    };
  }
  
  export default {
    detectTouchGesture,
    detectPinchZoom,
    isMobileDevice,
    isTouchDevice,
    getTouchPosition,
    throttleTouchEvents,
  };