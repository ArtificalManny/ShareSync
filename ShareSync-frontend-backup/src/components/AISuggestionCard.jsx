// src/components/AISuggestionCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// FIXED: Now uses the authorized API client to talk to the new NestJS AI Module
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
import Card from './common/Card';
import { Sparkles, RefreshCw } from 'lucide-react';
import { getAiSuggestion } from '../api/ai';

const CACHE_KEY = 'ai_suggestion_v1';

export default function AISuggestionCard() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const invalidateRef = useRef(false);

  async function loadSuggestion() {
    setLoading(true);
    setErr('');

    try {
      if (!invalidateRef.current) {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          setText(cached);
          setLoading(false);
          return;
        }
      }

      // Hit our new NestJS endpoint securely
      const data = await getAiSuggestion();

      const suggestion =
        (data?.suggestion && typeof data.suggestion === 'string')
          ? data.suggestion
          : 'Try finishing one tiny task to build momentum.';

      setText(suggestion);
      sessionStorage.setItem(CACHE_KEY, suggestion);
    } catch (e) {
      console.error('[AISuggestionCard] Error fetching suggestion:', e);
      setErr('Failed to load suggestion.');
      const fallback = 'Try finishing one tiny task to build momentum.';
      setText(fallback);
      sessionStorage.setItem(CACHE_KEY, fallback);
    } finally {
      setLoading(false);
      invalidateRef.current = false;
    }
  }

  useEffect(() => {
    loadSuggestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    invalidateRef.current = true;
    loadSuggestion();
  };

  return (
    <Card variant="elevated" padding="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-medium text-text-primary">AI Coach</h3>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="
            p-1.5 rounded-lg
            text-text-tertiary hover:text-text-primary
            hover:bg-surface-2
            disabled:opacity-50
            transition-colors
          "
          aria-label="Get new suggestion"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="h-4 w-3/4 bg-surface-2 rounded animate-pulse" />
      ) : (
        <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
      )}

      {/* Error */}
      {err && (
        <p className="mt-2 text-xs text-danger">{err}</p>
      )}
    </Card>
  );
}
