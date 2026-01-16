// src/components/common/TaskRow.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 4: Information Architecture
// ═══════════════════════════════════════════════════════════════════════════════
// Reusable 3-zone row component for consistent scanning patterns
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { ChevronRight } from "lucide-react";

/**
 * TaskRow - Consistent 3-zone layout for any list item
 * 
 * @param {ReactNode} identity - Zone 1: What is this? (icon + title + meta)
 * @param {ReactNode} status - Zone 2: How is it going? (progress, metrics)
 * @param {ReactNode} action - Zone 3: What can I do? (button, link)
 * @param {function} onClick - Click handler for the whole row
 * @param {boolean} showChevron - Show chevron on hover
 * @param {string} className - Additional classes
 */
export default function TaskRow({ 
  identity, 
  status, 
  action, 
  onClick, 
  showChevron = true,
  className = "" 
}) {
  return (
    <div 
      onClick={onClick}
      className={`
        group flex items-center gap-4 p-4 rounded-xl cursor-pointer
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
        ${className}
      `}
    >
      {/* Zone 1: Identity */}
      <div className="flex-1 min-w-0">
        {identity}
      </div>

      {/* Zone 2: Status */}
      {status && (
        <div className="hidden sm:flex items-center">
          {status}
        </div>
      )}

      {/* Zone 3: Action */}
      <div className="flex items-center gap-2 shrink-0">
        {action}
        {showChevron && (
          <ChevronRight className="
            w-4 h-4 text-text-tertiary
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
          " />
        )}
      </div>
    </div>
  );
}

/**
 * TaskRow.Identity - Standard identity block
 */
TaskRow.Identity = function Identity({ icon, title, meta }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 group-hover:bg-brand/10 transition-colors">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h4 className="text-sm font-medium text-text-primary truncate group-hover:text-brand transition-colors">
          {title}
        </h4>
        {meta && (
          <p className="text-xs text-text-tertiary mt-0.5 truncate">
            {meta}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * TaskRow.Progress - Progress bar with optional label
 */
TaskRow.Progress = function Progress({ value, label, color = "brand" }) {
  const colors = {
    brand: 'bg-brand',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };

  return (
    <div className="flex items-center gap-3 w-32">
      <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${colors[color]}`}
          style={{ width: `${value}%` }}
        />
      </div>
      {label && (
        <span className="text-xs font-medium text-text-secondary w-8 text-right">
          {label}
        </span>
      )}
    </div>
  );
};

/**
 * TaskRow.Button - Standard action button
 */
TaskRow.Button = function Button({ children, onClick, variant = "default", disabled = false }) {
  const variants = {
    default: 'bg-surface-2 text-text-secondary hover:bg-brand hover:text-white',
    primary: 'bg-brand text-white hover:bg-brand-600',
    success: 'bg-success/10 text-success',
  };

  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
      disabled={disabled}
      className={`
        px-3 py-1.5 rounded-lg text-xs font-medium
        transition-all duration-200 disabled:opacity-50
        ${variants[variant]}
      `}
    >
      {children}
    </button>
  );
};
