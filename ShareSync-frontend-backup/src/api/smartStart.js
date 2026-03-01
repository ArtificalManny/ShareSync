// src/api/smartStart.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.1: Smart Start API helper
// POST /api/projects/smart-start → AI-generated project plan
// ═══════════════════════════════════════════════════════════════════════════════

const API = import.meta.env.VITE_API_URL || '';

export async function generateSmartStart(description, persona = null) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API}/api/projects/smart-start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ description, persona })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Smart Start failed (${res.status})`);
  }

  const data = await res.json();
  return {
    tasks: data.tasks || [],
    timeline: data.timeline || '',
    suggestedView: data.suggestedView || 'board',
    milestones: data.milestones || []
  };
}
