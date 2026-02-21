// src/components/ui/Badge.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC BADGE v4.0 - "The Gallery Walk" + Signature Gradients
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";

const cn = (...classes) => classes.filter(Boolean).join(' ');

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
  
  // Maps the React props directly to the pure CSS classes in badge.css
  let badgeClass = `badge--${tone}`;
  if (tone.startsWith('grad-')) badgeClass = `badge--${tone}`;
  if (variant === 'solid' && !tone.startsWith('grad-')) badgeClass = `badge--solid-${tone}`;
  if (variant === 'outline') badgeClass = `badge--outline-${tone}`;

  return (
    <span 
      className={cn(
        'badge',
        badgeClass,
        `badge--${size}`,
        className
      )}
      {...rest}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 bg-current opacity-70', pulse && 'animate-pulse')} />}
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = '', ...rest }) {
  const statusConfig = {
    active: { tone: 'emerald', label: 'Active', dot: true },
    inactive: { tone: 'slate', label: 'Inactive', dot: true },
    pending: { tone: 'amber', label: 'Pending', dot: true, pulse: true },
    error: { tone: 'red', label: 'Error', dot: true },
    success: { tone: 'emerald', label: 'Success', dot: true },
    live: { tone: 'cyan', label: 'Live', dot: true, pulse: true },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge tone={config.tone} dot={config.dot} pulse={config.pulse} className={className} {...rest}>
      {config.label}
    </Badge>
  );
}

export function CounterBadge({ count, max = 99, tone = "red", size = "sm", className = '', ...rest }) {
  const displayCount = count > max ? `${max}+` : count;
  if (count <= 0) return null;
  return (
    <Badge tone={tone} variant="solid" size={size} className={cn('min-w-[1.25rem] justify-center tabular-nums', className)} {...rest}>
      {displayCount}
    </Badge>
  );
}

export function GradientBadge({ variant = 'aurora', children, className = '', ...rest }) {
  const toneMap = { aurora: 'grad-aurora', sunset: 'grad-sunset', ocean: 'grad-ocean', brand: 'grad-brand' };
  return <Badge tone={toneMap[variant] || 'grad-brand'} className={className} {...rest}>{children}</Badge>;
}
