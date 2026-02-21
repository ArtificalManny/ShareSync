// src/components/ui/Input.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC INPUT v4.0 - Light Theme & Dark Mode Adapted
// ═══════════════════════════════════════════════════════════════════════════════

import React, { forwardRef } from 'react';
import { Search, X as XIcon } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Input = forwardRef(({
  type = 'text',
  size = 'md',
  variant = 'default',
  label,
  helperText,
  error,
  success,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  disabled = false,
  required = false,
  className = '',
  inputClassName = '',
  ...rest
}, ref) => {

  const stateClasses = error 
    ? 'border-red-300 dark:border-red-500/50 focus:border-red-400 dark:focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/20' 
    : success 
    ? 'border-emerald-300 dark:border-emerald-500/50 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-emerald-100 dark:focus:ring-emerald-500/20' 
    : 'transition-all duration-200';

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 transition-colors duration-200">{label}{required && <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>}</label>}
      <div className="relative">
        {LeftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><LeftIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500 transition-colors duration-200" /></div>}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          required={required}
          className={cn('input', LeftIcon && 'pl-10', RightIcon && 'pr-10', stateClasses, inputClassName)}
          {...rest}
        />
        {RightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><RightIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500 transition-colors duration-200" /></div>}
      </div>
      {(helperText || error) && <p className={cn('text-xs transition-colors duration-200', error ? 'text-red-500 dark:text-red-400' : success ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-zinc-500')}>{error || helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

export const Textarea = forwardRef(({ label, helperText, error, success, disabled = false, required = false, rows = 4, resize = 'vertical', className = '', textareaClassName = '', ...rest }, ref) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 transition-colors duration-200">{label}{required && <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>}</label>}
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        required={required}
        className={cn('input transition-all duration-200', resize === 'vertical' ? 'resize-y' : 'resize-none', error && 'border-red-300 dark:border-red-500/50', textareaClassName)}
        {...rest}
      />
      {(helperText || error) && <p className={cn('text-xs transition-colors duration-200', error ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-zinc-500')}>{error || helperText}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export const SearchInput = forwardRef(({ value, onChange, onClear, placeholder = 'Search...', className = '', ...rest }, ref) => {
  const handleClear = () => {
    if (onClear) onClear();
    else if (onChange) onChange({ target: { value: '' } });
  };
  return (
    <div className={cn('relative group', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-violet-500 dark:group-focus-within:text-violet-400 w-4 h-4 transition-colors duration-200" />
      <input ref={ref} type="text" value={value} onChange={onChange} placeholder={placeholder} className="input pl-10 pr-10 transition-all duration-200" {...rest} />
      {value && <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-[#1f1f23] text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-all duration-200"><XIcon className="w-4 h-4" /></button>}
    </div>
  );
});
SearchInput.displayName = 'SearchInput';
