// src/hooks/useSounds.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE F: The Sound of Progress - useSounds Hook
// ═══════════════════════════════════════════════════════════════════════════════
//
// Main hook for playing sounds throughout the app.
// Provides convenient methods for common sound actions.
//
// Usage:
//   const { playClick, playShip, playLevelUp } = useSounds();
//   <button onClick={() => { playClick(); handleSubmit(); }}>Submit</button>
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useMemo } from 'react';
import { useSoundContext } from '../contexts/SoundContext';
import { SOUND_PRESETS, SOUNDS } from '../config/soundConfig';

/**
 * Main sounds hook - provides all sound playback methods
 */
export function useSounds() {
  const context = useSoundContext();
  const { playSound, isMuted, preferences } = context;

  // ─────────────────────────────────────────────────────────────────────────────
  // UI SOUNDS
  // ─────────────────────────────────────────────────────────────────────────────

  /** Play button click sound */
  const playClick = useCallback(() => {
    return playSound(SOUND_PRESETS.buttonClick);
  }, [playSound]);

  /** Play hover sound (if enabled) */
  const playHover = useCallback(() => {
    if (!preferences.enableHoverSounds) return null;
    return playSound(SOUND_PRESETS.buttonHover);
  }, [playSound, preferences.enableHoverSounds]);

  /** Play toggle on sound */
  const playToggleOn = useCallback(() => {
    return playSound(SOUND_PRESETS.toggleOn);
  }, [playSound]);

  /** Play toggle off sound */
  const playToggleOff = useCallback(() => {
    return playSound(SOUND_PRESETS.toggleOff);
  }, [playSound]);

  /** Play toggle sound (auto-detect on/off) */
  const playToggle = useCallback((isOn) => {
    return isOn ? playToggleOn() : playToggleOff();
  }, [playToggleOn, playToggleOff]);

  /** Play expand/collapse sound */
  const playExpand = useCallback(() => {
    return playSound(SOUND_PRESETS.menuExpand);
  }, [playSound]);

  const playCollapse = useCallback(() => {
    return playSound(SOUND_PRESETS.menuCollapse);
  }, [playSound]);

  /** Play error feedback sound */
  const playError = useCallback(() => {
    return playSound(SOUND_PRESETS.errorFeedback);
  }, [playSound]);

  /** Play success feedback sound */
  const playSuccess = useCallback(() => {
    return playSound(SOUND_PRESETS.taskDone);
  }, [playSound]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ACHIEVEMENT SOUNDS
  // ─────────────────────────────────────────────────────────────────────────────

  /** Play task complete sound */
  const playTaskComplete = useCallback(() => {
    return playSound(SOUND_PRESETS.taskDone);
  }, [playSound]);

  /** Play ship sound (task shipped) */
  const playShip = useCallback((isEpic = false) => {
    return playSound(isEpic ? SOUND_PRESETS.shipEpic : SOUND_PRESETS.shipTask);
  }, [playSound]);

  /** Play level up sound */
  const playLevelUp = useCallback(() => {
    return playSound(SOUND_PRESETS.levelUp);
  }, [playSound]);

  /** Play streak milestone sound */
  const playStreakMilestone = useCallback(() => {
    return playSound(SOUND_PRESETS.streakMilestone);
  }, [playSound]);

  /** Play XP gain sound */
  const playXPGain = useCallback(() => {
    return playSound(SOUND_PRESETS.xpGained);
  }, [playSound]);

  /** Play achievement unlock sound */
  const playAchievementUnlock = useCallback(() => {
    return playSound(SOUND_PRESETS.achievementUnlocked);
  }, [playSound]);

  // ─────────────────────────────────────────────────────────────────────────────
  // MOMENTUM SOUNDS
  // ─────────────────────────────────────────────────────────────────────────────

  /** Play momentum tick (with level scaling) */
  const playMomentumTick = useCallback((momentumLevel = 1) => {
    return playSound(SOUND_PRESETS.momentumTick, { momentumLevel });
  }, [playSound]);

  /** Play momentum level up (with level scaling) */
  const playMomentumUp = useCallback((momentumLevel = 1) => {
    return playSound(SOUND_PRESETS.momentumUp, { momentumLevel });
  }, [playSound]);

  /** Play fire mode activation */
  const playFireModeOn = useCallback(() => {
    return playSound(SOUND_PRESETS.fireOn);
  }, [playSound]);

  /** Play fire mode deactivation */
  const playFireModeOff = useCallback(() => {
    return playSound(SOUND_PRESETS.fireOff);
  }, [playSound]);

  // ─────────────────────────────────────────────────────────────────────────────
  // NOTIFICATION SOUNDS
  // ─────────────────────────────────────────────────────────────────────────────

  /** Play team ship notification */
  const playTeamShip = useCallback(() => {
    return playSound(SOUND_PRESETS.teamShipped);
  }, [playSound]);

  /** Play team achievement notification */
  const playTeamAchievement = useCallback(() => {
    return playSound(SOUND_PRESETS.teamAchievement);
  }, [playSound]);

  /** Play mention notification */
  const playMention = useCallback(() => {
    return playSound(SOUND_PRESETS.mentioned);
  }, [playSound]);

  /** Play reminder notification */
  const playReminder = useCallback(() => {
    return playSound(SOUND_PRESETS.reminded);
  }, [playSound]);

  /** Play new message notification */
  const playMessage = useCallback(() => {
    return playSound(SOUND_PRESETS.newMessage);
  }, [playSound]);

  // ─────────────────────────────────────────────────────────────────────────────
  // FOCUS/TIMER SOUNDS
  // ─────────────────────────────────────────────────────────────────────────────

  /** Play focus session start */
  const playFocusStart = useCallback(() => {
    return playSound(SOUND_PRESETS.focusBegin);
  }, [playSound]);

  /** Play focus session end */
  const playFocusEnd = useCallback(() => {
    return playSound(SOUND_PRESETS.focusFinish);
  }, [playSound]);

  /** Play timer tick */
  const playTimerTick = useCallback(() => {
    return playSound(SOUND_PRESETS.timerTick);
  }, [playSound]);

  /** Play timer warning (almost done) */
  const playTimerWarning = useCallback(() => {
    return playSound(SOUND_PRESETS.timerWarn);
  }, [playSound]);

  /** Play timer complete */
  const playTimerComplete = useCallback(() => {
    return playSound(SOUND_PRESETS.timerDone);
  }, [playSound]);

  // ─────────────────────────────────────────────────────────────────────────────
  // GENERIC PLAY
  // ─────────────────────────────────────────────────────────────────────────────

  /** Play any sound by ID */
  const play = useCallback((soundId, options = {}) => {
    return playSound(soundId, options);
  }, [playSound]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RETURN ALL METHODS
  // ─────────────────────────────────────────────────────────────────────────────
  return useMemo(() => ({
    // State
    isMuted,

    // UI Sounds
    playClick,
    playHover,
    playToggleOn,
    playToggleOff,
    playToggle,
    playExpand,
    playCollapse,
    playError,
    playSuccess,

    // Achievement Sounds
    playTaskComplete,
    playShip,
    playLevelUp,
    playStreakMilestone,
    playXPGain,
    playAchievementUnlock,

    // Momentum Sounds
    playMomentumTick,
    playMomentumUp,
    playFireModeOn,
    playFireModeOff,

    // Notification Sounds
    playTeamShip,
    playTeamAchievement,
    playMention,
    playReminder,
    playMessage,

    // Focus/Timer Sounds
    playFocusStart,
    playFocusEnd,
    playTimerTick,
    playTimerWarning,
    playTimerComplete,

    // Generic
    play,
  }), [
    isMuted,
    playClick,
    playHover,
    playToggleOn,
    playToggleOff,
    playToggle,
    playExpand,
    playCollapse,
    playError,
    playSuccess,
    playTaskComplete,
    playShip,
    playLevelUp,
    playStreakMilestone,
    playXPGain,
    playAchievementUnlock,
    playMomentumTick,
    playMomentumUp,
    playFireModeOn,
    playFireModeOff,
    playTeamShip,
    playTeamAchievement,
    playMention,
    playReminder,
    playMessage,
    playFocusStart,
    playFocusEnd,
    playTimerTick,
    playTimerWarning,
    playTimerComplete,
    play,
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALIZED HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook for UI feedback sounds only
 */
export function useUISoundsBasic() {
  const {
    playClick,
    playHover,
    playToggle,
    playToggleOn,
    playToggleOff,
    playExpand,
    playCollapse,
    playError,
  } = useSounds();

  return {
    playClick,
    playHover,
    playToggle,
    playToggleOn,
    playToggleOff,
    playExpand,
    playCollapse,
    playError,
  };
}

/**
 * Hook for achievement/reward sounds only
 */
export function useAchievementSounds() {
  const {
    playTaskComplete,
    playShip,
    playLevelUp,
    playStreakMilestone,
    playXPGain,
    playAchievementUnlock,
  } = useSounds();

  return {
    playTaskComplete,
    playShip,
    playLevelUp,
    playStreakMilestone,
    playXPGain,
    playAchievementUnlock,
  };
}

/**
 * Hook for momentum-related sounds only
 */
export function useMomentumSounds() {
  const {
    playMomentumTick,
    playMomentumUp,
    playFireModeOn,
    playFireModeOff,
  } = useSounds();

  return {
    playMomentumTick,
    playMomentumUp,
    playFireModeOn,
    playFireModeOff,
  };
}

/**
 * Hook for notification sounds only
 */
export function useNotificationSounds() {
  const {
    playTeamShip,
    playTeamAchievement,
    playMention,
    playReminder,
    playMessage,
  } = useSounds();

  return {
    playTeamShip,
    playTeamAchievement,
    playMention,
    playReminder,
    playMessage,
  };
}

/**
 * Hook for focus/timer sounds only
 */
export function useFocusSounds() {
  const {
    playFocusStart,
    playFocusEnd,
    playTimerTick,
    playTimerWarning,
    playTimerComplete,
  } = useSounds();

  return {
    playFocusStart,
    playFocusEnd,
    playTimerTick,
    playTimerWarning,
    playTimerComplete,
  };
}

/**
 * Hook that provides a click handler wrapper with sound
 * @example
 * const withSound = useSoundClick();
 * <button onClick={withSound(handleClick)}>Click me</button>
 */
export function useSoundClick() {
  const { playClick } = useSounds();

  return useCallback((handler) => {
    return (...args) => {
      playClick();
      if (handler) handler(...args);
    };
  }, [playClick]);
}

/**
 * Hook for button with sound - returns props to spread on button
 * @example
 * const soundProps = useSoundButton();
 * <button {...soundProps} onClick={handleClick}>Click me</button>
 */
export function useSoundButton(enableHover = false) {
  const { playClick, playHover } = useSounds();

  return useMemo(() => ({
    onClick: (e) => {
      playClick();
    },
    onMouseEnter: enableHover ? () => playHover() : undefined,
  }), [playClick, playHover, enableHover]);
}

/**
 * Hook specifically for UI interaction sounds
 * Convenience wrapper around useSounds for common UI feedback
 */
export function useUISounds() {
  const {
    playClick,
    playHover,
    playToggleOn,
    playToggleOff,
    playToggle,
    playExpand,
    playCollapse,
    playError,
    playSuccess,
  } = useSounds();

  return {
    playClick,
    playHover,
    playToggleOn,
    playToggleOff,
    playToggle,
    playExpand,
    playCollapse,
    playError,
    playSuccess,
  };
}

// Default export
export default useSounds;
