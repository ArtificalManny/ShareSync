// src/components/project/chat/MessageList.jsx - PHASE 2 ENHANCED
import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { groupMessagesByDate } from '../../../utils/chatUtils';

export default function MessageList({ 
  messages, 
  currentUserId, 
  loading,
  onReact,
  onResolve 
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
          <p className="text-sm text-slate-400 mb-6">
            Kick things off with a quick update, not a meeting.
          </p>
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
            Post first update
          </button>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {Object.entries(groupedMessages).map(([dateLabel, dateMessages]) => (
        <div key={dateLabel}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {dateLabel}
            </span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          <div className="space-y-3">
            {dateMessages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={message.authorId === currentUserId}
                onReact={onReact}
                onResolve={onResolve}
                onReply={() => console.log('Reply to:', message.id)}
              />
            ))}
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
