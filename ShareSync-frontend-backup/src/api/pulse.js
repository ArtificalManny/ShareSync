// src/api/pulse.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.4: Pulse Check API Helpers
// ═══════════════════════════════════════════════════════════════════════════════
//
// POST /api/pulse/submit   — Submit today's pulse (+15 XP)
// GET  /api/pulse/history   — Personal pulse history
// GET  /api/pulse/team/:id  — Team energy heatmap data
//
// ═══════════════════════════════════════════════════════════════════════════════

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ─────────────────────────────────────────────────────────────────────────
// SUBMIT PULSE
// ─────────────────────────────────────────────────────────────────────────
export async function submitPulse({ energy, focusTaskId, blocker }) {
  try {
    const res = await axios.post(`${API_BASE}/pulse/submit`, {
      energy,
      focusTaskId: focusTaskId || null,
      blocker: blocker || { hasBlocker: false, description: '' },
    });
    return res.data;
  } catch (err) {
    console.error('[pulse.js] submitPulse error:', err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// GET HISTORY (personal)
// ─────────────────────────────────────────────────────────────────────────
export async function getPulseHistory(days = 30) {
  try {
    const res = await axios.get(`${API_BASE}/pulse/history`, {
      params: { days },
    });
    return res.data;
  } catch (err) {
    console.error('[pulse.js] getPulseHistory error:', err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// GET TEAM ENERGY (for heatmap)
// ─────────────────────────────────────────────────────────────────────────
export async function getTeamEnergy(projectId, days = 14) {
  try {
    const res = await axios.get(`${API_BASE}/pulse/team/${projectId}`, {
      params: { days },
    });
    return res.data;
  } catch (err) {
    console.error('[pulse.js] getTeamEnergy error:', err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK IF PULSE SUBMITTED TODAY (lightweight)
// ─────────────────────────────────────────────────────────────────────────
export async function checkPulseToday() {
  try {
    const res = await axios.get(`${API_BASE}/pulse/history`, {
      params: { days: 1 },
    });
    const pulses = res.data?.pulses || [];
    const today = new Date().toDateString();
    return pulses.some((p) => new Date(p.date || p.createdAt).toDateString() === today);
  } catch (err) {
    // If backend isn't ready, don't block the UI
    console.warn('[pulse.js] checkPulseToday fallback:', err?.message);
    return false;
  }
}
