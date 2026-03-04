// src/components/ui/Button.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC BUTTON v4.0 - "The Gallery Walk" Light Theme + Signature Gradients
// UPDATED (Task 2.6): Tied `glow` to Phase 2 `xpGlow` animation system.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

const cn = (...a) => a.filter(Boolean).join(" ");

const SIZE = {
  xs: "is-sm", // mapped to legacy sizing
  sm: "is-sm",
  md: "is-md",
  lg: "is-lg",
  xl: "is-lg",
};

const VARIANT = {
  // mapped to our new button.css Blueprint classes
  primary: "btn-primary",
  blue: "btn-blue",
  outline: "btn-outline",
  
  // legacy fallbacks
  sunset: "btn-primary", 
  ocean: "btn-blue",
  aurora: "btn-primary",
  ghost: "ui-btn--ghost",
  soft: "btn--soft",
  success: "btn-primary",
  warning: "btn-primary",
  danger: "btn-primary",
  live: "btn-blue",
  energy: "btn-primary",
  proton: "btn--proton",
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
  loading = false,
  glow = false,
  pulse = false,
  fullWidth = false,
  state = "idle", 
  motionEnabled = true,
  ...rest
}) {
  const MotionAs = useMemo(() => getMotionComponent(As), [As]);

  const derivedState = loading ? "loading" : state;
  const isBusy = derivedState === "loading";
  const isDisabled = Boolean(disabled) || isBusy;

  const classes = cn(
    "btn transition-all duration-200",
    SIZE[size] || SIZE.md,
    VARIANT[variant] || VARIANT.primary,
    glow && "animate-[xpGlow_2s_infinite]", // ⭐ Connected to Phase 2 glow system
    fullWidth && "w-full",
    className
  );

  const whileHover = motionEnabled && !isDisabled ? { scale: 1.02 } : undefined;
  const whileTap = motionEnabled && !isDisabled ? { scale: 0.98 } : undefined;

  return (
    <MotionAs
      className={classes}
      disabled={typeof As === "string" && As.toLowerCase() === "button" ? isDisabled : undefined}
      aria-disabled={isDisabled ? true : undefined}
      whileHover={whileHover}
      whileTap={whileTap}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      {...rest}
    >
      <AnimatePresence mode="wait">
        {derivedState === "loading" ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center justify-center absolute inset-0"
            aria-hidden="true"
          >
             <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
          </motion.span>
        ) : derivedState === "success" ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center justify-center absolute inset-0"
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
            className="flex items-center justify-center absolute inset-0"
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
            className={cn("flex items-center gap-2", isBusy && "opacity-0")}
          >
            {leftIcon && <span>{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span>{rightIcon}</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </MotionAs>
  );
}

export function ButtonGroup({ children, className, attached = false }) {
  return <div className={cn("flex gap-2", attached && "-space-x-px", className)} role="group">{children}</div>;
}

export function IconButton({ icon, variant = "ghost", size = "md", className, label, ...rest }) {
  return (
    <Button variant={variant} size={size} className={cn("px-2", className)} aria-label={label} {...rest}>
      {icon}
    </Button>
  );
}

export function SunsetButton({ children, ...props }) { return <Button variant="primary" {...props}>{children}</Button>; }
export function OceanButton({ children, ...props }) { return <Button variant="blue" {...props}>{children}</Button>; }
export function AuroraButton({ children, ...props }) { return <Button variant="primary" {...props}>{children}</Button>; }
export function BlueButton({ children, ...props }) { return <Button variant="blue" {...props}>{children}</Button>; }
