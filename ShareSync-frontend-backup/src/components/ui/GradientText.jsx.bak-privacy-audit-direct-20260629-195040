// src/components/ui/GradientText.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC GRADIENT TEXT v4.0 - "The Gallery Walk" Signature Gradients
// ═══════════════════════════════════════════════════════════════════════════════
//
// SIGNATURE GRADIENTS:
// - aurora: Violet → Indigo → Blue → Cyan → Teal (full spectrum)
// - sunset: Violet → Purple → Pink (warm & vibrant)
// - ocean: Blue → Cyan → Teal (cool & professional)
// - brand: Violet → Deep Violet (simple brand)
// - energy: Orange → Rose (fire mode)
//
// NO BACKEND CHANGES - Pure visual component
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Signature gradient definitions
const GRADIENTS = {
  // Primary signature gradients
  aurora: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF 100%)",
  sunset: "linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #EC4899 100%)",
  ocean: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)",
  brand: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
  energy: "linear-gradient(135deg, #FB923C 0%, #F43F5E 100%)",
  
  // Semantic gradients
  success: "linear-gradient(135deg, #2DD4BF 0%, #14B8A6 100%)",
  warning: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
  danger: "linear-gradient(135deg, #F87171 0%, #EF4444 100%)",
  info: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)",
  live: "linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)",
  
  // Legacy aliases (backward compatibility)
  indigo: "linear-gradient(135deg, #818CF8 0%, #6366F1 100%)",
  blue: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)",
  purple: "linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)",
  emerald: "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
  pink: "linear-gradient(135deg, #F472B6 0%, #EC4899 100%)",
  pandora: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF 100%)",
  cnbc: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)",
  ig: "linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #EC4899 100%)",
  
  // XP/Gamification
  gold: "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)",
  legendary: "linear-gradient(135deg, #FFD700 0%, #EF4444 50%, #8B5CF6 100%)",
  fire: "linear-gradient(135deg, #FF6B6B 0%, #EF4444 50%, #DC2626 100%)",
};

/**
 * GradientText
 * Renders text with a gradient fill using background-clip technique.
 *
 * @param {string} as - HTML tag to render (default: "span")
 * @param {string} variant - Gradient variant name
 * @param {string} fallbackColor - Fallback color for unsupported browsers
 * @param {boolean} animate - Enable subtle animation (optional)
 * @param {string} className - Additional CSS classes
 */
export default function GradientText({
  as: Tag = "span",
  variant = "brand",
  fallbackColor = "currentColor",
  animate = false,
  className = "",
  style,
  children,
  ...rest
}) {
  const normalizedVariant = String(variant || "brand").toLowerCase();
  const gradient = GRADIENTS[normalizedVariant] || GRADIENTS.brand;

  return (
    <Tag
      className={cn(
        "inline-block",
        animate && "animate-gradient-shift",
        className
      )}
      style={{
        backgroundImage: gradient,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: fallbackColor,
        ...(animate && {
          backgroundSize: "200% 200%",
          animation: "gradient-shift 3s ease infinite",
        }),
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESET GRADIENT TEXT COMPONENTS
// Convenient shortcuts for common use cases
// ═══════════════════════════════════════════════════════════════════════════════

export function AuroraText({ children, className = "", ...props }) {
  return (
    <GradientText variant="aurora" className={cn("font-semibold", className)} {...props}>
      {children}
    </GradientText>
  );
}

export function SunsetText({ children, className = "", ...props }) {
  return (
    <GradientText variant="sunset" className={cn("font-semibold", className)} {...props}>
      {children}
    </GradientText>
  );
}

export function OceanText({ children, className = "", ...props }) {
  return (
    <GradientText variant="ocean" className={cn("font-semibold", className)} {...props}>
      {children}
    </GradientText>
  );
}

export function BrandText({ children, className = "", ...props }) {
  return (
    <GradientText variant="brand" className={cn("font-semibold", className)} {...props}>
      {children}
    </GradientText>
  );
}

export function EnergyText({ children, className = "", ...props }) {
  return (
    <GradientText variant="energy" className={cn("font-semibold", className)} {...props}>
      {children}
    </GradientText>
  );
}

export function LegendaryText({ children, className = "", animate = true, ...props }) {
  return (
    <GradientText 
      variant="legendary" 
      animate={animate}
      className={cn("font-bold", className)} 
      {...props}
    >
      {children}
    </GradientText>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT HEADING
// For section titles and hero text
// ═══════════════════════════════════════════════════════════════════════════════

export function GradientHeading({
  as = "h2",
  variant = "aurora",
  size = "2xl",
  children,
  className = "",
  ...props
}) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
    "2xl": "text-4xl",
    "3xl": "text-5xl",
  };

  return (
    <GradientText
      as={as}
      variant={variant}
      className={cn(
        "font-bold tracking-tight",
        sizeClasses[size] || sizeClasses["2xl"],
        className
      )}
      {...props}
    >
      {children}
    </GradientText>
  );
}
