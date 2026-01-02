/**
 * Haptic Feedback Utilities
 * Provides tactile feedback on mobile devices for enhanced UX
 */

// Check if vibration API is supported
const isSupported = () => {
  return 'vibrate' in navigator && typeof navigator.vibrate === 'function';
};

// Check user preferences (respect reduced motion)
const isEnabled = () => {
  // Check if user has disabled haptics in settings
  const disabled = localStorage.getItem('haptics-disabled') === 'true';
  if (disabled) return false;

  // Respect prefers-reduced-motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return false;

  return isSupported();
};

/**
 * Haptic feedback patterns
 */
export const haptic = {
  /**
   * Light tap - for button presses, toggles
   * Duration: 10ms
   */
  light: () => {
    if (isEnabled()) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium impact - for successful actions, selections
   * Duration: 20ms
   */
  medium: () => {
    if (isEnabled()) {
      navigator.vibrate(20);
    }
  },

  /**
   * Heavy impact - for important confirmations
   * Duration: 30ms
   */
  heavy: () => {
    if (isEnabled()) {
      navigator.vibrate(30);
    }
  },

  /**
   * Success pattern - double tap for completed actions
   * Pattern: 10ms, pause 50ms, 10ms
   */
  success: () => {
    if (isEnabled()) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Error pattern - three quick taps
   * Pattern: 10ms, 20ms, 10ms, 20ms, 10ms
   */
  error: () => {
    if (isEnabled()) {
      navigator.vibrate([10, 20, 10, 20, 10]);
    }
  },

  /**
   * Warning pattern - single longer vibration
   * Duration: 40ms
   */
  warning: () => {
    if (isEnabled()) {
      navigator.vibrate(40);
    }
  },

  /**
   * Selection pattern - for scrolling through lists
   * Duration: 5ms (very subtle)
   */
  selection: () => {
    if (isEnabled()) {
      navigator.vibrate(5);
    }
  },

  /**
   * Notification pattern - attention grabbing
   * Pattern: 30ms, 50ms, 30ms, 50ms, 30ms
   */
  notification: () => {
    if (isEnabled()) {
      navigator.vibrate([30, 50, 30, 50, 30]);
    }
  },

  /**
   * Cancel vibration
   */
  cancel: () => {
    if (isSupported()) {
      navigator.vibrate(0);
    }
  },
};

/**
 * Enable/disable haptics
 */
export const setHapticsEnabled = (enabled) => {
  localStorage.setItem('haptics-disabled', enabled ? 'false' : 'true');
};

/**
 * Check if haptics are currently enabled
 */
export const areHapticsEnabled = () => {
  return isEnabled();
};

/**
 * React hook for haptic feedback
 */
export const useHaptic = () => {
  return haptic;
};

export default haptic;
