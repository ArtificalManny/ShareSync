// src/components/goals/DailyGoalsCard.jsx
import React, { useEffect, useRef, useState } from 'react';
import socket from '../../utils/socket';

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

      // ✅ Graceful fallback if API returns empty/undefined
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
      // ✅ Hard fallback on network error
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

    // ✅ Recompute goals when these backend events fire
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
    // Debounce a bit so bursts don’t spam the API
    refetchTimer.current = setTimeout(loadGoals, 600);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-3 animate-pulse" />
        <div className="h-3 w-56 bg-slate-200 dark:bg-slate-700 rounded mb-2 animate-pulse" />
        <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Today’s Goals</div>
      {err && <div className="mt-1 text-xs text-rose-600 dark:text-rose-400">{err}</div>}
      <ul className="mt-2 space-y-2">
        {goals?.map(g => (
          <li key={g.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            <span>{g.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
