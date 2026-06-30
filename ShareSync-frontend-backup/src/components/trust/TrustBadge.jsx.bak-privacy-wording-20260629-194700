// src/components/trust/TrustBadge.jsx - Week 7 Day 3-4 Trust Badges
import React, { useState } from 'react';
import { Shield, Lock, Eye, Info, X } from 'lucide-react';

const TrustBadge = ({ 
  type = 'encrypted', // 'encrypted', 'private', 'secure'
  size = 'sm', // 'xs', 'sm', 'md', 'lg'
  showTooltip = true,
  inline = false,
  className = ''
}) => {
  const [showInfo, setShowInfo] = useState(false);

  const configs = {
    encrypted: {
      icon: Lock,
      text: 'End-to-end encrypted',
      description: 'Messages are encrypted on your device. Not even we can read them.',
      color: 'emerald',
      emoji: '🔐'
    },
    'file-encrypted': {
      icon: Shield,
      text: 'Encrypted at rest',
      description: 'Files are encrypted on our servers using AES-256 encryption.',
      color: 'blue',
      emoji: '🔒'
    },
    private: {
      icon: Eye,
      text: 'Only project members can see this',
      description: 'This content is only visible to members of this project.',
      color: 'purple',
      emoji: '👁️'
    }
  };

  const config = configs[type] || configs.encrypted;
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      hover: 'hover:bg-emerald-500/20'
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      hover: 'hover:bg-blue-500/20'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      hover: 'hover:bg-purple-500/20'
    }
  };

  const colors = colorClasses[config.color];

  if (inline) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <Icon className={`${iconSizes[size]} ${colors.text}`} />
        <span className={`${sizeClasses[size]} ${colors.text} font-medium`}>
          {config.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => showTooltip && setShowInfo(!showInfo)}
        className={`
          flex items-center gap-2 rounded-full border
          ${colors.bg} ${colors.border} ${colors.text}
          ${sizeClasses[size]} ${showTooltip ? colors.hover : ''}
          font-medium transition-all
          ${showTooltip ? 'cursor-pointer' : 'cursor-default'}
        `}
      >
        <Icon className={iconSizes[size]} />
        <span>{config.text}</span>
        {showTooltip && <Info className="w-3 h-3 opacity-50" />}
      </button>

      {/* Tooltip */}
      {showInfo && showTooltip && (
        <div className="absolute z-50 mt-2 left-0 w-64 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${colors.text}`} />
              <h4 className="font-bold text-white text-sm">{config.text}</h4>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="p-1 hover:bg-slate-800 rounded transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {config.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default TrustBadge;
