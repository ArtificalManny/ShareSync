// src/hooks/usePersona.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.1: Convenience hook for persona system
// Returns { persona, setPersona, t, config, loaded }
//
// Usage in any component:
//   import { usePersona } from '../hooks/usePersona';
//   const { t, persona } = usePersona();
//   return <span>{t('xp')}: 150</span>; // "XP: 150" or "Impact Score: 150"
// ═══════════════════════════════════════════════════════════════════════════════

import { usePersonaContext } from '../context/PersonaContext';

export function usePersona() {
  return usePersonaContext();
}

export default usePersona;
