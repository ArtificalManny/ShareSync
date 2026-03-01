// src/hooks/useFocusBlock.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.3: Focus Blocks — Calendar-Aware Deep Work
// ═══════════════════════════════════════════════════════════════════════════════
//
// Manages focus block lifecycle:
//   - Start / stop / schedule blocks (25/50/90 min)
//   - Track remaining time with 1s precision
//   - Auto-collapse sidebar via 'focus-block-change' event
//   - Mute notifications via localStorage flag
//   - 2x XP multiplier via localStorage flag (read by MomentumContext)
//   - Persist state across refresh (localStorage)
//
// ZERO BACKEND CHANGES — purely client-side timer + state
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ─────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────
const LS_ACTIVE = 'ss.focusBlock.active';
const LS_STATE = 'ss.focusBlock.state';
const LS_MUTED = 'ss.focusBlock.muted';
const LS_HISTORY = 'ss.focusBlock.history';

export const FOCUS_PRESETS = [
  { minutes: 25, label: 'Sprint', description: 'Pomodoro-style burst', icon: '⚡' },
  { minutes: 50, label: 'Deep Work', description: 'Sustained concentration', icon: '🧠' },
  { minutes: 90, label: 'Marathon', description: 'Extended creative session', icon: '🏔️' },
];

// ─────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(LS_STATE);
    if (!raw) return null;
    const state = JSON.parse(raw);
    // Validate the state is still valid (not expired)
    if (state && state.endTime && Date.now() < state.endTime) {
      return state;
    }
    // Expired — clean up
    clearPersistedState();
    return null;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(LS_STATE, JSON.stringify(state));
    localStorage.setItem(LS_ACTIVE, '1');
    localStorage.setItem(LS_MUTED, '1');
  } catch {}
}

function clearPersistedState() {
  try {
    localStorage.removeItem(LS_STATE);
    localStorage.removeItem(LS_ACTIVE);
    localStorage.removeItem(LS_MUTED);
  } catch {}
}

function addToHistory(block) {
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    const history = raw ? JSON.parse(raw) : [];
    history.unshift({
      ...block,
      completedAt: new Date().toISOString(),
    });
    // Keep last 50
    localStorage.setItem(LS_HISTORY, JSON.stringify(history.slice(0, 50)));
  } catch {}
}

function getHistory() {
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function broadcastChange() {
  window.dispatchEvent(new CustomEvent('focus-block-change'));
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────────────────────────────────
export function useFocusBlock() {
  // ── State ──
  const [isActive, setIsActive] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [taskId, setTaskId] = useState(null);
  const [taskName, setTaskName] = useState('');
  const [presetLabel, setPresetLabel] = useState('');
  const [startedAt, setStartedAt] = useState(null);
  const [scheduledBlocks, setScheduledBlocks] = useState([]);
  const [showScheduler, setShowScheduler] = useState(false);

  const timerRef = useRef(null);
  const completionSoundRef = useRef(null);

  // ── Restore persisted state on mount ──
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      const remaining = Math.max(0, Math.floor((saved.endTime - Date.now()) / 1000));
      if (remaining > 0) {
        setIsActive(true);
        setRemainingSeconds(remaining);
        setTotalSeconds(saved.totalSeconds);
        setTaskId(saved.taskId || null);
        setTaskName(saved.taskName || '');
        setPresetLabel(saved.presetLabel || '');
        setStartedAt(saved.startedAt || null);
      }
    }
  }, []);

  // ── Countdown timer ──
  useEffect(() => {
    if (!isActive || remainingSeconds <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          // Block complete!
          handleComplete();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  // ── Complete handler ──
  const handleComplete = useCallback(() => {
    setIsActive(false);

    // Record in history
    addToHistory({
      totalSeconds,
      taskId,
      taskName,
      presetLabel,
      startedAt,
      completed: true,
    });

    clearPersistedState();
    broadcastChange();

    // Dispatch completion event (for sounds, celebrations, etc.)
    window.dispatchEvent(
      new CustomEvent('focus-block-complete', {
        detail: { totalSeconds, taskId, taskName, presetLabel },
      })
    );

    // Dispatch XP event
    const xpEarned = Math.round(totalSeconds / 60) * 2; // 2 XP per minute
    window.dispatchEvent(
      new CustomEvent('local-xp', {
        detail: { xp: xpEarned, source: 'focus-block-complete' },
      })
    );
  }, [totalSeconds, taskId, taskName, presetLabel, startedAt]);

  // ── Start focus block ──
  const start = useCallback(({ minutes, task = null, label = '' } = {}) => {
    if (!minutes || minutes <= 0) return;

    const secs = minutes * 60;
    const now = Date.now();
    const endTime = now + secs * 1000;

    const state = {
      totalSeconds: secs,
      endTime,
      taskId: task?.id || task?._id || null,
      taskName: task?.title || task?.name || '',
      presetLabel: label,
      startedAt: new Date().toISOString(),
    };

    saveState(state);

    setIsActive(true);
    setRemainingSeconds(secs);
    setTotalSeconds(secs);
    setTaskId(state.taskId);
    setTaskName(state.taskName);
    setPresetLabel(label);
    setStartedAt(state.startedAt);

    broadcastChange();

    // Dispatch start event
    window.dispatchEvent(
      new CustomEvent('focus-block-start', {
        detail: { minutes, taskName: state.taskName, label },
      })
    );
  }, []);

  // ── Stop (cancel) focus block ──
  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Record partial completion in history
    const elapsed = totalSeconds - remainingSeconds;
    if (elapsed > 60) {
      addToHistory({
        totalSeconds,
        taskId,
        taskName,
        presetLabel,
        startedAt,
        completed: false,
        elapsedSeconds: elapsed,
      });
    }

    setIsActive(false);
    setRemainingSeconds(0);
    setTotalSeconds(0);
    setTaskId(null);
    setTaskName('');
    setPresetLabel('');
    setStartedAt(null);

    clearPersistedState();
    broadcastChange();

    window.dispatchEvent(new CustomEvent('focus-block-stop'));
  }, [totalSeconds, remainingSeconds, taskId, taskName, presetLabel, startedAt]);

  // ── Extend current block ──
  const extend = useCallback((extraMinutes = 15) => {
    if (!isActive) return;

    const extraSecs = extraMinutes * 60;
    setRemainingSeconds((prev) => prev + extraSecs);
    setTotalSeconds((prev) => prev + extraSecs);

    // Update persisted state
    try {
      const raw = localStorage.getItem(LS_STATE);
      if (raw) {
        const state = JSON.parse(raw);
        state.endTime += extraSecs * 1000;
        state.totalSeconds += extraSecs;
        saveState(state);
      }
    } catch {}
  }, [isActive]);

  // ── Schedule a future block ──
  const schedule = useCallback(({ minutes, task = null, label = '', scheduledFor }) => {
    const block = {
      id: `scheduled-${Date.now()}`,
      minutes,
      task,
      label,
      scheduledFor: scheduledFor || null,
    };
    setScheduledBlocks((prev) => [...prev, block]);
    return block;
  }, []);

  // ── Remove scheduled block ──
  const removeScheduled = useCallback((blockId) => {
    setScheduledBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }, []);

  // ── Derived values ──
  const progress = useMemo(() => {
    if (totalSeconds === 0) return 0;
    return Math.max(0, Math.min(1, 1 - remainingSeconds / totalSeconds));
  }, [remainingSeconds, totalSeconds]);

  const formattedTime = useMemo(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  const elapsedMinutes = useMemo(() => {
    return Math.floor((totalSeconds - remainingSeconds) / 60);
  }, [totalSeconds, remainingSeconds]);

  const history = useMemo(() => getHistory(), [isActive]); // Refresh when block ends

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    // State
    isActive,
    remainingSeconds,
    totalSeconds,
    taskId,
    taskName,
    presetLabel,
    startedAt,
    progress,
    formattedTime,
    elapsedMinutes,

    // Actions
    start,
    stop,
    extend,
    schedule,
    removeScheduled,

    // Scheduler UI
    showScheduler,
    setShowScheduler,
    scheduledBlocks,

    // History
    history,

    // Presets
    presets: FOCUS_PRESETS,
  };
}

export default useFocusBlock;
