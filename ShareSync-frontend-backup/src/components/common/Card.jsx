import React from 'react';
import PropTypes from 'prop-types';

/**
 * NAMED EXPORTS: Prevents 'undefined element' errors when using dot-notation.
 */
export const CardHeader = ({ children, className = "" }) => (
  <div className={`p-5 border-b border-white/5 bg-white/[0.01] ${className}`}>
    {children}
  </div>
);

export const CardBody = ({ children, className = "" }) => (
  <div className={`p-5 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = "" }) => (
  <div className={`p-5 border-t border-white/5 bg-white/[0.01] ${className}`}>
    {children}
  </div>
);

/**
 * MAIN COMPONENT: Card
 */
const Card = ({ 
  children, 
  className = "", 
  status = "none", 
  glow = false, 
  interactive = false 
}) => {
  const statusStyles = {
    brand: "border-brand-500/20 shadow-brand-500/5",
    success: "border-success-500/20 shadow-success-500/5",
    warning: "border-warning-500/20 shadow-warning-500/5",
    danger: "border-danger-500/20 shadow-danger-500/5",
    none: "border-white/10"
  };

  const interactiveStyles = interactive ? "interactive-card cursor-pointer" : "";
  const glowEffect = glow ? "shadow-glow-brand" : "";

  return (
    <div className={`
      bg-slate-900/60 
      backdrop-blur-md 
      border 
      rounded-2xl 
      overflow-hidden 
      ${statusStyles[status] || statusStyles.none} 
      ${glowEffect} 
      ${interactiveStyles} 
      ${className}
    `}>
      {children}
    </div>
  );
};

// Static properties for dot-notation support (e.g., <Card.Header />)
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  status: PropTypes.oneOf(['brand', 'success', 'warning', 'danger', 'none']),
  glow: PropTypes.bool,
  interactive: PropTypes.bool
};

export default Card;
