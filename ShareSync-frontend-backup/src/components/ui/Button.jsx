// src/components/ui/Button.jsx
import React from "react";
import "./buttons.css";

// tiny classnames helper
const cn = (...a) => a.filter(Boolean).join(" ");

/**
 * Reusable Button
 * - Variants: primary | outline | ghost
 * - Sizes:    sm | md | lg
 * - Optional leftIcon / rightIcon
 *
 * Styles live in components/ui/buttons.css
 */
const SIZE = {
  sm: "btn--sm",
  md: "btn--md",
  lg: "btn--lg",
};

const VARIANT = {
  primary: "btn--primary",
  outline: "btn--outline",
  ghost: "btn--ghost",
};

export default function Button({
  as: As = "button",         // optional polymorphic element
  variant = "primary",
  size = "md",
  className,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...rest
}) {
  const classes = cn("btn", SIZE[size] || SIZE.md, VARIANT[variant] || VARIANT.primary, className);

  return (
    <As className={classes} disabled={disabled} {...rest}>
      {leftIcon && <span className="btn__icon">{leftIcon}</span>}
      <span className="btn__label">{children}</span>
      {rightIcon && <span className="btn__icon">{rightIcon}</span>}
    </As>
  );
}