// src/components/ui/Button.jsx
import React from "react";
import { cn } from "./cn";

/**
 * Reusable Button
 * - Variants: primary | outline | ghost
 * - Sizes:    sm | md | lg
 * - Optional leftIcon / rightIcon
 *
 * Notes:
 * • Primary pulls its gradient from your CSS tokens (var(--grad-accent)).
 * • Focus styles come from styles/focus.css.
 */
const SIZE_CLASSES = {
  sm: "h-8 px-3 text-sm rounded-full",
  md: "h-10 px-4 text-sm rounded-full",
  lg: "h-12 px-5 text-base rounded-full",
};

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium select-none " +
  "transition-transform duration-150 active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed " +
  "focus:outline-none";

function Primary({ className, style, children, ...rest }) {
  return (
    <button
      {...rest}
      className={cn(
        "text-white border border-transparent shadow-sm hover:-translate-y-[1px]",
        className
      )}
      style={{
        /* uses your gradient variable; falls back to a blue→cyan sweep */
        background:
          "var(--grad-accent, linear-gradient(90deg, rgb(59 130 246), rgb(34 197 94)))",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Outline({ className, style, children, ...rest }) {
  return (
    <button
      {...rest}
      className={cn(
        "bg-transparent text-[rgb(var(--text,18 24 38))] border",
        "border-[rgb(var(--border,226 232 240))] hover:bg-white/40 dark:hover:bg-white/5",
        className
      )}
      style={style}
    >
      {children}
    </button>
  );
}

function Ghost({ className, style, children, ...rest }) {
  return (
    <button
      {...rest}
      className={cn(
        "bg-transparent text-[rgb(var(--text,18 24 38))] hover:bg-black/5 dark:hover:bg-white/5",
        className
      )}
      style={style}
    >
      {children}
    </button>
  );
}

export default function Button({
  as: As,                 // optional polymorphic
  variant = "primary",
  size = "md",
  className,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...rest
}) {
  const cls = cn(BASE, SIZE_CLASSES[size] || SIZE_CLASSES.md, className);
  const Comp =
    As ||
    (variant === "outline" ? Outline : variant === "ghost" ? Ghost : Primary);

  return (
    <Comp
      className={cls}
      disabled={disabled}
      {...rest}
    >
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      <span className="inline-flex items-center">{children}</span>
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </Comp>
  );
}