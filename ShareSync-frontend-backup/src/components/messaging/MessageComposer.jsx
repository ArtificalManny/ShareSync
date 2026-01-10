import React, { useState, useContext, useRef, useEffect } from 'react';
import { MessageContext } from '../../context/MessageContext';
import { UserContext } from '../../context/UserContext';
import { Send, Zap, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ENERGY_TYPES = {
  urgent: {
    label: 'Urgent',
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
    cost: 10,
    description: 'Respond in 15 min',
  },
  normal: {
    label: 'Normal',
    icon: Zap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
    cost: 3,
    description: 'Respond in 4 hours',
  },
  async: {
    label: 'Async',
    icon: Clock,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
    cost: 1,
    description: 'Respond in 24 hours',
  },
};

export default function MessageComposer({ recipientId }) {
  const { sendMessage, activeConversation, socket } = useContext(MessageContext);
  const { user } = useContext(UserContext);
  const [content, setContent] = useState('');
  const [energy, setEnergy] = useState('normal');
  const [showEnergySelector, setShowEnergySelector] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Send typing indicator
  useEffect(() => {
    if (content && activeConversation && socket.isConnected) {
      if (!isTyping) {
        setIsTyping(true);
        socket.sendTyping(activeConversation, true);
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.sendTyping(activeConversation, false);
      }, 3000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [content, activeConversation, socket]);

  const handleSend = async () => {
    if (!content.trim() || !activeConversation || sending) return;

    setSending(true);
    try {
      await sendMessage({
        conversationId: activeConversation,
        recipientId,
        content: content.trim(),
        energy,
      });

      setContent('');
      setEnergy('normal');
      setShowEnergySelector(false);
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        socket.sendTyping(activeConversation, false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedEnergy = ENERGY_TYPES[energy];
  const EnergyIcon = selectedEnergy.icon;

  return (
    <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      {/* Energy Selector Dropdown */}
      <AnimatePresence>
        {showEnergySelector && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 py-2 border-b border-slate-800"
          >
            <p className="text-xs text-slate-500 mb-2">Message Priority:</p>
            <div className="flex gap-2">
              {Object.entries(ENERGY_TYPES).map(([key, type]) => {
                const Icon = type.icon;
                const isSelected = energy === key;
                return (
                  <button
                    key={key}
                    onClick={() => setEnergy(key)}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                      isSelected
                        ? `${type.bgColor} ${type.borderColor} ${type.color}`
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={16} />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold">{type.label}</p>
                      <p className="text-xs opacity-75">{type.description}</p>
                    </div>
                    <div className="text-xs font-mono opacity-75">-{type.cost} ⚡</div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      <div className="p-4">
        <div className="flex items-end gap-2">
          {/* Energy Button */}
          <button
            onClick={() => setShowEnergySelector(!showEnergySelector)}
            className={`flex-shrink-0 p-2 rounded-xl border transition-all ${
              showEnergySelector
                ? `${selectedEnergy.bgColor} ${selectedEnergy.borderColor}`
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
            }`}
            title={`Priority: ${selectedEnergy.label} (-${selectedEnergy.cost} energy)`}
          >
            <EnergyIcon size={20} className={selectedEnergy.color} />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none max-h-32"
              rows={1}
              disabled={sending}
            />
            {/* Character count (optional) */}
            {content.length > 0 && (
              <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                {content.length}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!content.trim() || sending}
            className="flex-shrink-0 p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>

        {/* Energy cost indicator */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Press Enter to send • Shift+Enter for new line
          </span>
          <span className={`flex items-center gap-1 ${selectedEnergy.color}`}>
            <Zap size={12} />
            {selectedEnergy.cost} energy cost
          </span>
        </div>
      </div>
    </div>
  );
}
