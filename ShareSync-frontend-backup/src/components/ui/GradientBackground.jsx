// src/components/ui/GradientBackground.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC GRADIENT BACKGROUND v4.0 - "The Gallery Walk" Soft Glow Backgrounds
// ═══════════════════════════════════════════════════════════════════════════════
//
// Creates section backgrounds with soft gradients and atmospheric glows.
// Designed for the light theme "Gallery Walk" aesthetic.
//
// VARIANTS:
// - softGlow: Paper white → Violet hint → Soft slate (default page background)
// - softViolet: White → Violet-50 fade
// - softBlue: White → Blue-50 fade
// - softTeal: White → Teal-50 fade
// - aurora: Subtle aurora glow (for special sections)
//
// NO BACKEND CHANGES - Pure visual component
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Background gradient definitions
const BACKGROUNDS = {
  // The signature "Gallery Walk" soft glow
  softGlow: {
    gradient: "linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 Available)",
    glows: [
      { color: "rgba(139, 92, 246, 0.06)", position: "top-left", size: "50vw" },
      { color: "rgba(45, 212, 191, 0.04)", position: "bottom-right", size: "45vw" },
    ],
  },
  
  // Soft tinted backgrounds
  softViolet: {
    gradient: "linear-gradient(180deg, #FFFFFF 0%, #F5F3FF Available)",
    glows: [
      { color: "rgba(139, 92, 246, 0.08)", position: "top-right", size: "40vw" },
    ],
  },
  softBlue: {
    gradient: "linear-gradient(180deg, #FFFFFF 0%, #EFF6FF Available)",
    glows: [
      { color: "rgba(59, 130, 246, 0.08)", position: "top-left", size: "40vw" },
    ],
  },
  softTeal: {
    gradient: "linear-gradient(180deg, #FFFFFF 0%, #F0FDFA Available)",
    glows: [
      { color: "rgba(45, 212, 191, 0.08)", position: "bottom-right", size: "40vw" },
    ],
  },
  
  // Special aurora effect
  aurora: {
    gradient: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 Available)",
    glows: [
      { color: "rgba(139, 92, 246, 0.08)", position: "top-left", size: "50vw" },
      { color: "rgba(99, 102, 241, 0.06)", position: "top-center", size: "45vw" },
      { color: "rgba(6, 182, 212, 0.05)", position: "bottom-right", size: "40vw" },
      { color: "rgba(45, 212, 191, 0.04)", position: "bottom-left", size: "35vw" },
    ],
  },

  // Plain backgrounds
  white: {
    gradient: "#FFFFFF",
    glows: [],
  },
  slate: {
    gradient: "#F8FAFC",
    glows: [],
  },
};

// Glow position mapping
const GLOW_POSITIONS = {
  "top-left": { top: "-20%", left: "-15%" },
  "top-right": { top: "-20%", right: "-15%" },
  "top-center": { top: "-20%", left: "25%" },
  "bottom-left": { bottom: "-20%", left: "-15%" },
  "bottom-right": { bottom: "-20%", right: "-15%" },
  "center": { top: "30%", left: "30%" },
};

/**
 * GradientBackground
 * Section wrapper with soft gradient background and optional atmospheric glows.
 *
 * @param {string} as - HTML tag to render (default: "div")
 * @param {string} variant - Background variant
 * @param {boolean} showGlows - Enable/disable atmospheric glow orbs
 * @param {boolean} fixed - Use fixed positioning for glows (for page backgrounds)
 */
export default function GradientBackground({
  as: Tag = "div",
  variant = "softGlow",
  showGlows = true,
  fixed = false,
  className = "",
  style,
  children,
  ...rest
}) {
  const config = BACKGROUNDS[variant] || BACKGROUNDS.softGlow;

  return (
    <Tag
      className={cn("relative", className)}
      style={{
        background: config.gradient,
        ...style,
      }}
      {...rest}
    >
      {/* Atmospheric glow orbs */}
      {showGlows && config.glows.length > 0 && (
        <div 
          className={cn(
            "pointer-events-none overflow-hidden z-0",
            fixed ? "fixed inset-0" : "absolute inset-0"
          )}
        >
          {config.glows.map((glow, index) => {
            const position = GLOW_POSITIONS[glow.position] || GLOW_POSITIONS["top-left"];
            return (
              <div
                key={index}
                className="absolute rounded-full"
                style={{
                  ...position,
                  width: glow.size,
                  height: glow.size,
                  background: `radial-gradient(circle, ${glow.color} 0%, transparent 70%)`,
                  filter: "blur(40px)",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </Tag>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE BACKGROUND
// Full-page background with fixed glows
// ═══════════════════════════════════════════════════════════════════════════════

export function PageBackground({
  variant = "softGlow",
  children,
  className = "",
  ...props
}) {
  return (
    <GradientBackground
      variant={variant}
      showGlows={true}
      fixed={true}
      className={cn("min-h-screen", className)}
      {...props}
    >
      {children}
    </GradientBackground>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION BACKGROUND
// For individual page sections
// ═══════════════════════════════════════════════════════════════════════════════

export function SectionBackground({
  variant = "softViolet",
  rounded = true,
  padding = "p-8",
  children,
  className = "",
  ...props
}) {
  return (
    <GradientBackground
      variant={variant}
      showGlows={true}
      fixed={false}
      className={cn(
        rounded && "rounded-2xl",
        padding,
        className
      )}
      {...props}
    >
      {children}
    </GradientBackground>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO BACKGROUND
// For hero sections with aurora gradient
// ═══════════════════════════════════════════════════════════════════════════════

export function HeroBackground({
  children,
  className = "",
  ...props
}) {
  return (
    <GradientBackground
      variant="aurora"
      showGlows={true}
      fixed={false}
      className={cn("py-16 lg:py-24", className)}
      {...props}
    >
      {children}
    </GradientBackground>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARD GRADIENT BACKGROUND
// Soft gradient for card interiors
// ═══════════════════════════════════════════════════════════════════════════════

export function CardGradient({
  variant = "softViolet",
  children,
  className = "",
  ...props
}) {
  const config = BACKGROUNDS[variant] || BACKGROUNDS.softViolet;

  return (
    <div
      className={cn("rounded-xl", className)}
      style={{ background: config.gradient }}
      {...props}
    >
      {children}
    </div>
  );
}
