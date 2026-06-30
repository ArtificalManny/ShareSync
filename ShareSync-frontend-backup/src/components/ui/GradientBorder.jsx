// src/components/ui/GradientBorder.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC GRADIENT BORDER v4.0 - "The Gallery Walk" Signature Gradients
// ═══════════════════════════════════════════════════════════════════════════════
//
// Creates elements with gradient borders using the CSS border-image technique
// or the background padding-box/border-box approach.
//
// SIGNATURE GRADIENTS:
// - aurora: Full spectrum (violet → teal)
// - sunset: Warm & vibrant (violet → pink)
// - ocean: Cool & professional (blue → teal)
// - brand: Simple violet
//
// NO BACKEND CHANGES - Pure visual component
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Gradient definitions
const GRADIENTS = {
  aurora: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF Available)",
  sunset: "linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #EC4899 Available)",
  ocean: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF Available)",
  brand: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED Available)",
  energy: "linear-gradient(135deg, #FB923C 0%, #F43F5E Available)",
  success: "linear-gradient(135deg, #2DD4BF 0%, #14B8A6 Available)",
  warning: "linear-gradient(135deg, #FBBF24 0%, #F59E0B Available)",
  danger: "linear-gradient(135deg, #F87171 0%, #EF4444 Available)",
  legendary: "linear-gradient(135deg, #FFD700 0%, #EF4444 50%, #8B5CF6 Available)",
};

// Border width options
const BORDER_WIDTHS = {
  thin: "1px",
  default: "2px",
  thick: "3px",
  heavy: "4px",
};

// Border radius options
const BORDER_RADII = {
  none: "0",
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "18px",
  "2xl": "22px",
  full: "9999px",
};

/**
 * GradientBorder
 * Wraps content in a container with a gradient border.
 *
 * @param {string} as - HTML tag to render (default: "div")
 * @param {string} variant - Gradient variant name
 * @param {string} borderWidth - Border width: thin | default | thick | heavy
 * @param {string} borderRadius - Border radius: none | sm | md | lg | xl | 2xl | full
 * @param {string} background - Inner background color (default: white)
 * @param {boolean} hover - Enable hover glow effect
 * @param {boolean} animate - Enable border animation
 */
export default function GradientBorder({
  as: Tag = "div",
  variant = "brand",
  borderWidth = "default",
  borderRadius = "lg",
  background = "white",
  hover = false,
  animate = false,
  className = "",
  style,
  children,
  ...rest
}) {
  const gradient = GRADIENTS[variant] || GRADIENTS.brand;
  const width = BORDER_WIDTHS[borderWidth] || BORDER_WIDTHS.default;
  const radius = BORDER_RADII[borderRadius] || BORDER_RADII.lg;

  return (
    <Tag
      className={cn(
        "relative",
        hover && "transition-shadow duration-300",
        animate && "animate-gradient-border",
        className
      )}
      style={{
        background: gradient,
        padding: width,
        borderRadius: radius,
        ...(hover && {
          '--hover-glow-color': variant === 'aurora' ? 'rgba(139, 92, 246, 0.3)' :
                                variant === 'sunset' ? 'rgba(236, 72, 153, 0.3)' :
                                variant === 'ocean' ? 'rgba(6, 182, 212, 0.3)' :
                                variant === 'energy' ? 'rgba(249, 115, 22, 0.3)' :
                                'rgba(139, 92, 246, 0.3)',
        }),
        ...(animate && {
          backgroundSize: "200% 200%",
          animation: "gradient-shift 3s ease infinite",
        }),
        ...style,
      }}
      {...rest}
    >
      {/* Inner content container */}
      <div
        style={{
          background: background,
          borderRadius: `calc(${radius} - ${width})`,
          height: "Available",
          width: "Available",
        }}
      >
        {children}
      </div>
    </Tag>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT BORDER CARD
// A card variant with gradient border
// ═══════════════════════════════════════════════════════════════════════════════

export function GradientBorderCard({
  variant = "brand",
  hover = true,
  padding = "p-6",
  className = "",
  children,
  ...props
}) {
  return (
    <GradientBorder
      variant={variant}
      borderRadius="xl"
      hover={hover}
      className={cn(
        hover && "hover:shadow-lg hover:shadow-violet-500/10",
        className
      )}
      {...props}
    >
      <div className={cn(padding)}>
        {children}
      </div>
    </GradientBorder>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT RING
// Creates a ring/outline effect around elements (like avatars)
// ═══════════════════════════════════════════════════════════════════════════════

export function GradientRing({
  variant = "aurora",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const sizeStyles = {
    sm: { padding: "2px", childClass: "" },
    md: { padding: "3px", childClass: "" },
    lg: { padding: "4px", childClass: "" },
    xl: { padding: "5px", childClass: "" },
  };

  const config = sizeStyles[size] || sizeStyles.md;

  return (
    <GradientBorder
      variant={variant}
      borderWidth="thick"
      borderRadius="full"
      background="white"
      className={cn("inline-flex items-center justify-center", className)}
      style={{ padding: config.padding }}
      {...props}
    >
      {children}
    </GradientBorder>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT DIVIDER
// A horizontal line with gradient
// ═══════════════════════════════════════════════════════════════════════════════

export function GradientDivider({
  variant = "aurora",
  height = "2px",
  className = "",
  ...props
}) {
  const gradient = GRADIENTS[variant] || GRADIENTS.aurora;

  return (
    <div
      className={cn("w-full", className)}
      style={{
        height,
        background: gradient,
        borderRadius: height,
      }}
      {...props}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT ACCENT BAR
// Vertical accent bar for cards (left side indicator)
// ═══════════════════════════════════════════════════════════════════════════════

export function GradientAccentBar({
  variant = "brand",
  width = "4px",
  className = "",
  ...props
}) {
  const gradient = GRADIENTS[variant] || GRADIENTS.brand;

  return (
    <div
      className={cn("h-full rounded-full", className)}
      style={{
        width,
        background: gradient,
      }}
      {...props}
    />
  );
}
