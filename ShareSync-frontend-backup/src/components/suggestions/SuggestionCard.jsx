
// src/components/suggestions/SuggestionCard.jsx

import React, { useState, useCallback } from 'react';

import {

  ThumbsUp, MessageCircle, CheckCircle, Clock, ChevronRight,

  ChevronDown, Send, Loader2,

} from 'lucide-react';

import { toast } from '../ui/toast';

import { addSuggestionComment, getSuggestionComments } from '../../api/suggestions';

 

const contextConfig = {

  task: { label: 'Task', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },

  announcement: { label: 'Feedback', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },

  general: { label: 'General', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },

  feature: { label: 'Feature', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },

};

 

function timeAgo(ts) {

  if (!ts) return 'Recently';

  const diff = Date.now() - new Date(ts).getTime();

  if (isNaN(diff) || diff < 0) return 'Recently';

  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);

  if (m < 1) return 'Just now';

  if (m < 60) return `${m}m ago`;

  if (h < 24) return `${h}h ago`;

  if (d < 7) return `${d}d ago`;

  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

}

 

const SuggestionCard = ({ suggestion, projectId, onVote, onImplement, canImplement = false, onClick }) => {

  const [implementing, setImplementing] = useState(false);

  const [showComments, setShowComments] = useState(false);

  const [comments, setComments] = useState(suggestion?.comments || []);

  const [loadingComments, setLoadingComments] = useState(false);

  const [newComment, setNewComment] = useState('');

  const [posting, setPosting] = useState(false);

 

  const suggestionId = suggestion?.id || suggestion?._id;

 

  const handleVote = (e) => {

    e.stopPropagation();

    onVote?.(suggestionId);

  };

 

  const handleImplement = async (e) => {

    e.stopPropagation();

    setImplementing(true);

    try { await onImplement?.(suggestionId); }

    catch { toast({ title: 'Failed', variant: 'error' }); }

    finally { setImplementing(false); }

  };

 

  const handleToggleComments = useCallback(async (e) => {

    e?.stopPropagation?.();

    const opening = !showComments;

    setShowComments(opening);

 

    if (opening && comments.length === 0 && suggestionId && projectId) {

      setLoadingComments(true);

      try {

        const fetched = await getSuggestionComments(projectId, suggestionId);

        setComments(Array.isArray(fetched) ? fetched : []);

      } catch { /* keep embedded comments */ }

      finally { setLoadingComments(false); }

    }

  }, [showComments, comments.length, suggestionId, projectId]);

 

  const handlePostComment = useCallback(async () => {

    const content = newComment.trim();

    if (!content || !suggestionId || !projectId || posting) return;

 

    setPosting(true);

    try {

      const created = await addSuggestionComment(projectId, suggestionId, content);

      setComments(prev => [...prev, created]);

      setNewComment('');

    } catch (err) {

      toast({ title: err?.message || 'Failed to post comment', variant: 'error' });

    } finally {

      setPosting(false);

    }

  }, [newComment, suggestionId, projectId, posting]);

 

  const context = contextConfig[suggestion?.context] || contextConfig.general;

  const isImplemented = suggestion?.implemented || suggestion?.status === 'completed';

  const commentCount = comments.length || suggestion?.comments?.length || 0;

  const voteCount = (suggestion?.upvotes?.length || 0);

 

  return (

    <div className={`group rounded-xl overflow-hidden

      bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06]

      hover:border-slate-300 dark:hover:border-white/[0.1] transition-all duration-200

      ${isImplemented ? 'opacity-70 border-l-2 border-l-emerald-500' : ''}`}>

 

      {/* Identity */}

      <div className="p-4 pb-3" onClick={onClick} role={onClick ? 'button' : undefined}>

        <div className="flex items-start justify-between gap-3">

          <div className="min-w-0 flex-1">

            <div className="flex items-center gap-2 mb-2">

              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${context.bg} ${context.color}`}>

                {context.label}

              </span>

              {suggestion?.visibility && (

                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/40">

                  {suggestion.visibility.charAt(0).toUpperCase() + suggestion.visibility.slice(1)}

                </span>

              )}

              {isImplemented && (

                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">

                  <CheckCircle className="w-3 h-3" /> Done

                </span>

              )}

            </div>

            <h3 className="text-sm font-medium text-slate-800 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">

              {suggestion?.title}

            </h3>

          </div>

          {onClick && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-white/20 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />}

        </div>

 

        <div className="flex items-center gap-2 mt-3">

          <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center text-[10px] font-medium text-violet-600 dark:text-violet-400">

            {suggestion?.authorId?.firstName?.[0] || suggestion?.author?.name?.[0] || '?'}

          </div>

          <span className="text-xs text-slate-500 dark:text-white/40">

            {suggestion?.authorId?.firstName || suggestion?.author?.name || 'Unknown'}

          </span>

          <span className="text-slate-300 dark:text-white/20">·</span>

          <span className="text-xs text-slate-400 dark:text-white/30 flex items-center gap-1">

            <Clock className="w-3 h-3" />

            {suggestion?.timeAgo || timeAgo(suggestion?.createdAt)}

          </span>

        </div>

      </div>

 

      {/* Content */}

      {suggestion?.content && (

        <div className="px-4 pb-3">

          <p className="text-xs text-slate-600 dark:text-white/50 line-clamp-2">{suggestion.content}</p>

        </div>

      )}

 

      {/* Actions */}

      <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between">

        <div className="flex items-center gap-4">

          <button onClick={handleVote} disabled={isImplemented}

            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-white/30 hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-50 transition-colors">

            <ThumbsUp className="w-3.5 h-3.5" />

            <span>{voteCount}</span>

          </button>

 

          <button onClick={handleToggleComments}

            className={`flex items-center gap-1.5 text-xs font-medium transition-colors

              ${showComments ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60'}`}>

            <MessageCircle className="w-3.5 h-3.5" />

            <span>{commentCount}</span>

            <ChevronDown className={`w-3 h-3 transition-transform ${showComments ? 'rotate-180' : ''}`} />

          </button>

        </div>

 

        {canImplement && !isImplemented && (

          <button onClick={handleImplement} disabled={implementing}

            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium

              bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400

              hover:bg-emerald-100 dark:hover:bg-emerald-500/20 disabled:opacity-50 transition-colors">

            <CheckCircle className="w-3.5 h-3.5" />

            {implementing ? '...' : 'Done'}

          </button>

        )}

      </div>

 

      {/* Comments */}

      {showComments && (

        <div className="border-t border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.02]">

          <div className="px-4 py-2 max-h-[300px] overflow-y-auto">

            {loadingComments ? (

              <div className="flex items-center gap-2 py-4 justify-center text-slate-400 dark:text-white/30">

                <Loader2 className="w-3.5 h-3.5 animate-spin" />

                <span className="text-xs">Loading comments...</span>

              </div>

            ) : comments.length === 0 ? (

              <p className="text-xs text-slate-400 dark:text-white/30 py-4 text-center">No comments yet — be the first!</p>

            ) : (

              comments.map((c, idx) => (

                <div key={c._id || idx} className="flex items-start gap-2 py-2 border-b border-slate-100 dark:border-white/[0.03] last:border-b-0">

                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/[0.08] flex items-center justify-center text-[9px] font-medium text-slate-500 dark:text-white/40 flex-shrink-0 mt-0.5">

                    {c.authorName?.[0] || '?'}

                  </div>

                  <div className="flex-1 min-w-0">

                    <div className="flex items-center gap-2">

                      <span className="text-[11px] font-medium text-slate-700 dark:text-white/70">{c.authorName || 'Unknown'}</span>

                      <span className="text-[10px] text-slate-400 dark:text-white/30">{timeAgo(c.createdAt)}</span>

                    </div>

                    <p className="text-xs text-slate-600 dark:text-white/50 mt-0.5">{c.content}</p>

                  </div>

                </div>

              ))

            )}

          </div>

 

          <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.04]">

            <div className="flex items-center gap-2">

              <input

                type="text"

                value={newComment}

                onChange={(e) => setNewComment(e.target.value)}

                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}

                placeholder="Add a comment..."

                maxLength={1000}

                className="flex-1 min-w-0 text-xs px-3 py-2 rounded-lg

                  bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08]

                  text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30

                  focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-shadow"

              />

              <button

                onClick={handlePostComment}

                disabled={posting || !newComment.trim()}

                className="p-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white

                  disabled:opacity-40 transition-colors"

              >

                {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};

 

export default SuggestionCard;

