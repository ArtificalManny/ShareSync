// src/components/ui/Button.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC BUTTON v4.0 - "The Gallery Walk" Light Theme + Signature Gradients
// ═══════════════════════════════════════════════════════════════════════════════
//
// SIGNATURE GRADIENT VARIANTS:
// - primary: Brand violet gradient (default)
// - sunset: Violet → Purple → Pink (CTAs, hero buttons)
// - ocean: Blue → Cyan → Teal (info actions)
// - aurora: Full spectrum (special moments)
// - blue: Blue action gradient (Save, Start Sprint)
//
// All functionality preserved exactly. NO BACKEND CHANGES.
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
  
  // Signature Gradients (NEW)
  sunset: "btn--sunset",
  ocean: "btn--ocean",
  aurora: "btn--aurora",
  blue: "btn--blue",

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

// Signature gradient styles
const GRADIENT_STYLES = {
  // Primary brand
  primary: {
    background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
  },
  // Sunset - CTAs and hero buttons
  sunset: {
    background: "linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #EC4899 100%)",
  },
  // Ocean - Info actions
  ocean: {
    background: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)",
  },
  // Aurora - Special moments
  aurora: {
    background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF 100%)",
  },
  // Blue - Save, Start Sprint actions
  blue: {
    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
  },
  // Semantic
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

// Shadow colors for each variant
const SHADOW_COLORS = {
  primary: "rgba(139, 92, 246, 0.25)",
  sunset: "rgba(168, 85, 247, 0.25)",
  ocean: "rgba(6, 182, 212, 0.25)",
  aurora: "rgba(139, 92, 246, 0.2)",
  blue: "rgba(59, 130, 246, 0.25)",
  success: "rgba(16, 185, 129, 0.25)",
  warning: "rgba(245, 158, 11, 0.25)",
  danger: "rgba(239, 68, 68, 0.25)",
  live: "rgba(6, 182, 212, 0.25)",
  energy: "rgba(244, 63, 94, 0.25)",
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
  const gradientVariants = ["primary", "sunset", "ocean", "aurora", "blue", "success", "warning", "danger", "live", "energy"];
  const useGradient = gradientVariants.includes(variant);
  const gradientStyle = useGradient ? GRADIENT_STYLES[variant] : {};
  
  // Add shadow
  const shadowColor = SHADOW_COLORS[variant] || SHADOW_COLORS.primary;
  const shadowStyle = useGradient ? { boxShadow: `0 4px 14px ${shadowColor}` } : {};

  // Motion (safe defaults)
  const whileHover = motionEnabled && !isDisabled ? { scale: 1.02 } : undefined;
  const whileTap = motionEnabled && !isDisabled ? { scale: 0.98 } : undefined;

  return (
    <MotionAs
      className={classes}
      disabled={typeof As === "string" && As.toLowerCase() === "button" ? isDisabled : undefined}
      aria-disabled={isDisabled ? true : undefined}
      style={{ ...gradientStyle, ...shadowStyle }}
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

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT BUTTON PRESETS
// Convenient shortcuts for signature gradient buttons
// ═══════════════════════════════════════════════════════════════════════════════

export function SunsetButton({ children, ...props }) {
  return <Button variant="sunset" {...props}>{children}</Button>;
}

export function OceanButton({ children, ...props }) {
  return <Button variant="ocean" {...props}>{children}</Button>;
}

export function AuroraButton({ children, ...props }) {
  return <Button variant="aurora" {...props}>{children}</Button>;
}

export function BlueButton({ children, ...props }) {
  return <Button variant="blue" {...props}>{children}</Button>;
}
