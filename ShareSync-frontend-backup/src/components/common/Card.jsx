import React from 'react';

export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-4 border-b border-white/5 ${className}`}>{children}</div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`p-4 border-t border-white/5 ${className}`}>{children}</div>
);

const Card = ({ children, variant = 'default', status = null, interactive = false, className = '', onClick, ...props }) => {
  const baseStyles = 'rounded-xl transition-all duration-200 overflow-hidden';
  const variantStyles = {
    default: 'bg-slate-800 border border-white/5',
    elevated: 'bg-slate-800 border border-white/5 shadow-lg shadow-black/40',
    flat: 'bg-slate-800/50 border border-transparent',
  };
  
  const statusStyles = status ? {
    success: 'border-l-4 border-l-success-500',
    warning: 'border-l-4 border-l-warning-500',
    danger: 'border-l-4 border-l-danger-500',
  }[status] : '';

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${statusStyles} ${interactive ? 'cursor-pointer hover:border-brand-500/50 hover:bg-slate-700/50' : ''} ${className}`} 
      onClick={onClick} 
      {...props}
    >
      {children}
    </div>
  );
};

// Attach them to the main object as well for flexibility
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
