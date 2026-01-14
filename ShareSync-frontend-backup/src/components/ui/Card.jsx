import React from 'react';
import { cn } from './cn';
import { useRenovation } from '../../context/RenovationContext';

// Base card upgraded for MetaLab 2026 Aesthetic
export default function Card({
  as: Tag = 'div',
  className,
  children,
  variant = 'bento', // Defaulting to our new elevation style
  hover = true,
  padding = 'lg',     // MetaLab uses more generous padding
  rounded = 'full',   // '2xl' is 16px, 'full' is our new 24px-32px range
  border = true,
  onKeyDown,
  ...rest
}) {
  const { styles } = useRenovation();

  const pad = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-10', // Increased for "Spatial Intentionality"
  }[padding];

  const radius = {
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-[2rem]',
    full: 'rounded-[2.5rem]', // The "Bento" look
  }[rounded];

  // Logic: Use existing cn, but swap out slate borders for our new "Inner Glow" logic
  const base = cn(
    radius,
    pad,
    // NEW: Using our bento-elevated class from index.css for the "Hardware" look
    variant === 'bento' && 'bento-elevated',
    variant === 'glass' && 'glass-panel',
    
    // Fallback/Legacy Border Logic (kept for safety)
    variant !== 'bento' && border && 'border border-white/[0.04]',
    
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500', 
    'min-h-[40px] relative overflow-hidden',
    rest.onClick ? 'cursor-pointer select-none' : ''
  );

  const byVariant = {
    bento: '', // Styles handled by .bento-elevated in index.css
    subtle: 'bg-[#121316] border-white/[0.03]',
    solid:  'bg-white text-black',
    ghost:  'bg-transparent',
    glass:  '', // Styles handled by .glass-panel in index.css
  }[variant];

  const interactive = Boolean(rest.onClick);
  const keyHandler = (e) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      rest.onClick?.(e);
    }
    onKeyDown?.(e);
  };

  return (
    <Tag
      className={cn(base, byVariant, className)}
      role={interactive ? (rest.role || 'button') : rest.role}
      tabIndex={interactive ? (rest.tabIndex ?? 0) : rest.tabIndex}
      onKeyDown={keyHandler}
      {...rest}
    >
      {/* 🌌 Atmospheric Glow Layer (Optional: only visible if card has hover) */}
      {hover && variant === 'bento' && (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      {children}
    </Tag>
  );
}

// UPGRADED SLOTS: Using the "Swiss" Typography we defined
export function CardHeader({ className, title, subtitle, icon: Icon, ...p }) {
  return (
    <div className={cn('mb-10 flex items-start justify-between', className)} {...p}>
      <div className="space-y-1">
        {subtitle && <p className="text-label-caps text-slate-500">{subtitle}</p>}
        {title && <h3 className="text-2xl font-bold tracking-tighter text-white">{title}</h3>}
      </div>
      {Icon && <Icon className="text-slate-600 group-hover:text-violet-500 transition-colors" size={20} />}
    </div>
  );
}

export function CardTitle({ className, ...p }) {
  return <h3 className={cn('text-2xl font-bold tracking-tighter text-white', className)} {...p} />;
}

export function CardSubtitle({ className, ...p }) {
  return <p className={cn('text-label-caps text-slate-500', className)} {...p} />;
}

export function CardContent({ className, ...p }) {
  return <div className={cn('relative', className)} {...p} />;
}

export function CardFooter({ className, ...p }) {
  return <div className={cn('mt-8 pt-6 border-t border-white/[0.04]', className)} {...p} />;
}
