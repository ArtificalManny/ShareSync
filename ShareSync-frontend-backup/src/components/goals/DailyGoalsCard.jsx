// src/components/goals/DailyGoalsCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// 1) Title  2) Goal list  3) (optional) error state
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
import Card from '../common/Card';
import socket from '../../utils/socket';
import { Target } from 'lucide-react';

export default function DailyGoalsCard() {
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const refetchTimer = useRef(null);

  async function loadGoals() {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/goals/daily', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const safeGoals =
        (Array.isArray(data?.goals) && data.goals.length > 0)
          ? data.goals
          : [
              { id: 'fallback-1', title: 'Knock out one small task', done: false },
              { id: 'fallback-2', title: 'Write a quick project update', done: false },
            ];

      setGoals(safeGoals);
    } catch (e) {
      setErr('Failed to load daily goals.');
      setGoals([
        { id: 'fallback-1', title: 'Tidy your task list (2 min)', done: false },
        { id: 'fallback-2', title: 'Add one due date', done: false },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();

    const onStreak = () => scheduleRefetch();
    const onXP = () => scheduleRefetch();

    socket.on('streak:levelup', onStreak);
    socket.on('xp:milestone', onXP);

    return () => {
      socket.off('streak:levelup', onStreak);
      socket.off('xp:milestone', onXP);
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scheduleRefetch() {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(loadGoals, 600);
  }

  // Loading State
  if (loading) {
    return (
      <Card variant="ambient" padding="md">
        <div className="h-4 w-28 bg-surface-2 rounded mb-3 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-48 bg-surface-2 rounded animate-pulse" />
          <div className="h-3 w-36 bg-surface-2 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="ambient" padding="md">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-success" />
        <h3 className="text-sm font-medium text-text-primary">Today's Goals</h3>
      </div>
      
      {/* Error (if any) */}
      {err && (
        <p className="text-xs text-danger mb-2">{err}</p>
      )}
      
      {/* Goal List */}
      <ul className="space-y-2">
        {goals?.map(g => (
          <li 
            key={g.id} 
            className="flex items-start gap-2.5 text-sm"
          >
            <span 
              className={`
                mt-1.5 h-1.5 w-1.5 rounded-full shrink-0
                ${g.done ? 'bg-success' : 'bg-text-tertiary'}
              `} 
            />
            <span className={g.done ? 'text-text-tertiary line-through' : 'text-text-secondary'}>
              {g.title}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
