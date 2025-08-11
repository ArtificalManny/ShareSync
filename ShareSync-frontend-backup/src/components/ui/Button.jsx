// src/components/ui/Button.jsx
import React from 'react';
import { cn } from './cn';

// Accessible, themeable button with variants & sizes
const VARIANTS = {
  primary:  'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700',
  secondary:'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700/60',
  subtle:   'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
  ghost:    'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60',
  danger:   'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700',
  success:  'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm rounded-full',
  md: 'h-10 px-4 text-sm rounded-full',
  lg: 'h-12 px-5 text-base rounded-full',
  icon: 'h-9 w-9 rounded-full p-0 flex items-center justify-center',
};

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  children,
  leftIcon,
  rightIcon,
  ...rest
}) {
  return (
    <Tag
      className={cn(
        'inline-flex items-center gap-2 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 disabled:opacity-60 disabled:cursor-not-allowed',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      <span>{loading ? 'Loading…' : children}</span>
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </Tag>
  );
}
