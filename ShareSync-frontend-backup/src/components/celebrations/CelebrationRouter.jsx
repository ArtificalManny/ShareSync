// src/components/celebrations/CelebrationRouter.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.2: Master celebration component
// - Listens for 'celebration-trigger' window events (from fireCelebration util)
// - Listens for 'celebration-preview' window events (from CelebrationStylePicker)
// - Reads persona from localStorage (same source of truth as PersonaContext)
// - Routes to the correct persona-specific celebration component
//
// Mount this ONCE at the app level (e.g. inside AuthenticatedApp in App.jsx)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getCelebrationConfig, INTENSITY_DURATION, DEFAULT_OVERRIDES } from '../../config/celebrationConfig';
import ConfettiBlast from './ConfettiBlast';
import SubtleGlow from './SubtleGlow';
import CleanCheckmark from './CleanCheckmark';
import TeamScoreUpdate from './TeamScoreUpdate';

// ── Read overrides from localStorage (same source as useCelebration) ─────
function getStoredOverrides() {
  try {
    const raw = localStorage.getItem('ss:celebration-overrides');
    if (raw) return JSON.parse(raw);
  } catch { /* no-op */ }
  return {};
}

// ── Read persona from localStorage ───────────────────────────────────────
function getPersona() {
  try {
    const cached = localStorage.getItem('ss:persona');
    if (cached && ['student', 'creator', 'professional', 'teamlead'].includes(cached)) {
      return cached;
    }
  } catch { /* no-op */ }
  return 'creator';
}

// ── Persona-aware message for checkmark / team notification ──────────────
function getMessage(eventType, persona, data) {
  const labels = {
    taskComplete: {
      student: 'Turned in! 🎮',
      creator: 'Shipped ✨',
      professional: 'Complete ✓',
      teamlead: 'Goal closed.',
    },
    xpAward: {
      student: `+${data?.xp || 0} XP!`,
      creator: `+${data?.xp || 0} Creative Energy`,
      professional: `+${data?.xp || 0} pts`,
      teamlead: `+${data?.xp || 0} TM`,
    },
    levelUp: {
      student: 'Level Up! 🎉',
      creator: 'New Stage Unlocked!',
      professional: 'Tier Promotion',
      teamlead: 'Leadership Milestone',
    },
    streakMilestone: {
      student: 'Study Streak! 🔥',
      creator: 'Creative Streak alive!',
      professional: 'Velocity streak maintained.',
      teamlead: 'Team streak holding.',
    },
    focusComplete: {
      student: 'Study block done! 📚',
      creator: 'Deep create session complete',
      professional: 'Deep work session complete.',
      teamlead: 'Focus sprint ended.',
    },
    shipCeremony: {
      student: 'Nice work! 🎉',
      creator: 'Another piece in the world ✨',
      professional: 'Delivered.',
      teamlead: 'Deployed to production.',
    },
  };

  return labels[eventType]?.[persona] || labels[eventType]?.creator || 'Done';
}

export default function CelebrationRouter() {
  const [celebration, setCelebration] = useState(null);
  const timerRef = useRef(null);

  // ── Dismiss helper ─────────────────────────────────────────────────
  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCelebration(null);
  }, []);

  // ── Core trigger logic ─────────────────────────────────────────────
  const handleTrigger = useCallback((eventType, data = {}) => {
    const persona = getPersona();

    // 1. Get persona + event config
    const config = getCelebrationConfig(persona, eventType);

    // 2. Apply user overrides
    const overrides = getStoredOverrides();
    const merged = { ...config };
    Object.keys(DEFAULT_OVERRIDES).forEach((key) => {
      if (overrides[key] !== null && overrides[key] !== undefined) {
        merged[key] = overrides[key];
      }
    });

    // 3. Skip if intensity is 'none'
    if (merged.animationIntensity === 'none') return;

    // 4. Calculate duration
    const duration = INTENSITY_DURATION[merged.animationIntensity] || INTENSITY_DURATION.medium;

    // 5. Clear existing
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 6. Set celebration
    setCelebration({
      id: `${eventType}-${Date.now()}`,
      eventType,
      persona,
      config: merged,
      data,
      duration,
    });

    // 7. Auto-dismiss
    timerRef.current = setTimeout(() => {
      setCelebration(null);
      timerRef.current = null;
    }, duration + 500);
  }, []);

  // ── Listen for window events ───────────────────────────────────────
  useEffect(() => {
    const onTrigger = (e) => {
      const { eventType, data } = e.detail || {};
      if (eventType) {
        handleTrigger(eventType, data);
      }
    };

    const onPreview = (e) => {
      const { eventType, data } = e.detail || {};
      handleTrigger(eventType || 'taskComplete', data || { xp: 50, taskTitle: 'Preview' });
    };

    window.addEventListener('celebration-trigger', onTrigger);
    window.addEventListener('celebration-preview', onPreview);

    return () => {
      window.removeEventListener('celebration-trigger', onTrigger);
      window.removeEventListener('celebration-preview', onPreview);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleTrigger]);

  // ── Nothing active? Render nothing ─────────────────────────────────
  if (!celebration) return null;

  const { config, eventType, data, duration, persona } = celebration;

  // ── Route to correct component based on persona ────────────────────
  switch (persona) {
    case 'student':
      return (
        <ConfettiBlast
          show={true}
          duration={duration}
          particleCount={config.animationIntensity === 'high' ? 50 : 30}
          showEmojiRain={config.emojiRain !== false}
          emojiCount={config.emojiRain !== false ? 15 : 0}
          onComplete={dismiss}
        />
      );

    case 'creator':
      return (
        <SubtleGlow
          show={true}
          duration={duration}
          showQuote={config.quotes !== false}
          eventType={eventType}
          data={data}
          onComplete={dismiss}
        />
      );

    case 'professional':
      return (
        <CleanCheckmark
          show={true}
          duration={duration}
          message={getMessage(eventType, persona, data)}
          data={data}
          onComplete={dismiss}
        />
      );

    case 'teamlead':
      return (
        <TeamScoreUpdate
          show={true}
          duration={duration}
          data={{
            title: getMessage(eventType, persona, data),
            teamName: data?.teamName || 'Team',
            xp: data?.xp,
            capacityFreed: data?.capacityFreed,
          }}
          onComplete={dismiss}
        />
      );

    default:
      return (
        <SubtleGlow
          show={true}
          duration={duration}
          showQuote={true}
          eventType={eventType}
          data={data}
          onComplete={dismiss}
        />
      );
  }
}
