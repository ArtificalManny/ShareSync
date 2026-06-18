// src/components/navigation/SearchBar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE N: Enhanced Search Bar with Command Palette Integration
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function SearchBar({ 
  onOpen, 
  placeholder = 'Search everything...',
  className = '' 
}) {
  const navigate = useNavigate();
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const handleOpen = useCallback(() => {
    if (typeof onOpen === 'function') {
      onOpen();
      return;
    }
    navigate('/search');
  }, [onOpen, navigate]);

  return (
    <button
      onClick={handleOpen}
      className={`
        flex items-center gap-3 px-4 py-2.5
        bg-surface-2/50 border border-white/[0.06]
        rounded-xl
        text-text-tertiary
        hover:bg-surface-2 hover:border-white/[0.1]
        hover:text-text-secondary
        transition-all duration-200
        group
        ${className}
      `}
    >
      {/* Precision optical alignment: relative top-[1.5px] pushes it down to match text baseline */}
      <Search className="w-4 h-4 shrink-0 relative top-[1.5px]" />
      
      <span className="text-sm flex-1 text-left">
        {placeholder}
      </span>

      {/* Shortcut hint */}
      <div className="flex items-center gap-1 shrink-0">
        <kbd className="
          px-1.5 py-0.5 rounded
          bg-surface-3 border border-white/[0.08]
          text-[10px] font-medium text-text-tertiary
          group-hover:bg-surface-1 group-hover:text-text-secondary
          transition-colors
        ">
          {isMac ? '⌘' : 'Ctrl'}
        </kbd>
        <kbd className="
          px-1.5 py-0.5 rounded
          bg-surface-3 border border-white/[0.08]
          text-[10px] font-medium text-text-tertiary
          group-hover:bg-surface-1 group-hover:text-text-secondary
          transition-colors
        ">
          K
        </kbd>
      </div>
    </button>
  );
}

/**
 * Compact version for narrow spaces
 */
export function SearchBarCompact({ onOpen, className = '' }) {
  const navigate = useNavigate();

  const handleOpen = useCallback(() => {
    if (typeof onOpen === 'function') {
      onOpen();
      return;
    }
    navigate('/search');
  }, [onOpen, navigate]);

  return (
    <button
      onClick={handleOpen}
      className={`
        flex items-center justify-center
        w-10 h-10 rounded-lg
        bg-surface-2/50 border border-white/[0.06]
        text-text-tertiary
        hover:bg-surface-2 hover:text-text-secondary
        transition-colors
        ${className}
      `}
      title="Search (⌘K)"
    >
      <Search className="w-4 h-4" />
    </button>
  );
}
