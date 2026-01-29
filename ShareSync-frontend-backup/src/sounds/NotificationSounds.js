// src/sounds/NotificationSounds.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE F: The Sound of Progress - Notification Sounds
// ═══════════════════════════════════════════════════════════════════════════════
//
// Audio alerts for team activity and notifications.
// Keeps you aware without being disruptive.
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSounds, useNotificationSounds as useNotificationSoundsBase } from '../hooks/useSounds';
import { useSoundContext } from '../contexts/SoundContext';

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION SOUND DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const NOTIFICATION_SOUNDS = {
  // Team activity
  team_ship: {
    id: 'team_ship',
    description: 'Teammate shipped something',
    priority: 'low',
    canBatch: true,
    useCase: 'Real-time team activity feed',
  },
  
  team_achievement: {
    id: 'team_achievement',
    description: 'Teammate unlocked achievement',
    priority: 'low',
    canBatch: true,
    useCase: 'Team celebration moments',
  },
  
  // Direct notifications
  mention: {
    id: 'mention',
    description: 'You were mentioned',
    priority: 'high',
    canBatch: false,
    useCase: '@mentions in comments, tasks',
  },
  
  message: {
    id: 'message',
    description: 'New direct message',
    priority: 'medium',
    canBatch: true,
    useCase: 'Chat messages, DMs',
  },
  
  reminder: {
    id: 'reminder',
    description: 'Task/event reminder',
    priority: 'high',
    canBatch: false,
    useCase: 'Due date reminders, scheduled alerts',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION PRIORITY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const NOTIFICATION_PRIORITY = {
  // High priority - always play immediately
  high: {
    playImmediately: true,
    canBatch: false,
    minInterval: 0,
  },
  
  // Medium priority - small debounce
  medium: {
    playImmediately: false,
    canBatch: true,
    minInterval: 1000, // 1 second
    maxBatchSize: 3,
  },
  
  // Low priority - larger debounce, batching
  low: {
    playImmediately: false,
    canBatch: true,
    minInterval: 3000, // 3 seconds
    maxBatchSize: 5,
  },
};

/**
 * Get priority config for a notification type
 */
export function getNotificationPriority(notificationType) {
  const sound = NOTIFICATION_SOUNDS[notificationType];
  if (!sound) return NOTIFICATION_PRIORITY.low;
  return NOTIFICATION_PRIORITY[sound.priority] || NOTIFICATION_PRIORITY.low;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM ACTIVITY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const TEAM_SOUND_CONFIG = {
  // Whether to play sounds for team activity
  enabled: true,
  
  // Cooldown between team sounds (ms)
  cooldown: 5000, // 5 seconds
  
  // Maximum team sounds per minute
  maxPerMinute: 6,
  
  // Don't play for your own actions
  excludeSelf: true,
  
  // Activity types that trigger sounds
  triggerActivities: [
    'ship',
    'achievement',
    'level_up',
    'streak_milestone',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS MODE HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

export const FOCUS_MODE_SOUNDS = {
  // Which notifications play during focus mode
  allowDuringFocus: {
    mention: true,      // Mentions still play
    reminder: true,     // Reminders still play
    message: false,     // Messages muted
    team_ship: false,   // Team activity muted
    team_achievement: false,
  },
  
  // Volume reduction during focus mode
  focusVolumeMultiplier: 0.5,
};

/**
 * Check if notification should play during focus mode
 */
export function shouldPlayDuringFocus(notificationType) {
  return FOCUS_MODE_SOUNDS.allowDuringFocus[notificationType] ?? false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALIZED HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook for team activity sounds with batching
 * 
 * @example
 * const { playTeamActivity } = useTeamActivitySound();
 * playTeamActivity({ type: 'ship', user: 'Sarah' });
 */
export function useTeamActivitySound() {
  const { playTeamShip, playTeamAchievement } = useNotificationSoundsBase();
  const lastPlayTime = useRef(0);
  const playCount = useRef(0);
  const pendingQueue = useRef([]);
  const batchTimeout = useRef(null);
  
  // Reset count every minute
  useEffect(() => {
    const interval = setInterval(() => {
      playCount.current = 0;
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const processQueue = useCallback(() => {
    if (pendingQueue.current.length === 0) return;
    
    const now = Date.now();
    if (now - lastPlayTime.current < TEAM_SOUND_CONFIG.cooldown) {
      return;
    }
    
    if (playCount.current >= TEAM_SOUND_CONFIG.maxPerMinute) {
      pendingQueue.current = [];
      return;
    }
    
    // Get unique activity types from queue
    const types = [...new Set(pendingQueue.current.map(a => a.type))];
    pendingQueue.current = [];
    
    // Play appropriate sound
    if (types.includes('achievement') || types.includes('level_up')) {
      playTeamAchievement();
    } else {
      playTeamShip();
    }
    
    lastPlayTime.current = now;
    playCount.current++;
  }, [playTeamShip, playTeamAchievement]);
  
  const playTeamActivity = useCallback((activity) => {
    const { type, userId } = activity;
    
    // Skip if disabled or not a trigger activity
    if (!TEAM_SOUND_CONFIG.enabled) return;
    if (!TEAM_SOUND_CONFIG.triggerActivities.includes(type)) return;
    
    // Add to queue
    pendingQueue.current.push(activity);
    
    // Clear existing timeout
    if (batchTimeout.current) {
      clearTimeout(batchTimeout.current);
    }
    
    // Process after short delay (batching)
    batchTimeout.current = setTimeout(processQueue, 500);
  }, [processQueue]);
  
  return { playTeamActivity };
}

/**
 * Hook for mention sounds
 * 
 * @example
 * const { playMention } = useMentionSound();
 * playMention({ from: 'Sarah', context: 'comment' });
 */
export function useMentionSound() {
  const { playMention } = useNotificationSoundsBase();
  
  const playMentionSound = useCallback((mentionData = {}) => {
    // Mentions always play immediately (high priority)
    playMention();
    return true;
  }, [playMention]);
  
  return { playMention: playMentionSound };
}

/**
 * Hook for message sounds with batching
 * 
 * @example
 * const { playMessageSound } = useMessageSound();
 * playMessageSound({ from: 'Alex', preview: 'Hey!' });
 */
export function useMessageSound() {
  const { playMessage } = useNotificationSoundsBase();
  const lastPlayTime = useRef(0);
  const priorityConfig = NOTIFICATION_PRIORITY.medium;
  
  const playMessageSound = useCallback((messageData = {}) => {
    const now = Date.now();
    
    // Check cooldown
    if (now - lastPlayTime.current < priorityConfig.minInterval) {
      return false;
    }
    
    lastPlayTime.current = now;
    playMessage();
    return true;
  }, [playMessage, priorityConfig.minInterval]);
  
  return { playMessage: playMessageSound };
}

/**
 * Hook for reminder sounds
 * 
 * @example
 * const { playReminder } = useReminderSound();
 * playReminder({ task: 'Review PR', dueIn: '5 minutes' });
 */
export function useReminderSound() {
  const { playReminder } = useNotificationSoundsBase();
  
  const playReminderSound = useCallback((reminderData = {}) => {
    // Reminders always play immediately (high priority)
    playReminder();
    return true;
  }, [playReminder]);
  
  return { playReminder: playReminderSound };
}

/**
 * Hook for focus-aware notification sounds
 * Respects focus mode settings
 * 
 * @example
 * const { playNotification } = useFocusAwareNotifications(isInFocusMode);
 * playNotification('mention', { from: 'Sarah' });
 */
export function useFocusAwareNotifications(isInFocusMode = false) {
  const { playMention } = useMentionSound();
  const { playMessage: playMessageBase } = useMessageSound();
  const { playReminder } = useReminderSound();
  const { playTeamActivity } = useTeamActivitySound();
  const { setCategoryVolume } = useSoundContext();
  
  // Adjust volume based on focus mode
  useEffect(() => {
    if (isInFocusMode) {
      setCategoryVolume('notification', FOCUS_MODE_SOUNDS.focusVolumeMultiplier);
    } else {
      setCategoryVolume('notification', 1);
    }
  }, [isInFocusMode, setCategoryVolume]);
  
  const playNotification = useCallback((type, data = {}) => {
    // Check if should play during focus mode
    if (isInFocusMode && !shouldPlayDuringFocus(type)) {
      return false;
    }
    
    switch (type) {
      case 'mention':
        return playMention(data);
      case 'message':
        return playMessageBase(data);
      case 'reminder':
        return playReminder(data);
      case 'team_ship':
      case 'team_achievement':
        playTeamActivity({ type, ...data });
        return true;
      default:
        return false;
    }
  }, [isInFocusMode, playMention, playMessageBase, playReminder, playTeamActivity]);
  
  return { playNotification };
}

/**
 * Combined notification sounds hook
 */
export function useNotificationSounds(isInFocusMode = false) {
  const base = useNotificationSoundsBase();
  const { playTeamActivity } = useTeamActivitySound();
  const { playMention } = useMentionSound();
  const { playMessage } = useMessageSound();
  const { playReminder } = useReminderSound();
  const { playNotification } = useFocusAwareNotifications(isInFocusMode);
  
  return useMemo(() => ({
    // Base sounds
    ...base,
    
    // Enhanced
    playTeamActivity,
    playMention,
    playMessage,
    playReminder,
    playNotification,
    
    // Utilities
    shouldPlayDuringFocus,
    getNotificationPriority,
  }), [base, playTeamActivity, playMention, playMessage, playReminder, playNotification]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION EVENT HANDLERS
// Ready to connect to your event system
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a notification sound handler for your event system
 * 
 * @example
 * const handler = createNotificationHandler(soundFunctions);
 * eventEmitter.on('notification', handler);
 */
export function createNotificationHandler(soundFunctions) {
  return (event) => {
    const { type, data } = event;
    
    switch (type) {
      case 'team-ship':
        soundFunctions.playTeamActivity({ type: 'ship', ...data });
        break;
      case 'team-achievement':
        soundFunctions.playTeamActivity({ type: 'achievement', ...data });
        break;
      case 'mention':
        soundFunctions.playMention(data);
        break;
      case 'message':
        soundFunctions.playMessage(data);
        break;
      case 'reminder':
        soundFunctions.playReminder(data);
        break;
    }
  };
}

/**
 * Hook that listens to window events for notifications
 * 
 * @example
 * // In your main app or notification provider
 * useNotificationSoundEvents();
 * 
 * // Then anywhere in your app:
 * window.dispatchEvent(new CustomEvent('team-ship', { detail: { user: 'Sarah' } }));
 */
export function useNotificationSoundEvents(isInFocusMode = false) {
  const { playNotification } = useFocusAwareNotifications(isInFocusMode);
  
  useEffect(() => {
    const events = ['team-ship', 'team-achievement', 'mention', 'message', 'reminder'];
    
    const handlers = events.map(eventType => {
      const handler = (e) => {
        // Map event type to notification type
        const notificationType = eventType.replace('-', '_');
        playNotification(notificationType, e.detail || {});
      };
      window.addEventListener(eventType, handler);
      return { eventType, handler };
    });
    
    return () => {
      handlers.forEach(({ eventType, handler }) => {
        window.removeEventListener(eventType, handler);
      });
    };
  }, [playNotification]);
}

export default NOTIFICATION_SOUNDS;
