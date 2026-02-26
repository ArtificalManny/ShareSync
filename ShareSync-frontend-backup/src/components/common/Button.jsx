import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  icon = null,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  animated = true,
  ...props
}) => {
  // Enhanced physics: active:scale-[0.98] transition-all duration-75
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-75 active:scale-[0.98] active:shadow-none shadow-[0_1px_2px_rgba(0,0,0,0.05)]';

  const variants = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    tertiary: 'bg-slate-700 text-slate-200 hover:bg-slate-600',
    ghost: 'hover:bg-slate-100 text-slate-500 shadow-none',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  const animationProps = animated ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.96 },
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17,
    },
  } : {};

  const disabledStyles = (disabled || loading) ? 'opacity-50 cursor-not-allowed shadow-none active:scale-100' : '';

  return (
    <motion.button
      {...animationProps}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabledStyles}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full shrink-0"
          />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="flex items-center shrink-0">
              {icon}
            </span>
          )}
          
          <span className="leading-tight">{children}</span>
          
          {icon && iconPosition === 'right' && (
            <span className="flex items-center shrink-0">
              {icon}
            </span>
          )}
        </>
      )}
    </motion.button>
  );
};

export default Button;
