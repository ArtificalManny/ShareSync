// src/components/common/HeroSection.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC HERO SECTION v4.0 - "The Gallery Walk" Aurora Gradient
// ═══════════════════════════════════════════════════════════════════════════════
//
// Hero section component with signature gradient backgrounds and text.
// Designed for landing pages, feature announcements, and special moments.
//
// VARIANTS:
// - aurora: Full spectrum gradient (default)
// - sunset: Warm violet → pink gradient
// - ocean: Cool blue → teal gradient
// - softGlow: Subtle light background
//
// NO BACKEND CHANGES - Pure visual component
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { motion } from "framer-motion";

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Background configurations
const HERO_BACKGROUNDS = {
  aurora: {
    gradient: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
    glows: [
      { color: 'rgba(139, 92, 246, 0.12)', position: 'top-left', size: '60vw' },
      { color: 'rgba(99, 102, 241, 0.08)', position: 'top-center', size: '50vw' },
      { color: 'rgba(59, 130, 246, 0.06)', position: 'center-right', size: '45vw' },
      { color: 'rgba(6, 182, 212, 0.06)', position: 'bottom-right', size: '40vw' },
      { color: 'rgba(45, 212, 191, 0.05)', position: 'bottom-left', size: '35vw' },
    ],
  },
  sunset: {
    gradient: 'linear-gradient(180deg, #F8FAFC 0%, #FDF4FF 100%)',
    glows: [
      { color: 'rgba(139, 92, 246, 0.12)', position: 'top-left', size: '50vw' },
      { color: 'rgba(168, 85, 247, 0.08)', position: 'top-right', size: '45vw' },
      { color: 'rgba(236, 72, 153, 0.06)', position: 'bottom-right', size: '40vw' },
    ],
  },
  ocean: {
    gradient: 'linear-gradient(180deg, #F8FAFC 0%, #F0FDFA 100%)',
    glows: [
      { color: 'rgba(59, 130, 246, 0.10)', position: 'top-left', size: '50vw' },
      { color: 'rgba(6, 182, 212, 0.08)', position: 'top-right', size: '45vw' },
      { color: 'rgba(45, 212, 191, 0.06)', position: 'bottom-center', size: '40vw' },
    ],
  },
  softGlow: {
    gradient: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 100%)',
    glows: [
      { color: 'rgba(139, 92, 246, 0.06)', position: 'top-left', size: '50vw' },
      { color: 'rgba(45, 212, 191, 0.04)', position: 'bottom-right', size: '45vw' },
    ],
  },
};

// Glow position mapping
const GLOW_POSITIONS = {
  'top-left': { top: '-20%', left: '-15%' },
  'top-right': { top: '-20%', right: '-15%' },
  'top-center': { top: '-20%', left: '25%' },
  'center-right': { top: '20%', right: '-15%' },
  'bottom-left': { bottom: '-20%', left: '-15%' },
  'bottom-right': { bottom: '-20%', right: '-15%' },
  'bottom-center': { bottom: '-20%', left: '30%' },
};

// Text gradient styles
const TEXT_GRADIENTS = {
  aurora: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF 100%)',
  sunset: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #EC4899 100%)',
  ocean: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)',
  brand: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
};

/**
 * HeroSection - Full-width hero with gradient background
 */
export default function HeroSection({
  title,
  subtitle,
  description,
  variant = 'aurora',
  gradientText = true,
  align = 'center',
  size = 'lg',
  actions,
  children,
  className = '',
  animate = true,
  ...rest
}) {
  const config = HERO_BACKGROUNDS[variant] || HERO_BACKGROUNDS.aurora;
  const textGradient = TEXT_GRADIENTS[variant] || TEXT_GRADIENTS.aurora;

  const alignClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  const sizeClasses = {
    sm: 'py-12 lg:py-16',
    md: 'py-16 lg:py-24',
    lg: 'py-20 lg:py-32',
    xl: 'py-24 lg:py-40',
  };

  const titleSizes = {
    sm: 'text-2xl lg:text-3xl',
    md: 'text-3xl lg:text-4xl',
    lg: 'text-4xl lg:text-5xl',
    xl: 'text-5xl lg:text-6xl',
  };

  const MotionWrapper = animate ? motion.div : 'div';
  const motionProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' },
  } : {};

  return (
    <section
      className={cn('relative overflow-hidden', sizeClasses[size], className)}
      style={{ background: config.gradient }}
      {...rest}
    >
      {/* Atmospheric glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {config.glows.map((glow, index) => {
          const position = GLOW_POSITIONS[glow.position] || GLOW_POSITIONS['top-left'];
          return (
            <div
              key={index}
              className="absolute rounded-full"
              style={{
                ...position,
                width: glow.size,
                height: glow.size,
                background: `radial-gradient(circle, ${glow.color} 0%, transparent 70%)`,
                filter: 'blur(40px)',
              }}
            />
          );
        })}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <MotionWrapper 
          className={cn('flex flex-col', alignClasses[align])}
          {...motionProps}
        >
          {/* Subtitle/eyebrow */}
          {subtitle && (
            <p className="text-sm font-medium text-violet-600 mb-3 tracking-wide uppercase">
              {subtitle}
            </p>
          )}

          {/* Title */}
          {title && (
            <h1
              className={cn(
                'font-bold tracking-tight leading-tight',
                titleSizes[size],
                !gradientText && 'text-slate-800'
              )}
              style={gradientText ? {
                background: textGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              } : {}}
            >
              {title}
            </h1>
          )}

          {/* Description */}
          {description && (
            <p className={cn(
              'mt-6 text-lg text-slate-600 max-w-2xl',
              align === 'center' && 'mx-auto'
            )}>
              {description}
            </p>
          )}

          {/* Actions */}
          {actions && (
            <div className={cn(
              'mt-8 flex flex-wrap gap-4',
              align === 'center' && 'justify-center'
            )}>
              {actions}
            </div>
          )}

          {/* Additional content */}
          {children && (
            <div className="mt-12">
              {children}
            </div>
          )}
        </MotionWrapper>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO VARIANTS
// Convenient preset components
// ═══════════════════════════════════════════════════════════════════════════════

export function AuroraHero(props) {
  return <HeroSection variant="aurora" {...props} />;
}

export function SunsetHero(props) {
  return <HeroSection variant="sunset" {...props} />;
}

export function OceanHero(props) {
  return <HeroSection variant="ocean" {...props} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT HERO
// Smaller hero for internal pages
// ═══════════════════════════════════════════════════════════════════════════════

export function CompactHero({
  title,
  description,
  variant = 'softGlow',
  actions,
  className = '',
  ...rest
}) {
  return (
    <HeroSection
      title={title}
      description={description}
      variant={variant}
      size="sm"
      gradientText={false}
      actions={actions}
      className={className}
      {...rest}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE HERO
// Hero with feature highlights
// ═══════════════════════════════════════════════════════════════════════════════

export function FeatureHero({
  title,
  subtitle,
  description,
  features = [],
  variant = 'aurora',
  actions,
  className = '',
  ...rest
}) {
  return (
    <HeroSection
      title={title}
      subtitle={subtitle}
      description={description}
      variant={variant}
      actions={actions}
      className={className}
      {...rest}
    >
      {features.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 text-left"
            >
              {feature.icon && (
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-violet-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-slate-800">{feature.title}</h3>
                {feature.description && (
                  <p className="text-sm text-slate-500 mt-1">{feature.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </HeroSection>
  );
}
