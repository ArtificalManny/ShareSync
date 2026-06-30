// src/components/profile/ProfileStrength.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY 1: Profile Strength Card — shows completion % and missing fields
// Plugs into Profile.jsx as a standalone card
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import client from '../../api/client';

// ── Field checklist (matches backend getProfileStrength) ─────────────────
const FIELD_LABELS = {
  hasName: 'Full name',
  hasAvatar: 'Profile photo',
  hasBio: 'Bio',
  hasArchetype: 'Work archetype',
  hasProject: 'First project',
  hasTask: 'First task',
  hasLocation: 'Location',
  hasWebsite: 'Website',
};

export default function ProfileStrength({ onEditClick }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: res } = await client.get('/users/me/profile-strength');
        const strength = res?.data || res;
        if (!cancelled) setData(strength);
      } catch (err) {
        if (err?.response?.status !== 401) {
          console.warn('[ProfileStrength] Load failed:', err?.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-1/3 mb-4" />
        <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded w-full mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-2/3" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const percentage = data.percentage ?? 0;
  const completedFields = data.completedFields || [];
  const missingFields = data.missingFields || [];
  const isComplete = percentage >= 100;

  // Color based on completion
  const barColor = isComplete
    ? 'bg-teal-500'
    : percentage >= 60
      ? 'bg-violet-500'
      : 'bg-amber-500';

  const textColor = isComplete
    ? 'text-teal-600 dark:text-teal-400'
    : percentage >= 60
      ? 'text-violet-600 dark:text-violet-400'
      : 'text-amber-600 dark:text-amber-400';

  return (
    <div
      className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
      style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className={`w-4 h-4 ${textColor}`} />
          <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Profile Strength</h3>
        </div>
        <span className={`text-lg font-bold ${textColor}`}>{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-2.5">
        {completedFields.map((field) => (
          <div key={field} className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
            <span className="text-sm text-slate-600 dark:text-zinc-300">{FIELD_LABELS[field] || field}</span>
          </div>
        ))}
        {missingFields.map((field) => (
          <div key={field} className="flex items-center gap-2.5">
            <Circle className="w-4 h-4 text-slate-300 dark:text-zinc-600 shrink-0" />
            <span className="text-sm text-slate-400 dark:text-zinc-500">{FIELD_LABELS[field] || field}</span>
          </div>
        ))}
      </div>

      {/* CTA if not complete */}
      {!isComplete && onEditClick && (
        <button
          onClick={onEditClick}
          className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all shadow-md hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 Available)' }}
        >
          Complete your profile
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
