// src/components/common/Card.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────────────
   MAIN CARD COMPONENT
───────────────────────────────────────────────────────────────────────── */
const Card = ({
  children,
  variant = 'ambient',
  status = null,
  interactive = false,
  animated = true,
  padding = 'md',
  className = '',
  onClick,
  as: Component = 'div',
  ...props
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  }[padding];

  const baseStyles = 'rounded-xl transition-all duration-200 overflow-hidden';

  const variantStyles = {
    ambient: 'bg-surface-1 border border-white/[0.06]',
    elevated: 'bg-surface-1 border border-white/[0.08] shadow-lg shadow-black/20',
    highlight: 'bg-surface-1 border border-brand/30 border-l-2 border-l-brand',
  };

  const statusStyles = status && variant !== 'highlight' ? {
    success: 'border-l-2 border-l-success',
    warning: 'border-l-2 border-l-warning',
    danger: 'border-l-2 border-l-danger',
  }[status] : '';

  const interactiveStyles = interactive ? `
    cursor-pointer 
    hover:bg-surface-2 
    hover:border-white/[0.1]
    ${variant === 'elevated' ? 'hover:shadow-xl hover:shadow-black/30' : ''}
    ${variant === 'highlight' ? 'hover:border-brand/50' : ''}
  ` : '';

  const animationProps = animated && interactive ? {
    whileHover: { y: -2 },
    whileTap: { scale: 0.98 },
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  } : {};

  const Tag = animated && interactive ? motion.div : Component;
  const motionProps = animated && interactive ? animationProps : {};

  return (
    <Tag
      className={`
        ${baseStyles}
        ${variantStyles[variant] || variantStyles.ambient}
        ${statusStyles}
        ${interactiveStyles}
        ${paddingStyles}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {children}
    </Tag>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   CARD SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────── */

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`px-5 py-4 border-b border-white/[0.06] -mx-5 -mt-5 mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>{children}</div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`pt-4 mt-4 border-t border-white/[0.06] ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', size = 'md', ...props }) => {
  const sizeStyles = {
    sm: 'text-sm font-medium',
    md: 'text-base font-semibold',
    lg: 'text-lg font-semibold',
  }[size];
  return <h3 className={`text-text-primary ${sizeStyles} ${className}`} {...props}>{children}</h3>;
};

export const CardMeta = ({ children, className = '', ...props }) => (
  <p className={`text-xs text-text-tertiary ${className}`} {...props}>{children}</p>
);

export const CardMetric = ({ value, label, color = 'text-text-primary', className = '', ...props }) => (
  <div className={className} {...props}>
    <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    {label && <div className="text-[10px] text-text-tertiary uppercase tracking-wider mt-0.5">{label}</div>}
  </div>
);

export const CardBadge = ({ children, variant = 'default', className = '', ...props }) => {
  const variantStyles = {
    default: 'bg-surface-2 text-text-secondary',
    brand: 'bg-brand/10 text-brand',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  }[variant];

  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${variantStyles} ${className}`} 
      {...props}
    >
      {children}
    </span>
  );
};

export const CardIconBox = ({ children, variant = 'default', className = '', ...props }) => {
  const variantStyles = {
    default: 'bg-surface-2 text-text-tertiary',
    brand: 'bg-brand/10 text-brand',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  }[variant];

  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${variantStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   ATTACH SUB-COMPONENTS & EXPORTS
───────────────────────────────────────────────────────────────────────── */
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Title = CardTitle;
Card.Meta = CardMeta;
Card.Metric = CardMetric;
Card.Badge = CardBadge;
Card.IconBox = CardIconBox;

export { Card };
export default Card;
