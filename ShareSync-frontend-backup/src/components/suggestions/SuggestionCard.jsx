// src/components/suggestions/SuggestionCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 4: Information Architecture
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ZONE PATTERN (Asana-style consistent scanning):
//
// This component is a CARD (not a row), so zones stack vertically:
// ZONE 1: Identity - Title + Context + Author
// ZONE 2: Status - Content preview + Attachments
// ZONE 3: Action - Vote + Comments + Implement
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { toast } from '../ui/toast';

/* ─────────────────────────────────────────────────────────────────────────
   CONTEXT CONFIG
───────────────────────────────────────────────────────────────────────── */
const contextConfig = {
  task: { label: 'Task', color: 'text-brand', bg: 'bg-brand/10' },
  announcement: { label: 'Announcement', color: 'text-warning', bg: 'bg-warning/10' },
  general: { label: 'General', color: 'text-success', bg: 'bg-success/10' },
  feature: { label: 'Feature', color: 'text-brand', bg: 'bg-brand/10' },
};

/* ─────────────────────────────────────────────────────────────────────────
   ATTACHMENT GALLERY — displays uploaded images on the suggestion card
───────────────────────────────────────────────────────────────────────── */
function AttachmentGallery({ attachments }) {
  const urls = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  if (urls.length === 0) return null;

  const gridClass = urls.length === 1 ? '' : 'grid grid-cols-2 gap-2';

  return (
    <div className={"px-4 pb-3 " + gridClass}>
      {urls.map(function(url, i) {
        return (
          <a
            key={"att-" + i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={function(e) { e.stopPropagation(); }}
            className="block rounded-lg overflow-hidden border border-slate-200 dark:border-white/[0.08] hover:opacity-90 transition-opacity"
          >
            <img
              src={url}
              alt={"Attachment " + (i + 1)}
              className="w-full max-h-64 object-cover"
              onError={function(e) { e.target.style.display = 'none'; }}
            />
          </a>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────── */
const SuggestionCard = ({ suggestion, onVote, onImplement, canImplement = false, onClick }) => {
  const [voted, setVoted] = useState(false);
  const [implementing, setImplementing] = useState(false);

  const suggestionId = suggestion.id || suggestion._id;

  const handleVote = (e) => {
    e.stopPropagation();
    if (voted) {
      toast({ title: 'Already voted', variant: 'default' });
      return;
    }
    setVoted(true);
    onVote?.(suggestionId);
    toast({ title: 'Vote counted!', variant: 'success' });
  };

  const handleImplement = async (e) => {
    e.stopPropagation();
    setImplementing(true);
    try {
      await onImplement?.(suggestionId);
      toast({ title: 'Suggestion marked as implemented!', variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to implement', variant: 'error' });
    } finally {
      setImplementing(false);
    }
  };

  const context = contextConfig[suggestion.context] || contextConfig.general;
  const isImplemented = suggestion.implemented || suggestion.status === 'completed';

  // Author display
  const authorInitial = suggestion.authorId?.firstName?.[0] || suggestion.author?.name?.[0] || '?';
  const authorName = suggestion.authorId?.firstName
    ? (suggestion.authorId.firstName + ' ' + (suggestion.authorId.lastName || '')).trim()
    : (suggestion.author?.name || 'Unknown');
  const timeDisplay = suggestion.timeAgo || (suggestion.createdAt
    ? new Date(suggestion.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '');

  return (
    <div
      onClick={onClick}
      className={
        "group rounded-xl overflow-hidden bg-surface-1 border border-white/[0.06] hover:bg-surface-2 hover:border-white/[0.1] transition-all duration-200"
        + (onClick ? " cursor-pointer" : "")
        + (isImplemented ? " opacity-70 border-l-2 border-l-success" : "")
      }
    >
      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 1: Identity
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Context + Visibility + Implemented badges */}
            <div className="flex items-center gap-2 mb-2">
              <span className={"text-[10px] font-medium px-2 py-0.5 rounded " + context.bg + " " + context.color}>
                {context.label}
              </span>
              {suggestion.visibility && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/40 capitalize">
                  {suggestion.visibility}
                </span>
              )}
              {isImplemented && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-success">
                  <CheckCircle className="w-3 h-3" />
                  Done
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors line-clamp-2">
              {suggestion.title}
            </h3>

            {/* Related to */}
            {suggestion.targetName && (
              <p className="text-xs text-text-tertiary mt-1">
                {"\u2192 "}{suggestion.targetName}
              </p>
            )}
          </div>

          {/* Chevron */}
          {onClick && (
            <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          )}
        </div>

        {/* Author + Time */}
        <div className="flex items-center gap-2 mt-3">
          <div className="w-5 h-5 rounded-full bg-surface-3 flex items-center justify-center text-[10px] font-medium text-text-secondary">
            {authorInitial}
          </div>
          <span className="text-xs text-text-tertiary">{authorName}</span>
          <span className="text-text-tertiary opacity-50">{"\u00B7"}</span>
          <span className="text-xs text-text-tertiary flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeDisplay}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 2: Status — Content + Attachments
      ═══════════════════════════════════════════════════════════════════ */}
      {suggestion.content && (
        <div className="px-4 pb-3">
          <p className="text-xs text-text-secondary line-clamp-3">
            {suggestion.content}
          </p>
        </div>
      )}

      {/* Attachment gallery */}
      <AttachmentGallery attachments={suggestion.attachments} />

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 3: Action — Vote + Comments + Implement
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-3 border-t border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Vote Button */}
          <button
            onClick={handleVote}
            disabled={voted || isImplemented}
            className={
              "flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed "
              + (voted ? "text-brand" : "text-text-tertiary hover:text-brand")
            }
          >
            <ThumbsUp className={"w-3.5 h-3.5" + (voted ? " fill-current" : "")} />
            <span>{(suggestion.votes || 0) + (suggestion.upvotes?.length || 0) + (voted ? 1 : 0)}</span>
          </button>

          {/* Comments Count */}
          <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <MessageCircle className="w-3.5 h-3.5" />
            {suggestion.comments?.length || suggestion.commentCount || 0}
          </span>
        </div>

        {/* Implement Button */}
        {canImplement && !isImplemented && (
          <button
            onClick={handleImplement}
            disabled={implementing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-success/10 text-success hover:bg-success hover:text-white disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {implementing ? '...' : 'Done'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SuggestionCard;
