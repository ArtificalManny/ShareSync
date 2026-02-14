// src/components/messages/MessageInput.jsx
// Message input/composer component

import React, { useRef } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

export default function MessageInput({ 
  value, 
  onChange, 
  onSend, 
  disabled, 
  placeholder = 'Type a message...',
  onTypingStart,
  onTypingStop,
}) {
  const typingTimeoutRef = useRef(null);
  const lastTypingRef = useRef(0);

  const handleChange = (e) => {
    onChange(e.target.value);
    
    // Typing indicator logic
    if (onTypingStart) {
      const now = Date.now();
      if (now - lastTypingRef.current > 2000) {
        onTypingStart();
        lastTypingRef.current = now;
      }
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (onTypingStop) onTypingStop();
      }, 3000);
    }
  };

  const handleSend = () => {
    if (onTypingStop) onTypingStop();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    onSend();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-white/[0.06]">
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
          <Paperclip className="w-5 h-5 text-text-tertiary" />
        </button>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 rounded-lg bg-surface-2 border border-white/[0.06] text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500/50 focus:outline-none transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="p-2.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className={`w-5 h-5 ${disabled ? 'animate-pulse' : ''}`} />
        </button>
      </div>
    </div>
  );
}
