// src/api/persona.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.1: Persona API helpers
// GET  /api/users/persona — reads current persona
// PUT  /api/users/persona — saves persona preference
// ═══════════════════════════════════════════════════════════════════════════════

const API = import.meta.env.VITE_API_URL || '';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── GET /api/users/persona ───────────────────────────────────────────────
export async function getUserPersona() {
  try {
  const res = await fetch(`${API}/api/users/persona`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to fetch persona (${res.status})`);
  }

  return res.json();
}

// ── PUT /api/users/persona ───────────────────────────────────────────────
export async function updateUserPersona(persona) {
  try {
  const res = await fetch(`${API}/api/users/persona`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ persona }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to update persona (${res.status})`);
  }

  return res.json();
}
