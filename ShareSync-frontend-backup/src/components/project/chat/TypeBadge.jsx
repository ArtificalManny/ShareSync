// src/components/project/chat/TypeBadge.jsx
import React from 'react';
import { getTypeBadgeConfig } from '../../../utils/chatUtils';

export default function TypeBadge({ type, size = 'md' }) {
  const config = getTypeBadgeConfig(type);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <div className={`inline-flex items-center gap-1 rounded-md border ${config.bgColor} ${config.borderColor} ${sizeClasses[size]}`}>
      <span className="text-[10px]">{config.icon}</span>
      <span className={`font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}
