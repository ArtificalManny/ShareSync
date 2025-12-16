// src/components/project/chat/MessageTypeSelector.jsx
import React from 'react';
import { getTypeBadgeConfig } from '../../../utils/chatUtils';

const MESSAGE_TYPES = ['update', 'question', 'decision'];

export default function MessageTypeSelector({ selectedType, onSelectType }) {
  return (
    <div className="mb-3">
      <p className="text-xs text-slate-400 mb-2">Type:</p>
      <div className="flex gap-2">
        {MESSAGE_TYPES.map(type => {
          const config = getTypeBadgeConfig(type);
          const isActive = selectedType === type;

          return (
            <button
              key={type}
              onClick={() => onSelectType(type)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
                ${isActive
                  ? `${config.bgColor} ${config.borderColor} border-2 ${config.color}`
                  : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-slate-600'
                }
              `}
            >
              <span>{config.icon}</span>
              <span className="capitalize">{type}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
