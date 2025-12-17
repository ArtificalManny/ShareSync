// src/components/project/chat/ChatComposer.jsx - WITH TYPING INDICATORS
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import MessageTypeSelector from './MessageTypeSelector';
import FocusAwareWarning from './FocusAwareWarning';
import { getComposerPlaceholder } from '../../../utils/chatUtils';

export default function ChatComposer({ 
  onSendMessage, 
  sending,
  focusedMembers = [],
  projectId,
  onTypingStart,
  onTypingStop
}) {
  const [messageType, setMessageType] = useState('update');
  const [content, setContent] = useState('');
  const [respectFocus, setRespectFocus] = useState(true);
  const [showFocusWarning, setShowFocusWarning] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Handle typing indicators
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Start typing indicator
    if (newContent.trim() && !isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop?.();
    }, 2000);
  };

  // Stop typing on blur
  const handleBlur = () => {
    if (isTyping) {
      setIsTyping(false);
      onTypingStop?.();
    }
  };

  const handleSendAttempt = () => {
    if (!content.trim() || sending) return;

    const hasFocusedMembers = focusedMembers.length > 0;

    if (hasFocusedMembers && respectFocus) {
      setShowFocusWarning(true);
    } else {
      handleSend();
    }
  };

  const handleSend = async (scheduleForBreak = false) => {
    if (!content.trim() || sending) return;

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      onTypingStop?.();
    }

    try {
      await onSendMessage(content.trim(), messageType, {
        respectFocus,
        scheduleForBreak,
        focusedMembers: respectFocus ? focusedMembers : []
      });
      
      setContent('');
      setMessageType('update');
      setShowFocusWarning(false);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('[ChatComposer] Send failed:', error);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendAttempt();
    }
  };

  const placeholder = getComposerPlaceholder(messageType);
  const canSend = content.trim().length > 0 && !sending;

  return (
    <>
      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <MessageTypeSelector
          selectedType={messageType}
          onSelectType={setMessageType}
        />

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={sending}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={3}
            style={{ minHeight: '80px', maxHeight: '200px' }}
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={respectFocus}
              onChange={(e) => setRespectFocus(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 text-purple-600 focus:ring-purple-500/50 focus:ring-offset-slate-900"
            />
            <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors flex items-center gap-1">
              <span>🔕</span>
              Respect focus time
              {focusedMembers.length > 0 && respectFocus && (
                <span className="ml-1 px-1.5 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded text-orange-400 font-semibold">
                  {focusedMembers.length} focused
                </span>
              )}
            </span>
          </label>

          <button
            onClick={handleSendAttempt}
            disabled={!canSend}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2
              ${canSend
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>

        {!sending && (
          <div className="text-xs text-slate-500 mt-2">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs">
              ⌘
            </kbd>
            {' + '}
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs">
              Enter
            </kbd>
            {' to send'}
          </div>
        )}
      </div>

      {showFocusWarning && (
        <FocusAwareWarning
          focusedMembers={focusedMembers}
          onSendAnyway={() => handleSend(false)}
          onScheduleForBreak={() => handleSend(true)}
          onCancel={() => setShowFocusWarning(false)}
        />
      )}
    </>
  );
}
