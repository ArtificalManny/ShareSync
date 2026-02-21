// src/components/ui/Button.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC BUTTON v4.0 - "The Gallery Walk" Light Theme
// ═══════════════════════════════════════════════════════════════════════════════
//
// CHANGES IN v4.0:
// - Updated gradient colors for light theme
// - All functionality preserved exactly
// - NO BACKEND CHANGES
//
// Kept 100% backwards compatible with existing props/styles.
// Adds OPTIONAL micro-interactions:
// - Framer Motion hover/tap scale (disabled when disabled/loading)
// - Optional "state" overlay: loading | success | error
// - Success/error icons via lucide-react
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import "./buttons.css";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

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
  live: "btn--live",
  energy: "btn--energy",

  // Legacy/special
  proton: "btn--proton",
};

// ✅ UPDATED: Light theme gradient styles
const GRADIENT_STYLES = {
  primary: {
    background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
  },
  success: {
    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
  },
  warning: {
    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
  },
  danger: {
    background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
  },
  live: {
    background: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)",
  },
  energy: {
    background: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
  },
};

function getMotionComponent(As) {
  if (typeof As === "string") {
    const key = As.toLowerCase();
    return motion[key] || motion.button;
  }
  return motion(As);
}

export default function Button({
  as: As = "button",
  variant = "primary",
  size = "md",
  className,
  leftIcon,
  rightIcon,
  children,
  disabled,

  // Existing API (kept)
  loading = false,
  glow = false,
  pulse = false,
  fullWidth = false,

  // Optional micro-interaction state machine
  state = "idle", // idle | loading | success | error

  // Motion toggles (optional)
  motionEnabled = true,

  ...rest
}) {
  const MotionAs = useMemo(() => getMotionComponent(As), [As]);

  const derivedState = loading ? "loading" : state;
  const isBusy = derivedState === "loading";
  const isDisabled = Boolean(disabled) || isBusy;

  const classes = cn(
    "btn",
    SIZE[size] || SIZE.md,
    VARIANT[variant] || VARIANT.primary,
    glow && "btn--glow",
    pulse && "btn--pulse",
    fullWidth && "btn--full-width",
    isBusy && "btn--loading",
    derivedState === "error" && "btn--error-state",
    derivedState === "success" && "btn--success-state",
    className
  );

  // Apply gradient for filled variants
  const gradientVariants = ["primary", "success", "warning", "danger", "live", "energy"];
  const useGradient = gradientVariants.includes(variant);
  const gradientStyle = useGradient ? GRADIENT_STYLES[variant] : {};

  // Motion (safe defaults)
  const whileHover = motionEnabled && !isDisabled ? { scale: 1.02 } : undefined;
  const whileTap = motionEnabled && !isDisabled ? { scale: 0.98 } : undefined;

  return (
    <MotionAs
      className={classes}
      disabled={typeof As === "string" && As.toLowerCase() === "button" ? isDisabled : undefined}
      aria-disabled={isDisabled ? true : undefined}
      style={gradientStyle}
      whileHover={whileHover}
      whileTap={whileTap}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      {...rest}
    >
      {/* Overlays: loading / success / error */}
      <AnimatePresence mode="wait">
        {derivedState === "loading" ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="btn__overlay"
            aria-hidden="true"
          >
            <span className="btn__spinner" aria-hidden="true">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
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
          </motion.span>
        ) : derivedState === "success" ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="btn__overlay"
            aria-hidden="true"
          >
            <Check className="w-4 h-4" />
          </motion.span>
        ) : derivedState === "error" ? (
          <motion.span
            key="error"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="btn__overlay"
            aria-hidden="true"
          >
            <X className="w-4 h-4" />
          </motion.span>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.95 }}
            className="btn__content"
          >
            {leftIcon && !isBusy && (
              <span className="btn__icon btn__icon--left">{leftIcon}</span>
            )}

            <span className={cn("btn__label", isBusy && "opacity-0")}>{children}</span>

            {rightIcon && <span className="btn__icon btn__icon--right">{rightIcon}</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </MotionAs>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON GROUP - For related actions
// ═══════════════════════════════════════════════════════════════════════════════
export function ButtonGroup({ children, className, attached = false }) {
  return (
    <div
      className={cn("btn-group", attached && "btn-group--attached", className)}
      role="group"
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICON BUTTON - Square button with just an icon
// ═══════════════════════════════════════════════════════════════════════════════
export function IconButton({ icon, variant = "ghost", size = "md", className, label, ...rest }) {
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
