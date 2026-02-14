// src/components/messages/MessageThread.jsx
// Message thread display component

import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { isOwnMessage } from '../../api/messages';

export default function MessageThread({ messages, currentUserId, otherUser, loading, error, onRetry }) {
  const endRef = useRef(null);
  
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
            {i % 2 !== 0 && <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />}
            <div className={`h-16 bg-white/10 rounded-xl animate-pulse ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-text-secondary mb-2">Failed to load messages</p>
        {onRetry && <button onClick={onRetry} className="text-brand-400 text-sm">Try Again</button>}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg._id || msg.id || i}
          message={msg}
          isOwn={isOwnMessage(msg, currentUserId)}
          showAvatar={i === 0 || !isOwnMessage(messages[i-1], currentUserId)}
          otherUser={otherUser}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}
