import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', fullWidth = false, className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all';
  const variants = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    tertiary: 'bg-slate-700 text-slate-200 hover:bg-slate-600',
    ghost: 'hover:bg-white/5 text-slate-400',
  };
  const sizes = { sm: 'px-3 py-1 text-sm', md: 'px-4 py-2', lg: 'px-6 py-3 text-lg' };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
