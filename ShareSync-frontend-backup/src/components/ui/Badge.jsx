// src/components/ui/Badge.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC BADGE v4.0 - "The Gallery Walk" + Signature Gradients
// ═══════════════════════════════════════════════════════════════════════════════
//
// CHANGES IN v4.0:
// - Added all signature gradient variants (aurora, sunset, ocean)
// - Updated to light theme colors
// - All functionality preserved exactly
// - NO BACKEND CHANGES
//
// GRADIENT VARIANTS:
// - grad-aurora: Full spectrum
// - grad-sunset: Violet → Pink
// - grad-ocean: Blue → Teal
// - grad-brand: Violet
// - grad-success, grad-warning, grad-energy, grad-legendary
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Soft backgrounds with colored text (light theme)
const TONE_CONFIGS = {
  violet: {
    soft: 'bg-violet-50 text-violet-700 border border-violet-200',
    solid: 'bg-violet-500 text-white',
    outline: 'bg-transparent text-violet-600 border border-violet-300',
  },
  blue: {
    soft: 'bg-blue-50 text-blue-700 border border-blue-200',
    solid: 'bg-blue-500 text-white',
    outline: 'bg-transparent text-blue-600 border border-blue-300',
  },
  teal: {
    soft: 'bg-teal-50 text-teal-700 border border-teal-200',
    solid: 'bg-teal-500 text-white',
    outline: 'bg-transparent text-teal-600 border border-teal-300',
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
  orange: {
    soft: 'bg-orange-50 text-orange-700 border border-orange-200',
    solid: 'bg-orange-500 text-white',
    outline: 'bg-transparent text-orange-600 border border-orange-300',
  },
  rose: {
    soft: 'bg-rose-50 text-rose-700 border border-rose-200',
    solid: 'bg-rose-500 text-white',
    outline: 'bg-transparent text-rose-600 border border-rose-300',
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
  slate: {
    soft: 'bg-slate-100 text-slate-700 border border-slate-200',
    solid: 'bg-slate-500 text-white',
    outline: 'bg-transparent text-slate-600 border border-slate-300',
  },
  indigo: {
    soft: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    solid: 'bg-indigo-500 text-white',
    outline: 'bg-transparent text-indigo-600 border border-indigo-300',
  },
  pink: {
    soft: 'bg-pink-50 text-pink-700 border border-pink-200',
    solid: 'bg-pink-500 text-white',
    outline: 'bg-transparent text-pink-600 border border-pink-300',
  },
  sky: {
    soft: 'bg-sky-50 text-sky-700 border border-sky-200',
    solid: 'bg-sky-500 text-white',
    outline: 'bg-transparent text-sky-600 border border-sky-300',
  },
};

// Gradient styles - signature gradients
const GRADIENT_CONFIGS = {
  // Signature gradients
  'grad-aurora': {
    style: { background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-sunset': {
    style: { background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #EC4899 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-ocean': {
    style: { background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-brand': {
    style: { background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-violet': {
    style: { background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-blue': {
    style: { background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-purple': {
    style: { background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-success': {
    style: { background: 'linear-gradient(135deg, #2DD4BF 0%, #14B8A6 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-teal': {
    style: { background: 'linear-gradient(135deg, #2DD4BF 0%, #14B8A6 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-emerald': {
    style: { background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-warning': {
    style: { background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-amber': {
    style: { background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-energy': {
    style: { background: 'linear-gradient(135deg, #FB923C 0%, #F43F5E 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-orange': {
    style: { background: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-danger': {
    style: { background: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-live': {
    style: { background: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-legendary': {
    style: { background: 'linear-gradient(135deg, #FFD700 0%, #EF4444 50%, #8B5CF6 100%)' },
    classes: 'text-white border-transparent shadow-sm shadow-amber-500/30',
  },
  'grad-fire': {
    style: { background: 'linear-gradient(135deg, #FF6B6B 0%, #EF4444 50%, #DC2626 100%)' },
    classes: 'text-white border-transparent',
  },
  'grad-gold': {
    style: { background: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)' },
    classes: 'text-amber-900 border-transparent',
  },
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
  pulse = false,
  ...rest
}) {
  // Check if it's a gradient tone
  const isGradient = tone.startsWith('grad-');
  
  let toneClasses = '';
  let toneStyle = {};
  
  if (isGradient) {
    const gradientConfig = GRADIENT_CONFIGS[tone] || GRADIENT_CONFIGS['grad-brand'];
    toneClasses = gradientConfig.classes;
    toneStyle = gradientConfig.style;
  } else {
    const toneConfig = TONE_CONFIGS[tone] || TONE_CONFIGS.slate;
    toneClasses = toneConfig[variant] || toneConfig.soft;
  }

  const sizeClasses = SIZE_CONFIGS[size] || SIZE_CONFIGS.sm;

  // Dot color based on tone
  const getDotColor = () => {
    if (isGradient) return 'bg-white';
    const dotColors = {
      emerald: 'bg-emerald-500',
      teal: 'bg-teal-500',
      amber: 'bg-amber-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      rose: 'bg-rose-500',
      blue: 'bg-blue-500',
      cyan: 'bg-cyan-500',
      violet: 'bg-violet-500',
      indigo: 'bg-indigo-500',
      pink: 'bg-pink-500',
      sky: 'bg-sky-500',
      slate: 'bg-slate-500',
    };
    return dotColors[tone] || 'bg-violet-500';
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 font-medium whitespace-nowrap border',
        toneClasses,
        sizeClasses,
        className
      )}
      style={toneStyle}
      {...rest}
    >
      {/* Optional dot indicator */}
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          getDotColor(),
          pulse && 'animate-pulse'
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
    pending: { tone: 'amber', label: 'Pending', dot: true, pulse: true },
    error: { tone: 'red', label: 'Error', dot: true },
    success: { tone: 'emerald', label: 'Success', dot: true },
    warning: { tone: 'amber', label: 'Warning', dot: true },
    info: { tone: 'blue', label: 'Info', dot: true },
    live: { tone: 'cyan', label: 'Live', dot: true, pulse: true },
    draft: { tone: 'slate', label: 'Draft', dot: false },
    archived: { tone: 'slate', label: 'Archived', dot: false },
    new: { tone: 'grad-aurora', label: 'New', dot: false },
    pro: { tone: 'grad-sunset', label: 'Pro', dot: false },
    beta: { tone: 'grad-ocean', label: 'Beta', dot: false },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge 
      tone={config.tone} 
      dot={config.dot}
      pulse={config.pulse}
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
      className={cn('min-w-[1.25rem] justify-center tabular-nums', className)}
      {...rest}
    >
      {displayCount}
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT BADGE - Shortcut for gradient badges
// ═══════════════════════════════════════════════════════════════════════════════
export function GradientBadge({ 
  variant = 'aurora', 
  children, 
  className = '',
  ...rest 
}) {
  const toneMap = {
    aurora: 'grad-aurora',
    sunset: 'grad-sunset',
    ocean: 'grad-ocean',
    brand: 'grad-brand',
    success: 'grad-success',
    energy: 'grad-energy',
    legendary: 'grad-legendary',
    fire: 'grad-fire',
    gold: 'grad-gold',
  };

  return (
    <Badge 
      tone={toneMap[variant] || 'grad-brand'}
      className={className}
      {...rest}
    >
      {children}
    </Badge>
  );
}
