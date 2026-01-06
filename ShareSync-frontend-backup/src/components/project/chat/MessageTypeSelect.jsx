// src/components/project/chat/MessageTypeSelector.jsx
import React from 'react';
import { getTypeBadgeConfig } from '../../../utils/chatUtils';

const MESSAGE_TYPES = [
  { value: 'update', label: 'Update' },
  { value: 'question', label: 'Question' },
  { value: 'decision', label: 'Decision' }
];

export default function MessageTypeSelector({ selectedType, onSelectType }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs text-slate-400 font-medium">Type:</span>
      {MESSAGE_TYPES.map(type => {
        const config = getTypeBadgeConfig(type.value);
        const isActive = selectedType === type.value;

        return (
          <button
            key={type.value}
            onClick={() => onSelectType(type.value)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${isActive
                ? `${config.bgColor} ${config.borderColor} ${config.color} border`
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700/50'
              }
            `}
          >
            <span className="mr-1">{config.icon}</span>
            {type.label}
          </button>
        );
      })}
    </div>
  );
}