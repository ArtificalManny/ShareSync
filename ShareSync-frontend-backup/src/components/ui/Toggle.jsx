// src/components/ui/Toggle.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC TOGGLE v4.0 - Light Theme & Dark Mode Adapted
// ═══════════════════════════════════════════════════════════════════════════════

import React, { forwardRef } from 'react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Toggle = forwardRef(({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  labelPosition = 'right',
  size = 'md',
  className = '',
  activeColor = 'blue', 
  name,
  id,
  ...rest
}, ref) => {

  const handleToggle = () => {
    if (!disabled && onChange) onChange(!checked);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  const toggleElement = (
    <div
      ref={ref}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={cn(
        'toggle-track transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#09090B]',
        checked && 'active',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...rest}
    >
      <span className="toggle-thumb transition-transform duration-200" />
      <input type="checkbox" name={name} id={id} checked={checked} onChange={() => {}} disabled={disabled} className="sr-only" />
    </div>
  );

  if (!label && !description) return toggleElement;

  return (
    <label className={cn('flex items-start gap-3 cursor-pointer group', disabled && 'cursor-not-allowed', labelPosition === 'left' && 'flex-row-reverse')}>
      {toggleElement}
      <div className="flex-1 min-w-0">
        {label && <div className={cn('text-sm font-medium transition-colors duration-200', disabled ? 'text-slate-400 dark:text-zinc-600' : 'text-slate-700 dark:text-zinc-300 group-hover:text-violet-600 dark:group-hover:text-violet-400')}>{label}</div>}
        {description && <div className={cn('text-xs mt-0.5 transition-colors duration-200', disabled ? 'text-slate-300 dark:text-zinc-700' : 'text-slate-500 dark:text-zinc-500')}>{description}</div>}
      </div>
    </label>
  );
});

Toggle.displayName = 'Toggle';
export default Toggle;

export function ToggleGroup({ children, className = '', spacing = 'md' }) {
  const spacingClasses = { sm: 'space-y-2', md: 'space-y-4', lg: 'space-y-6' };
  return <div className={cn(spacingClasses[spacing], className, 'transition-all duration-200')}>{children}</div>;
}
export const Switch = Toggle;
