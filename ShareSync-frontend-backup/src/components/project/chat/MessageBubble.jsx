// src/components/project/chat/MessageBubble.jsx - PHASE 2 ENHANCED
import React from 'react';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { formatTimestamp } from '../../../utils/chatUtils';
import TypeBadge from './TypeBadge';
import ReactionBar from './ReactionBar';

export default function MessageBubble({ 
  message, 
  isCurrentUser, 
  onReact, 
  onResolve,
  onReply 
}) {
  const isDecision = message.type === 'decision';
  const isQuestion = message.type === 'question';
  const canResolve = isQuestion && !message.resolved && (isCurrentUser || message.canResolve);

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        isDecision 
          ? 'bg-green-500/10 border-green-500/30 ring-2 ring-green-500/20' 
          : 'bg-slate-800/50 border-slate-700/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
          {message.authorAvatar ? (
            <img
              src={message.authorAvatar}
              alt={message.authorName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
              {message.authorName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <span className="text-sm font-semibold text-white">
          {message.authorName}
          {isCurrentUser && <span className="text-slate-400 font-normal ml-1">(You)</span>}
        </span>

        <span className="text-xs text-slate-500">
          {formatTimestamp(message.timestamp)}
        </span>

        <div className="ml-auto">
          <TypeBadge type={message.type} size="sm" />
        </div>
      </div>

      <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap mb-3">
        {message.content}
      </div>

      {onReact && (
        <div className="mb-3">
          <ReactionBar
            reactions={message.reactions || []}
            currentUserId={isCurrentUser ? message.authorId : 'current_user'}
            onReact={onReact}
            messageId={message.id}
          />
        </div>
      )}

      <div className="flex items-center gap-3 pt-3 border-t border-slate-700/50">
        {message.resolved && (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Resolved</span>
            {message.resolvedBy && (
              <span className="text-slate-500">by {message.resolvedBy}</span>
            )}
          </div>
        )}

        {message.replyCount > 0 && (
          <button
            onClick={onReply}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
          >
            <MessageSquare className="w-3 h-3" />
            <span>{message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}</span>
          </button>
        )}

        {canResolve && (
          <button
            onClick={() => onResolve(message.id)}
            className="ml-auto px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-xs font-semibold text-green-400 hover:bg-green-500/30 transition-all"
          >
            Mark resolved
          </button>
        )}
      </div>
    </div>
  );
}
