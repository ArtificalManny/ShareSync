import React from 'react';
import { cn } from './cn';

// Base card with variants for subtle/solid/ghost and optional hover
export default function Card({
  as: Tag = 'div',
  className,
  children,
  variant = 'subtle', // 'subtle' | 'solid' | 'ghost'
  hover = true,
  padding = 'md',     // 'sm' | 'md' | 'lg' | 'none'
  rounded = '2xl',    // 'lg' | 'xl' | '2xl' | 'full'
  border = true,
  ...rest
}) {
  const pad = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6',
  }[padding];

  const radius = {
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-3xl',
  }[rounded];

  const base = cn(
    radius,
    pad,
    border && 'border border-slate-200/60 dark:border-slate-700/50',
    hover && 'transition-shadow duration-200 hover:shadow-pop',
    'focus:outline-none focus-visible:shadow-focus', //visible focus
    'min-h-[40px]', //ensure hit area minimum
  );

  const byVariant = {
    subtle: 'bg-white dark:bg-slate-800',
    solid:  'bg-slate-900 text-white dark:bg-slate-900',
    ghost:  'bg-transparent',
  }[variant];

  return (
    <Tag className={cn(base, byVariant, className)} {...rest}>
      {children}
    </Tag>
  );
}

// Optional slots if you like composed usage later
export function CardHeader({ className, ...p }) {
  return <div className={cn('mb-2 flex items-center justify-between', className)} {...p} />;
}
export function CardTitle({ className, ...p }) {
  return <h3 className={cn('text-lg font-semibold tracking-tight', className)} {...p} />;
}
export function CardSubtitle({ className, ...p }) {
  return <p className={cn('text-sm text-slate-500 dark:text-slate-400', className)} {...p} />;
}
export function CardContent({ className, ...p }) {
  return <div className={cn('space-y-3', className)} {...p} />;
}
export function CardFooter({ className, ...p }) {
  return <div className={cn('mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/50', className)} {...p} />;
}
