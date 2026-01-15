import React from 'react';
import { motion } from 'framer-motion';

/**
 * Button Component - Enhanced with Micro-interactions
 * 
 * BACKWARD COMPATIBLE - All existing props still work:
 * - children
 * - variant: 'primary' | 'tertiary' | 'ghost'
 * - size: 'sm' | 'md' | 'lg'
 * - fullWidth
 * - className
 * - ...props (onClick, disabled, etc.)
 * 
 * NEW OPTIONAL PROPS:
 * - icon: React element to display
 * - iconPosition: 'left' | 'right'
 * - loading: boolean
 * - animated: boolean (default true)
 * 
 * Usage (existing code still works):
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Create Project
 * </Button>
 * 
 * Usage (new features):
 * <Button variant="primary" icon={<PlusIcon />} loading={isLoading}>
 *   Create Project
 * </Button>
 */

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  // NEW optional props
  icon = null,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  animated = true,
  ...props
}) => {
  // Base styles (unchanged)
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all';

  // Variants - EXPANDED but keeps existing ones
  const variants = {
    // Existing variants (unchanged colors)
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    tertiary: 'bg-slate-700 text-slate-200 hover:bg-slate-600',
    ghost: 'hover:bg-white/5 text-slate-400',
    
    // NEW variants (optional, won't affect existing code)
    secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  // Sizes - UPDATED to add gap for icons, but maintains same padding
  const sizes = {
    sm: 'px-3 py-1 text-sm gap-1.5',
    md: 'px-4 py-2 gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  // Animation config (only applies if animated=true)
  const animationProps = animated ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17,
    },
  } : {};

  // Disabled styles
  const disabledStyles = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : '';

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
      {/* Loading state */}
      {loading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {/* Icon (left) */}
          {icon && iconPosition === 'left' && (
            <span className="flex items-center">
              {icon}
            </span>
          )}
          
          {/* Children (main content) */}
          <span>{children}</span>
          
          {/* Icon (right) */}
          {icon && iconPosition === 'right' && (
            <span className="flex items-center">
              {icon}
            </span>
          )}
        </>
      )}
    </motion.button>
  );
};

export default Button;
