// src/components/ui/Input.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC INPUT v4.0 - "The Gallery Walk" Light Theme
// ═══════════════════════════════════════════════════════════════════════════════
//
// A comprehensive input component with:
// - Multiple sizes (xs, sm, md, lg)
// - Variants (default, filled, ghost)
// - Left/right icon support
// - Error/success states
// - Label and helper text
// - NO BACKEND CHANGES
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { forwardRef } from 'react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Size configurations
const SIZE_CONFIGS = {
  xs: {
    input: 'h-7 text-xs px-2.5',
    icon: 'w-3.5 h-3.5',
    iconLeft: 'pl-7',
    iconRight: 'pr-7',
  },
  sm: {
    input: 'h-8 text-sm px-3',
    icon: 'w-4 h-4',
    iconLeft: 'pl-8',
    iconRight: 'pr-8',
  },
  md: {
    input: 'h-10 text-sm px-3.5',
    icon: 'w-4 h-4',
    iconLeft: 'pl-10',
    iconRight: 'pr-10',
  },
  lg: {
    input: 'h-12 text-base px-4',
    icon: 'w-5 h-5',
    iconLeft: 'pl-11',
    iconRight: 'pr-11',
  },
};

// Variant configurations
const VARIANT_CONFIGS = {
  default: {
    base: 'bg-white border border-slate-200',
    focus: 'focus:border-violet-400 focus:ring-2 focus:ring-violet-100',
    hover: 'hover:border-slate-300',
  },
  filled: {
    base: 'bg-slate-50 border border-transparent',
    focus: 'focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100',
    hover: 'hover:bg-slate-100',
  },
  ghost: {
    base: 'bg-transparent border border-transparent',
    focus: 'focus:bg-slate-50 focus:border-slate-200',
    hover: 'hover:bg-slate-50',
  },
};

const Input = forwardRef(({
  // Core props
  type = 'text',
  size = 'md',
  variant = 'default',
  
  // Label & helper
  label,
  helperText,
  error,
  success,
  
  // Icons
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  
  // State
  disabled = false,
  required = false,
  
  // Styling
  className = '',
  inputClassName = '',
  
  // Rest
  ...rest
}, ref) => {
  const sizeConfig = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;
  const variantConfig = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.default;

  // State-based styles
  const stateClasses = error
    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
    : success
    ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100'
    : '';

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Left icon */}
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <LeftIcon className={cn(sizeConfig.icon, 'text-slate-400')} />
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          required={required}
          className={cn(
            // Base styles
            'w-full rounded-lg outline-none transition-all duration-200',
            'text-slate-800 placeholder:text-slate-400',
            
            // Size
            sizeConfig.input,
            LeftIcon && sizeConfig.iconLeft,
            RightIcon && sizeConfig.iconRight,
            
            // Variant
            variantConfig.base,
            variantConfig.focus,
            variantConfig.hover,
            
            // State
            stateClasses,
            
            // Disabled
            disabled && 'opacity-50 cursor-not-allowed bg-slate-100',
            
            inputClassName
          )}
          {...rest}
        />

        {/* Right icon */}
        {RightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <RightIcon className={cn(
              sizeConfig.icon,
              error ? 'text-red-400' : success ? 'text-emerald-400' : 'text-slate-400'
            )} />
          </div>
        )}
      </div>

      {/* Helper text */}
      {(helperText || error) && (
        <p className={cn(
          'text-xs',
          error ? 'text-red-500' : success ? 'text-emerald-600' : 'text-slate-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

// ═══════════════════════════════════════════════════════════════════════════════
// TEXTAREA - Multiline input variant
// ═══════════════════════════════════════════════════════════════════════════════
export const Textarea = forwardRef(({
  label,
  helperText,
  error,
  success,
  disabled = false,
  required = false,
  rows = 4,
  resize = 'vertical',
  className = '',
  textareaClassName = '',
  ...rest
}, ref) => {
  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        required={required}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-lg outline-none transition-all duration-200',
          'bg-white border border-slate-200',
          'text-sm text-slate-800 placeholder:text-slate-400',
          'focus:border-violet-400 focus:ring-2 focus:ring-violet-100',
          'hover:border-slate-300',
          resizeClasses[resize],
          error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
          success && 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100',
          disabled && 'opacity-50 cursor-not-allowed bg-slate-100',
          textareaClassName
        )}
        {...rest}
      />

      {(helperText || error) && (
        <p className={cn(
          'text-xs',
          error ? 'text-red-500' : success ? 'text-emerald-600' : 'text-slate-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH INPUT - Input with search icon and clear button
// ═══════════════════════════════════════════════════════════════════════════════
import { Search, X } from 'lucide-react';

export const SearchInput = forwardRef(({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  size = 'md',
  className = '',
  ...rest
}, ref) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  const sizeConfig = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;

  return (
    <div className={cn('relative', className)}>
      <Search className={cn(
        'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400',
        sizeConfig.icon
      )} />
      
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg outline-none transition-all duration-200',
          'bg-white border border-slate-200',
          'text-slate-800 placeholder:text-slate-400',
          'focus:border-violet-400 focus:ring-2 focus:ring-violet-100',
          'hover:border-slate-300',
          sizeConfig.input,
          sizeConfig.iconLeft,
          value && sizeConfig.iconRight
        )}
        {...rest}
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2',
            'p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600',
            'transition-colors'
          )}
        >
          <X className={sizeConfig.icon} />
        </button>
      )}
    </div>
  );
});

SearchInput.displayName = 'SearchInput';
