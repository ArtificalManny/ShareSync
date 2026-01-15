import React from 'react';
import { motion } from 'framer-motion';

/**
 * Card Component - Enhanced with Physics-Based Interactions
 * 
 * BACKWARD COMPATIBLE - All existing props still work:
 * - variant: 'default' | 'elevated' | 'flat'
 * - status: 'success' | 'warning' | 'danger' | null
 * - interactive: boolean
 * - className, onClick, etc.
 * 
 * NEW OPTIONAL PROPS:
 * - glass: boolean (glassmorphism effect)
 * - glow: boolean (hover glow effect)
 * - animated: boolean (default true, set false to disable physics)
 * 
 * Usage (existing code still works):
 * <Card variant="elevated" status="success">
 *   <Card.Header>Title</Card.Header>
 *   <Card.Body>Content</Card.Body>
 * </Card>
 * 
 * Usage (new features):
 * <Card variant="elevated" glass glow animated interactive>
 *   <Card.Body>Content with physics!</Card.Body>
 * </Card>
 */

const Card = ({
  children,
  variant = 'default',
  status = null,
  interactive = false,
  glass = false,
  glow = false,
  animated = true,
  className = '',
  onClick,
  ...props
}) => {
  // Base styles (keep overflow-hidden)
  const baseStyles = 'rounded-xl transition-all duration-200 overflow-hidden';

  // Variant styles - KEEP existing + ADD new glass option
  const variantStyles = {
    // Existing variants (unchanged)
    default: 'bg-slate-800 border border-white/5',
    elevated: 'bg-slate-800 border border-white/5 shadow-lg shadow-black/40',
    flat: 'bg-slate-800/50 border border-transparent',
    
    // NEW glassmorphism variant
    glass: 'bg-slate-800/30 backdrop-blur-2xl border border-white/10',
  };

  // Status styles - KEEP existing colored left borders
  const statusStyles = status ? {
    success: 'border-l-4 border-l-emerald-500',
    warning: 'border-l-4 border-l-amber-500',
    danger: 'border-l-4 border-l-red-500',
  }[status] : '';

  // Interactive styles - KEEP existing hover behavior
  const interactiveStyles = interactive
    ? 'cursor-pointer hover:border-purple-500/50 hover:bg-slate-700/50'
    : '';

  // Glow styles - NEW hover glow effect
  const glowStyles = glow ? 'hover:shadow-glow-brand' : '';

  // Animation config - NEW physics (only if animated=true)
  const animationProps = animated && interactive ? {
    whileHover: {
      scale: 1.02,
      y: -4,
    },
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  } : {};

  // Choose the correct variant (glass takes priority if specified)
  const selectedVariant = glass ? 'glass' : variant;

  return (
    <motion.div
      {...animationProps}
      className={`
        ${baseStyles}
        ${variantStyles[selectedVariant]}
        ${statusStyles}
        ${interactiveStyles}
        ${glowStyles}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Sub-components - KEEP existing padding (p-4)
export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`p-4 border-b border-white/5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '', ...props }) => (
  <div className={`p-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`p-4 border-t border-white/5 ${className}`} {...props}>
    {children}
  </div>
);

// Attach to Card object for flexibility
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
