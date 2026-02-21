// src/components/ui/Toggle.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC TOGGLE v4.0 - "The Gallery Walk" Light Theme
// ═══════════════════════════════════════════════════════════════════════════════
//
// A comprehensive toggle/switch component with:
// - Multiple sizes (sm, md, lg)
// - Blue when ON (as requested!)
// - Label support (left or right)
// - Description text
// - Disabled state
// - NO BACKEND CHANGES
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { forwardRef } from 'react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Size configurations
const SIZE_CONFIGS = {
  sm: {
    track: 'w-8 h-5',
    thumb: 'w-3.5 h-3.5',
    thumbTranslate: 'translate-x-3.5',
    thumbStart: 'translate-x-0.5',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-4 h-4',
    thumbTranslate: 'translate-x-5',
    thumbStart: 'translate-x-1',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-5 h-5',
    thumbTranslate: 'translate-x-7',
    thumbStart: 'translate-x-1',
  },
};

const Toggle = forwardRef(({
  // State
  checked = false,
  onChange,
  disabled = false,
  
  // Label
  label,
  description,
  labelPosition = 'right', // 'left' | 'right'
  
  // Styling
  size = 'md',
  className = '',
  
  // Color (default blue when ON)
  activeColor = 'blue', // 'blue' | 'violet' | 'emerald' | 'red'
  
  // Rest
  name,
  id,
  ...rest
}, ref) => {
  const sizeConfig = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;

  // ✅ Active color configurations (Blue default when ON!)
  const activeColorClasses = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    violet: 'bg-gradient-to-r from-violet-500 to-violet-600',
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    red: 'bg-gradient-to-r from-red-500 to-red-600',
  };

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
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
        'relative inline-flex flex-shrink-0 cursor-pointer rounded-full',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
        sizeConfig.track,
        checked
          ? activeColorClasses[activeColor] || activeColorClasses.blue
          : 'bg-slate-300',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
      {...rest}
    >
      {/* Thumb */}
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow-sm',
          'transform transition-transform duration-200 ease-in-out',
          sizeConfig.thumb,
          'absolute top-1/2 -translate-y-1/2',
          checked ? sizeConfig.thumbTranslate : sizeConfig.thumbStart
        )}
      />
      
      {/* Hidden input for form compatibility */}
      <input
        type="checkbox"
        name={name}
        id={id}
        checked={checked}
        onChange={() => {}}
        disabled={disabled}
        className="sr-only"
      />
    </div>
  );

  // No label - just return toggle
  if (!label && !description) {
    return toggleElement;
  }

  // With label
  return (
    <label
      className={cn(
        'flex items-start gap-3 cursor-pointer group',
        disabled && 'cursor-not-allowed',
        labelPosition === 'left' && 'flex-row-reverse',
        className
      )}
    >
      {toggleElement}
      
      <div className="flex-1 min-w-0">
        {label && (
          <div className={cn(
            'text-sm font-medium transition-colors',
            disabled ? 'text-slate-400' : 'text-slate-700 group-hover:text-slate-900'
          )}>
            {label}
          </div>
        )}
        {description && (
          <div className={cn(
            'text-xs mt-0.5',
            disabled ? 'text-slate-300' : 'text-slate-500'
          )}>
            {description}
          </div>
        )}
      </div>
    </label>
  );
});

Toggle.displayName = 'Toggle';

export default Toggle;

// ═══════════════════════════════════════════════════════════════════════════════
// TOGGLE GROUP - Multiple toggles in a list
// ═══════════════════════════════════════════════════════════════════════════════
export function ToggleGroup({ 
  children, 
  className = '',
  spacing = 'md' // 'sm' | 'md' | 'lg'
}) {
  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
  };

  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SWITCH - Alias for Toggle (for backwards compatibility)
// ═══════════════════════════════════════════════════════════════════════════════
export const Switch = Toggle;
