// src/components/ai/AISuggestionCard.jsx
import React, { useEffect, useRef, useState } from 'react';

const CACHE_KEY = 'ai_suggestion_v1';

export default function AISuggestionCard() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const invalidateRef = useRef(false); // you can toggle this to force refresh on certain events

  async function loadSuggestion() {
    setLoading(true);
    setErr('');

    try {
      // ✅ session cache
      if (!invalidateRef.current) {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          setText(cached);
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/ai/suggestion', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const suggestion =
        (data?.suggestion && typeof data.suggestion === 'string')
          ? data.suggestion
          : 'Try finishing one tiny task to build momentum.';

      setText(suggestion);
      sessionStorage.setItem(CACHE_KEY, suggestion);
    } catch (e) {
      setErr('Failed to load suggestion.');
      // ✅ graceful fallback text
      const fallback = 'Try finishing one tiny task to build momentum.';
      setText(fallback);
      sessionStorage.setItem(CACHE_KEY, fallback);
    } finally {
      setLoading(false);
      invalidateRef.current = false; // reset invalidate flag
    }
  }

  useEffect(() => {
    loadSuggestion();

    // Optional: if you want to invalidate cached suggestion on level-up/xp:
    // const onInvalidate = () => { invalidateRef.current = true; loadSuggestion(); }
    // import socket and wire:
    // socket.on('streak:levelup', onInvalidate);
    // socket.on('xp:milestone', onInvalidate);
    // return () => { socket.off('streak:levelup', onInvalidate); socket.off('xp:milestone', onInvalidate); }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">AI Suggestion</div>
      {loading ? (
        <div className="mt-2 h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      ) : (
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{text}</p>
      )}
      {err && <div className="mt-1 text-xs text-rose-600 dark:text-rose-400">{err}</div>}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => { invalidateRef.current = true; loadSuggestion(); }}
          className="px-3 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs"
        >
          New idea
        </button>
      </div>
    </div>
  );
}
