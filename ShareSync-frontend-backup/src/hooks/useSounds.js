// src/hooks/useSounds.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4: The Sound of Progress - Signature Web Audio Engine
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useMemo } from 'react';
import { useSoundContext } from '../contexts/SoundContext';
import { SOUND_PRESETS, SOUNDS } from '../config/soundConfig';

/**
 * SIGNATURE UPGRADE: Web Audio API Synthesizer Fallback
 * Generates a purely mathematical "Level Up" / "Ship" chord sequence 
 * just in case the MP3 files aren't loaded yet. Immediate tactile feedback.
 */
const playSynthesizedChord = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };
    // A majestic major arpeggio (C5, E5, G5, C6)
    playNote(523.25, 0.0, 0.5); // C
    playNote(659.25, 0.1, 0.5); // E
    playNote(783.99, 0.2, 0.5); // G
    playNote(1046.50, 0.3, 1.0); // High C
  } catch (e) {
    console.log("Web Audio API not supported", e);
  }
};

export function useSounds() {
  const context = useSoundContext();
  const { playSound, isMuted, preferences } = context;

  const playClick = useCallback(() => playSound(SOUND_PRESETS.buttonClick), [playSound]);
  const playHover = useCallback(() => preferences.enableHoverSounds ? playSound(SOUND_PRESETS.buttonHover) : null, [playSound, preferences.enableHoverSounds]);
  const playToggleOn = useCallback(() => playSound(SOUND_PRESETS.toggleOn), [playSound]);
  const playToggleOff = useCallback(() => playSound(SOUND_PRESETS.toggleOff), [playSound]);
  const playToggle = useCallback((isOn) => isOn ? playToggleOn() : playToggleOff(), [playToggleOn, playToggleOff]);
  const playExpand = useCallback(() => playSound(SOUND_PRESETS.menuExpand), [playSound]);
  const playCollapse = useCallback(() => playSound(SOUND_PRESETS.menuCollapse), [playSound]);
  const playError = useCallback(() => playSound(SOUND_PRESETS.errorFeedback), [playSound]);
  const playSuccess = useCallback(() => playSound(SOUND_PRESETS.taskDone), [playSound]);
  
  const playTaskComplete = useCallback(() => playSound(SOUND_PRESETS.taskDone), [playSound]);
  
  /** SIGNATURE: Intercept the Ship sound to fire the synthesizer in parallel */
  const playShip = useCallback((isEpic = false) => {
    if (!isMuted) playSynthesizedChord(); 
    return playSound(isEpic ? SOUND_PRESETS.shipEpic : SOUND_PRESETS.shipTask);
  }, [playSound, isMuted]);

  const playLevelUp = useCallback(() => playSound(SOUND_PRESETS.levelUp), [playSound]);
  const playStreakMilestone = useCallback(() => playSound(SOUND_PRESETS.streakMilestone), [playSound]);
  const playXPGain = useCallback(() => playSound(SOUND_PRESETS.xpGained), [playSound]);
  const playAchievementUnlock = useCallback(() => playSound(SOUND_PRESETS.achievementUnlocked), [playSound]);
  const playMomentumTick = useCallback((momentumLevel = 1) => playSound(SOUND_PRESETS.momentumTick, { momentumLevel }), [playSound]);
  const playMomentumUp = useCallback((momentumLevel = 1) => playSound(SOUND_PRESETS.momentumUp, { momentumLevel }), [playSound]);
  const playFireModeOn = useCallback(() => playSound(SOUND_PRESETS.fireOn), [playSound]);
  const playFireModeOff = useCallback(() => playSound(SOUND_PRESETS.fireOff), [playSound]);
  const playTeamShip = useCallback(() => playSound(SOUND_PRESETS.teamShipped), [playSound]);
  const playTeamAchievement = useCallback(() => playSound(SOUND_PRESETS.teamAchievement), [playSound]);
  const playMention = useCallback(() => playSound(SOUND_PRESETS.mentioned), [playSound]);
  const playReminder = useCallback(() => playSound(SOUND_PRESETS.reminded), [playSound]);
  const playMessage = useCallback(() => playSound(SOUND_PRESETS.newMessage), [playSound]);
  const playFocusStart = useCallback(() => playSound(SOUND_PRESETS.focusBegin), [playSound]);
  const playFocusEnd = useCallback(() => playSound(SOUND_PRESETS.focusFinish), [playSound]);
  const playTimerTick = useCallback(() => playSound(SOUND_PRESETS.timerTick), [playSound]);
  const playTimerWarning = useCallback(() => playSound(SOUND_PRESETS.timerWarn), [playSound]);
  const playTimerComplete = useCallback(() => playSound(SOUND_PRESETS.timerDone), [playSound]);
  const play = useCallback((soundId, options = {}) => playSound(soundId, options), [playSound]);

  return useMemo(() => ({
    isMuted, playClick, playHover, playToggleOn, playToggleOff, playToggle, playExpand, playCollapse,
    playError, playSuccess, playTaskComplete, playShip, playLevelUp, playStreakMilestone, playXPGain,
    playAchievementUnlock, playMomentumTick, playMomentumUp, playFireModeOn, playFireModeOff,
    playTeamShip, playTeamAchievement, playMention, playReminder, playMessage, playFocusStart,
    playFocusEnd, playTimerTick, playTimerWarning, playTimerComplete, play,
  }), [
    isMuted, playClick, playHover, playToggleOn, playToggleOff, playToggle, playExpand, playCollapse,
    playError, playSuccess, playTaskComplete, playShip, playLevelUp, playStreakMilestone, playXPGain,
    playAchievementUnlock, playMomentumTick, playMomentumUp, playFireModeOn, playFireModeOff,
    playTeamShip, playTeamAchievement, playMention, playReminder, playMessage, playFocusStart,
    playFocusEnd, playTimerTick, playTimerWarning, playTimerComplete, play,
  ]);
}

export function useUISoundsBasic() { const s = useSounds(); return { playClick: s.playClick, playHover: s.playHover, playToggle: s.playToggle, playToggleOn: s.playToggleOn, playToggleOff: s.playToggleOff, playExpand: s.playExpand, playCollapse: s.playCollapse, playError: s.playError }; }
export function useAchievementSounds() { const s = useSounds(); return { playTaskComplete: s.playTaskComplete, playShip: s.playShip, playLevelUp: s.playLevelUp, playStreakMilestone: s.playStreakMilestone, playXPGain: s.playXPGain, playAchievementUnlock: s.playAchievementUnlock }; }
export function useMomentumSounds() { const s = useSounds(); return { playMomentumTick: s.playMomentumTick, playMomentumUp: s.playMomentumUp, playFireModeOn: s.playFireModeOn, playFireModeOff: s.playFireModeOff }; }
export function useNotificationSounds() { const s = useSounds(); return { playTeamShip: s.playTeamShip, playTeamAchievement: s.playTeamAchievement, playMention: s.playMention, playReminder: s.playReminder, playMessage: s.playMessage }; }
export function useFocusSounds() { const s = useSounds(); return { playFocusStart: s.playFocusStart, playFocusEnd: s.playFocusEnd, playTimerTick: s.playTimerTick, playTimerWarning: s.playTimerWarning, playTimerComplete: s.playTimerComplete }; }
export function useSoundClick() { const { playClick } = useSounds(); return useCallback((handler) => (...args) => { playClick(); if (handler) handler(...args); }, [playClick]); }
export function useSoundButton(enableHover = false) { const { playClick, playHover } = useSounds(); return useMemo(() => ({ onClick: () => playClick(), onMouseEnter: enableHover ? () => playHover() : undefined }), [playClick, playHover, enableHover]); }
export function useUISounds() { const s = useSounds(); return { playClick: s.playClick, playHover: s.playHover, playToggleOn: s.playToggleOn, playToggleOff: s.playToggleOff, playToggle: s.playToggle, playExpand: s.playExpand, playCollapse: s.playCollapse, playError: s.playError, playSuccess: s.playSuccess }; }

export default useSounds;
