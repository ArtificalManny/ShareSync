// src/context/PersonaContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.1: Persona Context Provider
// - Stores active persona in state
// - Reads from backend on mount (with localStorage cache for instant load)
// - Applies CSS class to <body> for theme overrides
// - Exposes t() translation function for persona-aware labels
//
// SAFETY: Falls back to 'creator' if anything fails. Zero impact on existing
// components unless they explicitly opt-in via usePersona() hook.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getPersonaLabel, getPersonaConfig, DEFAULT_PERSONA, PERSONA_IDS } from '../config/personaLanguage';
import { getUserPersona, updateUserPersona } from '../api/persona';

const PersonaContext = createContext(null);

const CACHE_KEY = 'ss:persona';

// ── Read cached persona from localStorage ────────────────────────────────
function getCachedPersona() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached && PERSONA_IDS.includes(cached)) return cached;
  } catch {
    // no-op
  }
  return DEFAULT_PERSONA;
}

// ── Write persona to localStorage ────────────────────────────────────────
function setCachedPersona(persona) {
  try {
    localStorage.setItem(CACHE_KEY, persona);
  } catch {
    // no-op
  }
}

// ── Apply CSS class to <body> ────────────────────────────────────────────
function applyBodyClass(persona) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  // Remove all persona classes
  PERSONA_IDS.forEach(id => body.classList.remove(`persona-${id}`));
  // Add current
  body.classList.add(`persona-${persona}`);
}

// ── Provider ─────────────────────────────────────────────────────────────
export function PersonaProvider({ children }) {
  const [persona, setPersonaState] = useState(getCachedPersona);
  const [loaded, setLoaded] = useState(false);

  // Apply body class whenever persona changes
  useEffect(() => {
    applyBodyClass(persona);
  }, [persona]);

  // Fetch from backend on mount (non-blocking)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoaded(true);
          return;
        }

        const data = await getUserPersona();
        if (!cancelled && data.persona && PERSONA_IDS.includes(data.persona)) {
          setPersonaState(data.persona);
          setCachedPersona(data.persona);
        }
      } catch (err) {
        // Non-fatal: keep cached/default persona
        console.warn('[PersonaContext] Failed to load persona from backend:', err?.message);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── setPersona: updates state + cache + backend ────────────────────
  const setPersona = useCallback(async (newPersona) => {
    if (!PERSONA_IDS.includes(newPersona)) {
      console.warn('[PersonaContext] Invalid persona:', newPersona);
      return;
    }

    // Optimistic update
    setPersonaState(newPersona);
    setCachedPersona(newPersona);

    // Persist to backend (non-blocking)
    try {
      await updateUserPersona(newPersona);
    } catch (err) {
      console.warn('[PersonaContext] Failed to save persona to backend:', err?.message);
      // Don't revert — the local change still works fine
    }
  }, []);

  // ── t() translation function ───────────────────────────────────────
  const t = useCallback((key) => {
    return getPersonaLabel(persona, key);
  }, [persona]);

  // ── Full config for current persona ────────────────────────────────
  const config = useMemo(() => {
    return getPersonaConfig(persona);
  }, [persona]);

  const value = useMemo(() => ({
    persona,
    setPersona,
    t,
    config,
    loaded,
  }), [persona, setPersona, t, config, loaded]);

  return (
    <PersonaContext.Provider value={value}>
      {children}
    </PersonaContext.Provider>
  );
}

// ── Raw context export (for useContext directly if needed) ────────────────
export { PersonaContext };

// ── Default hook export (convenience) ────────────────────────────────────
export function usePersonaContext() {
  const ctx = useContext(PersonaContext);
  if (!ctx) {
    // Return safe defaults if used outside provider
    return {
      persona: DEFAULT_PERSONA,
      setPersona: () => {},
      t: (key) => getPersonaLabel(DEFAULT_PERSONA, key),
      config: getPersonaConfig(DEFAULT_PERSONA),
      loaded: false,
    };
  }
  return ctx;
}

export default PersonaContext;
