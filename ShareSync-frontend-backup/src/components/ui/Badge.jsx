// src/components/ui/Badge.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC BADGE v4.0 - "The Gallery Walk" Light Theme
// ═══════════════════════════════════════════════════════════════════════════════
//
// CHANGES IN v4.0:
// - Updated to light theme colors
// - All functionality preserved exactly
// - NO BACKEND CHANGES
//
// Props:
//  - tone: "violet" | "emerald" | "amber" | "blue" | "slate" | "red" | 
//          "grad-blue" | "grad-purple" | "grad-emerald"
//  - size: "sm" | "md" (default "sm")
//  - variant: "solid" | "soft" | "outline" (default "soft")
//  - className
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ✅ UPDATED: Light theme color configurations
const TONE_CONFIGS = {
  // Soft backgrounds with colored text (light theme default)
  violet: {
    soft: 'bg-violet-50 text-violet-700 border border-violet-200',
    solid: 'bg-violet-500 text-white',
    outline: 'bg-transparent text-violet-600 border border-violet-300',
  },
  emerald: {
    soft: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    solid: 'bg-emerald-500 text-white',
    outline: 'bg-transparent text-emerald-600 border border-emerald-300',
  },
  amber: {
    soft: 'bg-amber-50 text-amber-700 border border-amber-200',
    solid: 'bg-amber-500 text-white',
    outline: 'bg-transparent text-amber-600 border border-amber-300',
  },
  blue: {
    soft: 'bg-blue-50 text-blue-700 border border-blue-200',
    solid: 'bg-blue-500 text-white',
    outline: 'bg-transparent text-blue-600 border border-blue-300',
  },
  slate: {
    soft: 'bg-slate-100 text-slate-700 border border-slate-200',
    solid: 'bg-slate-500 text-white',
    outline: 'bg-transparent text-slate-600 border border-slate-300',
  },
  red: {
    soft: 'bg-red-50 text-red-700 border border-red-200',
    solid: 'bg-red-500 text-white',
    outline: 'bg-transparent text-red-600 border border-red-300',
  },
  cyan: {
    soft: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    solid: 'bg-cyan-500 text-white',
    outline: 'bg-transparent text-cyan-600 border border-cyan-300',
  },
  orange: {
    soft: 'bg-orange-50 text-orange-700 border border-orange-200',
    solid: 'bg-orange-500 text-white',
    outline: 'bg-transparent text-orange-600 border border-orange-300',
  },
  // Legacy aliases
  indigo: {
    soft: 'bg-violet-50 text-violet-700 border border-violet-200',
    solid: 'bg-violet-500 text-white',
    outline: 'bg-transparent text-violet-600 border border-violet-300',
  },
  sky: {
    soft: 'bg-blue-50 text-blue-700 border border-blue-200',
    solid: 'bg-blue-500 text-white',
    outline: 'bg-transparent text-blue-600 border border-blue-300',
  },
};

// Gradient styles
const GRADIENT_CONFIGS = {
  'grad-blue': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
  'grad-purple': 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white',
  'grad-emerald': 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
  'grad-orange': 'bg-gradient-to-r from-orange-500 to-amber-500 text-white',
};

const SIZE_CONFIGS = {
  xs: 'text-[10px] py-0.5 px-1.5 rounded',
  sm: 'text-xs py-0.5 px-2 rounded-md',
  md: 'text-sm py-1 px-2.5 rounded-md',
  lg: 'text-sm py-1.5 px-3 rounded-lg',
};

export default function Badge({ 
  tone = "slate", 
  size = "sm", 
  variant = "soft",
  className = "", 
  children,
  icon: Icon,
  dot = false,
  ...rest
}) {
  // Check if it's a gradient tone
  const isGradient = tone.startsWith('grad-');
  
  let toneClasses;
  if (isGradient) {
    toneClasses = GRADIENT_CONFIGS[tone] || GRADIENT_CONFIGS['grad-purple'];
  } else {
    const toneConfig = TONE_CONFIGS[tone] || TONE_CONFIGS.slate;
    toneClasses = toneConfig[variant] || toneConfig.soft;
  }

  const sizeClasses = SIZE_CONFIGS[size] || SIZE_CONFIGS.sm;

  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 font-medium whitespace-nowrap',
        toneClasses,
        sizeClasses,
        className
      )}
      {...rest}
    >
      {/* Optional dot indicator */}
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          tone === 'emerald' || tone === 'grad-emerald' ? 'bg-emerald-500' :
          tone === 'amber' || tone === 'grad-orange' ? 'bg-amber-500' :
          tone === 'red' ? 'bg-red-500' :
          tone === 'blue' || tone === 'sky' || tone === 'grad-blue' ? 'bg-blue-500' :
          'bg-violet-500'
        )} />
      )}
      
      {/* Optional icon */}
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS BADGE - Preset badge for common status states
// ═══════════════════════════════════════════════════════════════════════════════
export function StatusBadge({ status, className = '', ...rest }) {
  const statusConfig = {
    active: { tone: 'emerald', label: 'Active', dot: true },
    inactive: { tone: 'slate', label: 'Inactive', dot: true },
    pending: { tone: 'amber', label: 'Pending', dot: true },
    error: { tone: 'red', label: 'Error', dot: true },
    success: { tone: 'emerald', label: 'Success', dot: true },
    warning: { tone: 'amber', label: 'Warning', dot: true },
    info: { tone: 'blue', label: 'Info', dot: true },
    live: { tone: 'cyan', label: 'Live', dot: true },
    draft: { tone: 'slate', label: 'Draft', dot: false },
    archived: { tone: 'slate', label: 'Archived', dot: false },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge 
      tone={config.tone} 
      dot={config.dot}
      className={className}
      {...rest}
    >
      {config.label}
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTER BADGE - Badge with a number (notifications, counts)
// ═══════════════════════════════════════════════════════════════════════════════
export function CounterBadge({ 
  count, 
  max = 99, 
  tone = "red",
  size = "sm",
  className = '',
  ...rest 
}) {
  const displayCount = count > max ? `${max}+` : count;
  
  if (count <= 0) return null;

  return (
    <Badge 
      tone={tone} 
      variant="solid"
      size={size}
      className={cn('min-w-[1.25rem] justify-center', className)}
      {...rest}
    >
      {displayCount}
    </Badge>
  );
}
