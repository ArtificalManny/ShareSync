// src/components/suggestions/SuggestionCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// 1) Title + context badge  2) Content  3) Author + votes
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, CheckCircle, Clock } from 'lucide-react';
import Card, { CardBadge } from '../common/Card';
import { toast } from '../ui/toast';

/* ─────────────────────────────────────────────────────────────────────────
   CONTEXT BADGE CONFIG
───────────────────────────────────────────────────────────────────────── */
const contextConfig = {
  task: { label: 'Task', variant: 'brand' },
  announcement: { label: 'Announcement', variant: 'warning' },
  general: { label: 'General', variant: 'success' },
  feature: { label: 'Feature', variant: 'brand' },
};

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────── */
const SuggestionCard = ({ suggestion, onVote, onImplement, canImplement = false }) => {
  const [voted, setVoted] = useState(false);
  const [implementing, setImplementing] = useState(false);

  const handleVote = () => {
    if (voted) {
      toast({ title: 'Already voted', variant: 'default' });
      return;
    }
    setVoted(true);
    onVote?.(suggestion.id);
    toast({ title: 'Vote counted!', variant: 'success' });
  };

  const handleImplement = async () => {
    setImplementing(true);
    try {
      await onImplement?.(suggestion.id);
      toast({ title: 'Suggestion marked as implemented!', variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to implement', variant: 'error' });
    } finally {
      setImplementing(false);
    }
  };

  const context = contextConfig[suggestion.context] || contextConfig.general;

  return (
    <Card 
      variant={suggestion.implemented ? 'ambient' : 'elevated'}
      status={suggestion.implemented ? 'success' : null}
      padding="md"
    >
      {/* Header: Title + Badge */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <CardBadge variant={context.variant}>
            {context.label}
          </CardBadge>
          {suggestion.implemented && (
            <CardBadge variant="success">
              <CheckCircle className="w-3 h-3 mr-1" />
              Implemented
            </CardBadge>
          )}
        </div>
        
        {/* Element 1: Title */}
        <h3 className="text-base font-semibold text-text-primary">
          {suggestion.title}
        </h3>
        
        {suggestion.targetName && (
          <p className="text-xs text-text-tertiary mt-1">
            Related to: <span className="text-brand">{suggestion.targetName}</span>
          </p>
        )}
      </div>

      {/* Element 2: Content */}
      <p className="text-sm text-text-secondary mb-4 line-clamp-3">
        {suggestion.content}
      </p>

      {/* Element 3: Author + Time */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center text-white text-xs font-medium">
          {suggestion.author?.avatar || suggestion.author?.name?.[0] || '?'}
        </div>
        <span className="text-xs text-text-secondary">{suggestion.author?.name}</span>
        <span className="text-text-tertiary">·</span>
        <span className="text-xs text-text-tertiary flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {suggestion.timeAgo}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3">
          {/* Vote Button */}
          <button
            onClick={handleVote}
            disabled={voted || suggestion.implemented}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              transition-colors
              ${voted 
                ? 'bg-brand/10 text-brand cursor-not-allowed'
                : 'bg-surface-2 text-text-secondary hover:bg-brand/10 hover:text-brand'
              }
              disabled:opacity-50
            `}
          >
            <ThumbsUp className={`w-4 h-4 ${voted ? 'fill-current' : ''}`} />
            <span>{suggestion.votes + (voted ? 1 : 0)}</span>
          </button>

          {/* Comments Count */}
          <div className="flex items-center gap-1.5 text-text-tertiary text-sm">
            <MessageCircle className="w-4 h-4" />
            <span>{suggestion.comments || 0}</span>
          </div>
        </div>

        {/* Implement Button */}
        {canImplement && !suggestion.implemented && (
          <button
            onClick={handleImplement}
            disabled={implementing}
            className="
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              bg-success text-white
              hover:bg-success/90
              disabled:opacity-50
              transition-colors
            "
          >
            <CheckCircle className="w-4 h-4" />
            {implementing ? 'Implementing...' : 'Mark Done'}
          </button>
        )}
      </div>
    </Card>
  );
};

export default SuggestionCard;
