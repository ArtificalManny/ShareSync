// src/components/project/bio-feed/PinnedAnnouncement.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: Pinned Announcement Card
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Megaphone, Pin, Plus, ChevronUp, Users } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// Native relative time formatter (no date-fns dependency)
// ═══════════════════════════════════════════════════════════════════════════════
function formatDistanceToNow(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return past.toLocaleDateString();
}

export default function PinnedAnnouncement({ announcement, onClick, onNew }) {
  if (!announcement) {
    return (
      <div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand/10">
              <Megaphone className="w-4 h-4 text-brand" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">Announcements</h3>
          </div>
          
          <button 
            onClick={onNew}
            className="
              p-1.5 rounded-lg
              bg-brand/10 text-brand
              hover:bg-brand/20
              transition-colors
            "
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="py-6 text-center">
          <Megaphone className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-tertiary">No announcements yet</p>
          <button 
            onClick={onNew}
            className="mt-2 text-sm text-brand hover:text-brand-400"
          >
            Create one
          </button>
        </div>
      </div>
    );
  }

  const {
    title,
    body,
    author,
    createdAt,
  } = announcement;

  const timeAgo = createdAt 
    ? formatDistanceToNow(new Date(createdAt))
    : '';

  return (
    <div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-brand/10">
            <Megaphone className="w-4 h-4 text-brand" />
          </div>
          <h3 className="text-sm font-medium text-text-secondary">Announcements</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-tertiary flex items-center gap-1">
            <Users className="w-3 h-3" />
            Only project members can see this
          </span>
          
          <button 
            onClick={onNew}
            className="
              p-1.5 rounded-lg
              bg-brand/10 text-brand
              hover:bg-brand/20
              transition-colors
            "
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pinned Post */}
      <button
        onClick={onClick}
        className="
          w-full p-4 rounded-xl text-left
          bg-surface-2/50 border border-white/[0.04]
          hover:bg-surface-2 hover:border-white/[0.08]
          transition-all duration-200
        "
      >
        {/* Pin Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-warning/10 text-warning text-[10px] font-medium">
            <Pin className="w-3 h-3" />
            Pinned
          </span>
        </div>

        {/* Title */}
        <h4 className="text-base font-semibold text-text-primary mb-2">
          {title}
        </h4>

        {/* Body */}
        {body && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-3">
            {body}
          </p>
        )}

        {/* Author & Time */}
        <div className="flex items-center gap-3 text-xs text-text-tertiary">
          {author && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-surface-3 overflow-hidden">
                {author.avatar ? (
                  <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-text-tertiary">
                    {author.name?.charAt(0)}
                  </div>
                )}
              </div>
              <span>{author.name}</span>
            </div>
          )}
          
          <span>•</span>
          <span>{timeAgo}</span>
        </div>
      </button>

      {/* Expand */}
      <button className="
        w-full mt-3 py-2 rounded-lg
        text-xs text-text-tertiary
        hover:text-text-secondary hover:bg-surface-2
        transition-colors
        flex items-center justify-center gap-1
      ">
        <ChevronUp className="w-3 h-3" />
        View all announcements
      </button>
    </div>
  );
}
