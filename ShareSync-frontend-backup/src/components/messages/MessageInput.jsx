// src/components/messages/MessageInput.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC MESSAGE INPUT v4.0 - "The Gallery Walk" Light Theme
// ═══════════════════════════════════════════════════════════════════════════════
//
// THEME: "The Communication Hub"
//
// COLOR MAP:
// - Input Background: #F8FAFC (slate-50)
// - Input Border: #E2E8F0 (slate-200)
// - Input Focus Border: #8B5CF6 (violet-500)
// - Send Button: #8B5CF6 (violet-500)
// - Icons: #94A3B8 (slate-400)
// - Placeholder: #94A3B8 (slate-400)
//
// NO BACKEND CHANGES
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useRef, useState } from 'react';
import { Send, Paperclip, Smile, Image, X } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function MessageInput({ 
  value, 
  onChange, 
  onSend, 
  disabled = false, 
  placeholder = 'Type a message...',
  onTypingStart,
  onTypingStop,
  onAttach,
  showAttachButton = true,
  showEmojiButton = false,
}) {
  const typingTimeoutRef = useRef(null);
  const lastTypingRef = useRef(0);
  const fileInputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);

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
    if (!value.trim() && attachments.length === 0) return;
    
    if (onTypingStop) onTypingStop();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    onSend(attachments);
    setAttachments([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
      if (onAttach) onAttach(files);
    }
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 border-t border-slate-200 bg-white">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200"
            >
              <Image className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-600 max-w-[100px] truncate">
                {file.name}
              </span>
              <button 
                onClick={() => removeAttachment(index)}
                className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Input Row */}
      <div className="flex items-center gap-3">
        {/* Attach Button */}
        {showAttachButton && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5 text-slate-400" />
            </button>
          </>
        )}
        
        {/* Emoji Button */}
        {showEmojiButton && (
          <button 
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Add emoji"
          >
            <Smile className="w-5 h-5 text-slate-400" />
          </button>
        )}
        
        {/* Input Field */}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex-1 px-4 py-2.5 rounded-lg text-sm transition-colors',
            'bg-slate-50 border border-slate-200',
            'text-slate-800 placeholder:text-slate-400',
            'focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        
        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={(!value.trim() && attachments.length === 0) || disabled}
          className={cn(
            'p-2.5 rounded-lg transition-colors',
            'bg-violet-500 text-white shadow-md shadow-violet-200',
            'hover:bg-violet-600',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Send className={cn('w-5 h-5', disabled && 'animate-pulse')} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   COMPACT INPUT - For inline/minimal use
───────────────────────────────────────────────────────────────────────── */
export function CompactMessageInput({ 
  value, 
  onChange, 
  onSend, 
  placeholder = 'Reply...',
  disabled = false,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSend();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'flex-1 px-3 py-2 rounded-lg text-sm transition-colors',
          'bg-slate-50 border border-slate-200',
          'text-slate-800 placeholder:text-slate-400',
          'focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100',
          disabled && 'opacity-50'
        )}
      />
      <button
        onClick={() => value.trim() && onSend()}
        disabled={!value.trim() || disabled}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'bg-violet-500 text-white',
          'hover:bg-violet-600',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
