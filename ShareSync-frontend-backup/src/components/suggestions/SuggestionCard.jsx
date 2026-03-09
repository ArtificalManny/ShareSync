// src/components/suggestions/SuggestionCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ⭐ UPGRADE: Item 6 - Spectator Badges & Moderator Triage Actions added
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import { ThumbsUp, MessageCircle, CheckCircle, Clock, ChevronRight, MoreHorizontal, Globe, Users, Lock, Trash2, PlusSquare } from 'lucide-react';
import { toast } from '../ui/toast';

const contextConfig = {
  task: { label: 'Task', color: 'text-brand', bg: 'bg-brand/10' },
  announcement: { label: 'Announcement', color: 'text-warning', bg: 'bg-warning/10' },
  general: { label: 'General', color: 'text-success', bg: 'bg-success/10' },
  feature: { label: 'Feature', color: 'text-brand', bg: 'bg-brand/10' },
};

const visibilityConfig = {
  draft: { label: 'Draft', color: 'text-slate-500', bg: 'bg-slate-500/10', icon: Lock },
  internal: { label: 'Internal', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Users },
  public: { label: 'Public', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Globe },
};

const SuggestionCard = ({ 
  suggestion, 
  onVote, 
  onImplement, 
  onUpdateVisibility,
  onConvertToTask,
  onDelete,
  canImplement = false, 
  canModerate = false,
  onClick 
}) => {
  const [voted, setVoted] = useState(false);
  const [implementing, setImplementing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleVote = (e) => {
    e.stopPropagation();
    if (voted) return toast({ title: 'Already voted', variant: 'default' });
    setVoted(true);
    onVote?.(suggestion.id || suggestion._id);
    toast({ title: 'Vote counted!', variant: 'success' });
  };

  const handleImplement = async (e) => {
    e.stopPropagation();
    setImplementing(true);
    try {
      await onImplement?.(suggestion.id || suggestion._id);
      toast({ title: 'Suggestion marked as implemented!', variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to implement', variant: 'error' });
    } finally {
      setImplementing(false);
    }
  };

  const handleAction = (e, actionFn) => {
    e.stopPropagation();
    setShowMenu(false);
    actionFn?.();
  };

  const context = contextConfig[suggestion.context || 'general'] || contextConfig.general;
  const visibility = visibilityConfig[suggestion.visibility || 'draft'] || visibilityConfig.draft;
  const isImplemented = suggestion.status === 'completed' || suggestion.implemented;
  const VisIcon = visibility.icon;
  const isSpectator = suggestion.visibility === 'draft'; // Quick inference based on default logic

  return (
    <div 
      onClick={onClick}
      className={`
        group rounded-xl overflow-hidden relative
        bg-white border border-slate-200 shadow-sm
        hover:border-violet-300 hover:shadow-md
        transition-all duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${isImplemented ? 'opacity-70 border-l-4 border-l-emerald-500' : ''}
      `}
    >
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${context.bg} ${context.color}`}>
                {context.label}
              </span>
              
              <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-100 ${visibility.bg} ${visibility.color}`}>
                <VisIcon className="w-3 h-3" />
                {visibility.label}
              </span>

              {isImplemented && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 ml-1">
                  <CheckCircle className="w-3 h-3" />
                  Done
                </span>
              )}
            </div>
            
            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-violet-600 transition-colors line-clamp-2 pr-6">
              {suggestion.title}
            </h3>
          </div>

          {canModerate && (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Triage Actions</div>
                  
                  <button onClick={(e) => handleAction(e, () => onConvertToTask?.(suggestion))} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                    <PlusSquare className="w-3.5 h-3.5 text-violet-500" /> Convert to Task
                  </button>

                  <div className="h-px bg-slate-100 my-1" />
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visibility</div>
                  
                  <button onClick={(e) => handleAction(e, () => onUpdateVisibility?.(suggestion.id || suggestion._id, 'public'))} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                    <Globe className="w-3.5 h-3.5" /> Public
                  </button>
                  <button onClick={(e) => handleAction(e, () => onUpdateVisibility?.(suggestion.id || suggestion._id, 'internal'))} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                    <Users className="w-3.5 h-3.5" /> Internal
                  </button>
                  <button onClick={(e) => handleAction(e, () => onUpdateVisibility?.(suggestion.id || suggestion._id, 'draft'))} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                    <Lock className="w-3.5 h-3.5" /> Draft
                  </button>

                  <div className="h-px bg-slate-100 my-1" />
                  
                  <button onClick={(e) => handleAction(e, () => onDelete?.(suggestion.id || suggestion._id))} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Reject (Delete)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
            {suggestion.author?.name?.[0] || suggestion.authorId?.firstName?.[0] || '?'}
          </div>
          <span className="text-xs font-medium text-slate-600">
            {suggestion.author?.name || `${suggestion.authorId?.firstName || 'Unknown'} ${suggestion.authorId?.lastName || ''}`.trim()}
          </span>
          
          {isSpectator && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
              Spectator
            </span>
          )}

          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {suggestion.timeAgo || 'Recently'}
          </span>
        </div>
      </div>

      {suggestion.content && (
        <div className="px-4 pb-3">
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {suggestion.content}
          </p>
        </div>
      )}

      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleVote}
            disabled={voted || isImplemented}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${voted ? 'text-violet-600' : 'text-slate-500 hover:text-violet-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${voted ? 'fill-current' : ''}`} />
            <span>{(suggestion.votes || 0) + (suggestion.upvotes?.length || 0) + (voted ? 1 : 0)}</span>
          </button>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <MessageCircle className="w-3.5 h-3.5" />
            {suggestion.comments || 0}
          </span>
        </div>

        {canImplement && !isImplemented && (
          <button
            onClick={handleImplement}
            disabled={implementing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white disabled:opacity-50 transition-colors"
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
