// src/components/messages/MessageBubble.jsx
// Individual message bubble component

import React from 'react';
import { getUserInitials } from '../../api/messages';

const Avatar = ({ user, size = 'sm' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' };
  const initials = getUserInitials(user);
  
  if (user?.avatar) {
    return <img src={user.avatar} alt="" className={`${sizes[size]} rounded-full object-cover`} />;
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0`}>
      <span className="font-medium text-brand-400">{initials}</span>
    </div>
  );
};

export default function MessageBubble({ message, isOwn, showAvatar, otherUser }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {showAvatar && !isOwn ? <Avatar user={otherUser} /> : <div className="w-8" />}
      
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`
          px-4 py-2.5 rounded-2xl
          ${isOwn ? 'bg-brand-500 text-white rounded-br-md' : 'bg-surface-2 text-text-primary rounded-bl-md'}
          ${message.__optimistic ? 'opacity-70' : ''}
        `}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : ''}`}>
          <span className="text-xs text-text-tertiary">{time}</span>
          {message.isEdited && <span className="text-xs text-text-tertiary">(edited)</span>}
          {message.__optimistic && <span className="text-xs text-text-tertiary">Sending...</span>}
        </div>
      </div>
    </div>
  );
}
