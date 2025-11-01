// src/components/ui/Button.jsx
import React from "react";
import "./buttons.css";

const cn = (...a) => a.filter(Boolean).join(" ");

const SIZE = {
  sm: "btn--sm",
  md: "btn--md",
  lg: "btn--lg",
};

const VARIANT = {
  primary: "btn--primary",
  outline: "btn--outline",
  ghost: "btn--ghost",
  soft: "btn--soft",
  proton: "btn--proton",
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
  ...rest
}) {
  const classes = cn(
    "btn",
    SIZE[size] || SIZE.md,
    VARIANT[variant] || VARIANT.primary,
    "glass", // ← NEW: Glassmorphism
    className
  );

  // Gradient override for primary
  const isPrimary = variant === "primary";
  const gradientStyle = isPrimary
    ? {
        background: "linear-gradient(135deg, #6366f1, #ec4899)",
      }
    : {};

  return (
    <As
      className={classes}
      disabled={disabled}
      style={gradientStyle}
      {...rest}
    >
      {leftIcon && <span className="btn__icon">{leftIcon}</span>}
      <span className="btn__label">{children}</span>
      {rightIcon && <span className="btn__icon">{rightIcon}</span>}
    </As>
  );
}