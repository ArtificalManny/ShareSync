// src/components/community/TipCard.jsx - Week 9 Day 1-2
import React, { useState } from 'react';
import { Lightbulb, ThumbsUp, MessageCircle, Share2, Copy, Check } from 'lucide-react';
import { toast } from '../ui/toast';

/**
 * TipCard - Display a community tip
 * Shows tip content, author, likes, comments, share
 */
const TipCard = ({ tip, onLike, onComment }) => {
  const [liked, setLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const categoryColors = {
    productivity: 'from-purple-600 to-fuchsia-600',
    streaks: 'from-orange-600 to-red-600',
    focus: 'from-blue-600 to-cyan-600',
    teamwork: 'from-emerald-600 to-green-600',
    motivation: 'from-yellow-600 to-orange-600'
  };

  const categoryEmojis = {
    productivity: '⚡',
    streaks: '🔥',
    focus: '🎯',
    teamwork: '🤝',
    motivation: '💪'
  };

  const handleLike = () => {
    setLiked(!liked);
    onLike?.(tip.id);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/community/tips/${tip.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ 
      title: '🔗 Link copied!', 
      description: 'Share this tip with others',
      variant: 'success' 
    });
    setTimeout(() => {
      setCopied(false);
      setShowShareMenu(false);
    }, 2000);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl hover:border-purple-500/40 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-gradient-to-r ${categoryColors[tip.category] || categoryColors.productivity} rounded-xl flex items-center justify-center`}>
            <span className="text-lg">{categoryEmojis[tip.category] || '⚡'}</span>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{tip.title}</h3>
            <p className="text-xs text-slate-400">
              by <span className="text-purple-400">{tip.author}</span> · {tip.timeAgo}
            </p>
          </div>
        </div>

        {/* Share Button */}
        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {copied ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <Share2 className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showShareMenu && !copied && (
            <div className="absolute right-0 top-12 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 w-48 z-10">
              <button
                onClick={handleShare}
                className="w-full px-4 py-2 hover:bg-slate-800 rounded-lg text-left text-sm text-white flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
          {tip.content}
        </p>
      </div>

      {/* Tags */}
      {tip.tags && tip.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tip.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-slate-700/50">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            liked
              ? 'bg-purple-500/20 text-purple-400'
              : 'hover:bg-slate-700 text-slate-400'
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          <span className="text-sm font-semibold">{tip.likes + (liked ? 1 : 0)}</span>
        </button>

        <button
          onClick={() => onComment?.(tip.id)}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-semibold">{tip.comments}</span>
        </button>

        <div className="ml-auto text-xs text-slate-500">
          {tip.views} views
        </div>
      </div>
    </div>
  );
};

export default TipCard;
