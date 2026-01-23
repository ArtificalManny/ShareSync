// src/components/ui/Button.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC BUTTON v2.0 - Phase 1: Emotional Color System
// ═══════════════════════════════════════════════════════════════════════════════
// 
// NOW USING:
// - Deep Violet (#7C3AED → #6D28D9) as primary brand gradient
// - Semantic colors: success (mint), warning (amber), danger (red), live (cyan)
// - Momentum-responsive glow on primary buttons
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import "./buttons.css";

const cn = (...a) => a.filter(Boolean).join(" ");

const SIZE = {
  xs: "btn--xs",
  sm: "btn--sm",
  md: "btn--md",
  lg: "btn--lg",
  xl: "btn--xl",
};

const VARIANT = {
  // Primary - Deep Violet brand gradient
  primary: "btn--primary",
  
  // Secondary variants
  outline: "btn--outline",
  ghost: "btn--ghost",
  soft: "btn--soft",
  
  // Semantic variants
  success: "btn--success",
  warning: "btn--warning",
  danger: "btn--danger",
  live: "btn--live",      // Electric Cyan for real-time actions
  energy: "btn--energy",  // Coral for high-momentum actions
  
  // Legacy/special
  proton: "btn--proton",
};

// Deep Violet gradient styles (inline for primary)
const GRADIENT_STYLES = {
  primary: {
    background: "linear-gradient(135deg, var(--brand-600, #7C3AED) 0%, var(--brand-700, #6D28D9) 100%)",
  },
  success: {
    background: "linear-gradient(135deg, var(--success-500, #10B981) 0%, var(--success-600, #059669) 100%)",
  },
  warning: {
    background: "linear-gradient(135deg, var(--warning-500, #F59E0B) 0%, var(--warning-600, #D97706) 100%)",
  },
  danger: {
    background: "linear-gradient(135deg, var(--error-500, #EF4444) 0%, var(--error-600, #DC2626) 100%)",
  },
  live: {
    background: "linear-gradient(135deg, var(--cyan-500, #06B6D4) 0%, var(--cyan-600, #0891B2) 100%)",
  },
  energy: {
    background: "linear-gradient(135deg, var(--energy-500, #F43F5E) 0%, var(--energy-600, #E11D48) 100%)",
  },
};

export default function Button({
  as: As = "button",
  variant = "primary",
  size = "md",
  className,
  leftIcon,
  rightIcon,
  children,
  disabled,
  loading = false,
  glow = false,        // Enable momentum glow effect
  pulse = false,       // Enable subtle pulse animation
  fullWidth = false,
  ...rest
}) {
  const classes = cn(
    "btn",
    SIZE[size] || SIZE.md,
    VARIANT[variant] || VARIANT.primary,
    glow && "btn--glow",
    pulse && "btn--pulse",
    fullWidth && "btn--full-width",
    loading && "btn--loading",
    className
  );

  // Apply gradient for filled variants
  const gradientVariants = ['primary', 'success', 'warning', 'danger', 'live', 'energy'];
  const useGradient = gradientVariants.includes(variant);
  const gradientStyle = useGradient ? GRADIENT_STYLES[variant] : {};

  return (
    <As
      className={classes}
      disabled={disabled || loading}
      style={gradientStyle}
      {...rest}
    >
      {/* Loading spinner */}
      {loading && (
        <span className="btn__spinner" aria-hidden="true">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle 
              className="opacity-25" 
              cx="12" cy="12" r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
          </svg>
        </span>
      )}
      
      {/* Left icon */}
      {leftIcon && !loading && (
        <span className="btn__icon btn__icon--left">{leftIcon}</span>
      )}
      
      {/* Label */}
      <span className={cn("btn__label", loading && "opacity-0")}>
        {children}
      </span>
      
      {/* Right icon */}
      {rightIcon && (
        <span className="btn__icon btn__icon--right">{rightIcon}</span>
      )}
    </As>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON GROUP - For related actions
// ═══════════════════════════════════════════════════════════════════════════════
export function ButtonGroup({ children, className, attached = false }) {
  return (
    <div 
      className={cn(
        "btn-group",
        attached && "btn-group--attached",
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICON BUTTON - Square button with just an icon
// ═══════════════════════════════════════════════════════════════════════════════
export function IconButton({
  icon,
  variant = "ghost",
  size = "md",
  className,
  label,
  ...rest
}) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn("btn--icon-only", className)}
      aria-label={label}
      {...rest}
    >
      {icon}
    </Button>
  );
}
