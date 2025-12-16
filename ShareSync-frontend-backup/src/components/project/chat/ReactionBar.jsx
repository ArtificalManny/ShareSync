// src/components/project/chat/ReactionBar.jsx
import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const AVAILABLE_EMOJIS = ['👍', '🎉', '👀', '❤️', '🚀'];

export default function ReactionBar({ reactions = [], currentUserId, onReact, messageId }) {
  const [showPicker, setShowPicker] = useState(false);

  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        users: []
      };
    }
    acc[reaction.emoji].count++;
    acc[reaction.emoji].users.push(reaction.userId);
    return acc;
  }, {});

  const handleReactionClick = (emoji) => {
    const existingReaction = groupedReactions[emoji];
    const userHasReacted = existingReaction?.users.includes(currentUserId);

    onReact(messageId, emoji, userHasReacted ? 'remove' : 'add');
    setShowPicker(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Object.values(groupedReactions).map(reaction => {
        const userHasReacted = reaction.users.includes(currentUserId);
        
        return (
          <button
            key={reaction.emoji}
            onClick={() => handleReactionClick(reaction.emoji)}
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all
              ${userHasReacted
                ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:border-slate-600'
              }
            `}
            title={reaction.users.map(id => `User ${id}`).join(', ')}
          >
            <span>{reaction.emoji}</span>
            <span className="font-medium">{reaction.count}</span>
          </button>
        );
      })}

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-slate-800/50 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-300 transition-all"
          title="Add reaction"
        >
          <Plus className="w-3 h-3" />
          <span className="text-xs">React</span>
        </button>

        {showPicker && (
          <div className="absolute bottom-full left-0 mb-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-2 flex gap-1 z-10">
            {AVAILABLE_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-800 transition-colors text-lg"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
