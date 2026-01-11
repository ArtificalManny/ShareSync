import React from 'react';

export const CardHeader = ({ children, className = "" }) => (
  <div className={`p-4 border-b border-white/5 ${className}`}>{children}</div>
);

export const CardBody = ({ children, className = "" }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = "" }) => (
  <div className={`p-4 border-t border-white/5 ${className}`}>{children}</div>
);

const Card = ({ 
  children, 
  className = "", 
  variant = "default", 
  status = "none", 
  glow = false 
}) => {
  const statusStyles = {
    brand: "border-brand-500/20 shadow-brand-500/5",
    success: "border-success-500/20 shadow-success-500/5",
    none: "border-white/10"
  };

  const glowEffect = glow ? "shadow-[0_0_20px_rgba(168,85,247,0.15)]" : "";

  return (
    <div className={`bg-slate-900/50 backdrop-blur-sm border rounded-2xl ${statusStyles[status] || statusStyles.none} ${glowEffect} ${className}`}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
