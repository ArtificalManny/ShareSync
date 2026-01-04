// src/components/suggestions/SuggestionCard.jsx - Public suggestion with voting
import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from '../ui/toast';

/**
 * SuggestionCard - Display a public suggestion with voting
 * Used in public projects for spectator feedback
 */
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
    toast({ title: '👍 Vote counted!', variant: 'success' });
  };

  const handleImplement = async () => {
    setImplementing(true);
    try {
      await onImplement?.(suggestion.id);
      toast({ title: '✅ Suggestion marked as implemented!', variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to implement', variant: 'error' });
    } finally {
      setImplementing(false);
    }
  };

  const getContextBadge = (context) => {
    const badges = {
      task: { label: '📋 Task', color: 'bg-blue-500/20 border-blue-500/30 text-blue-400' },
      announcement: { label: '📢 Announcement', color: 'bg-purple-500/20 border-purple-500/30 text-purple-400' },
      general: { label: '💡 General', color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' },
      feature: { label: '✨ Feature', color: 'bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-400' }
    };
    return badges[context] || badges.general;
  };

  const badge = getContextBadge(suggestion.context);

  return (
    <div className={`bg-slate-800/50 backdrop-blur-xl border rounded-2xl p-6 shadow-xl transition-all ${
      suggestion.implemented 
        ? 'border-emerald-500/30 bg-emerald-500/5' 
        : 'border-purple-500/20 hover:border-purple-500/40'
    }`}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 ${badge.color} border rounded-full text-xs font-semibold`}>
              {badge.label}
            </span>
            {suggestion.implemented && (
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Implemented
              </span>
            )}
          </div>
          <h3 className="font-bold text-white text-lg mb-1">{suggestion.title}</h3>
          {suggestion.targetName && (
            <p className="text-sm text-slate-400">
              Related to: <span className="text-purple-400">{suggestion.targetName}</span>
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-slate-300 mb-4 leading-relaxed">
        {suggestion.content}
      </p>

      {/* Author & Time */}
      <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {suggestion.author.avatar || suggestion.author.name[0]}
        </div>
        <span className="text-slate-400">{suggestion.author.name}</span>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{suggestion.timeAgo}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-4">
          {/* Vote Button */}
          <button
            onClick={handleVote}
            disabled={voted || suggestion.implemented}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              voted 
                ? 'bg-purple-500/20 text-purple-400 cursor-not-allowed'
                : 'bg-slate-700 hover:bg-purple-500/20 hover:text-purple-400'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${voted ? 'fill-current' : ''}`} />
            <span>{suggestion.votes + (voted ? 1 : 0)}</span>
          </button>

          {/* Comments */}
          <div className="flex items-center gap-2 text-slate-400">
            <MessageCircle className="w-4 h-4" />
            <span>{suggestion.comments}</span>
          </div>
        </div>

        {/* Implement Button (for project members) */}
        {canImplement && !suggestion.implemented && (
          <button
            onClick={handleImplement}
            disabled={implementing}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {implementing ? 'Implementing...' : 'Mark as Done'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SuggestionCard;
