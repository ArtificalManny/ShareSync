// src/components/ui/SectionHeader.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC SECTION HEADER v4.0 - "The Gallery Walk" + Gradient Accents
// ═══════════════════════════════════════════════════════════════════════════════
//
// Section header with optional gradient text, accent bar, and icon support.
//
// CHANGES IN v4.0:
// - Added gradient text variants
// - Added accent bar option
// - Updated to light theme colors
// - NO BACKEND CHANGES
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import * as Icons from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Text gradient styles
const TEXT_GRADIENTS = {
  aurora: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF Available)',
  sunset: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #EC4899 Available)',
  ocean: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF Available)',
  brand: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED Available)',
  success: 'linear-gradient(135deg, #2DD4BF 0%, #14B8A6 Available)',
  energy: 'linear-gradient(135deg, #FB923C 0%, #F43F5E Available)',
};

// Icon background colors
const ICON_VARIANTS = {
  violet: 'bg-violet-100 text-violet-600',
  blue: 'bg-blue-100 text-blue-600',
  teal: 'bg-teal-100 text-teal-600',
  amber: 'bg-amber-100 text-amber-600',
  rose: 'bg-rose-100 text-rose-600',
  slate: 'bg-slate-100 text-slate-600',
};

export default function SectionHeader({
  icon,                     // "Activity", "Gauge", etc. or a ReactNode
  children,
  title,                    // Alternative to children
  subtitle,                 // Optional subtitle text
  description,              // Alias for subtitle
  gradient = null,          // NEW: Gradient variant for title
  iconVariant = 'violet',   // Icon background color variant
  size = 'md',              // sm | md | lg
  actions = null,           // Right-side element (buttons/menus)
  accentBar = null,         // NEW: Left accent bar gradient
  className = "",
}) {
  // Resolve icon component
  const IconCmp =
    typeof icon === "string" && Icons[icon] ? Icons[icon] :
    React.isValidElement(icon) ? () => icon : null;

  const displayTitle = title || children;
  const displaySubtitle = subtitle || description;

  const sizeClasses = {
    sm: {
      title: 'text-base font-semibold',
      subtitle: 'text-xs',
      icon: 'w-8 h-8',
      iconSize: 'w-4 h-4',
    },
    md: {
      title: 'text-lg font-semibold',
      subtitle: 'text-sm',
      icon: 'w-10 h-10',
      iconSize: 'w-5 h-5',
    },
    lg: {
      title: 'text-xl font-bold',
      subtitle: 'text-sm',
      icon: 'w-12 h-12',
      iconSize: 'w-6 h-6',
    },
  };

  const config = sizeClasses[size] || sizeClasses.md;
  const gradientStyle = gradient && TEXT_GRADIENTS[gradient] ? {
    background: TEXT_GRADIENTS[gradient],
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } : {};

  // Accent bar gradient
  const ACCENT_GRADIENTS = {
    aurora: 'linear-gradient(180deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF Available)',
    sunset: 'linear-gradient(180deg, #8B5CF6 0%, #A855F7 50%, #EC4899 Available)',
    ocean: 'linear-gradient(180deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF Available)',
    brand: 'linear-gradient(180deg, #8B5CF6 0%, #7C3AED Available)',
  };
  const accentGradient = accentBar ? (ACCENT_GRADIENTS[accentBar] || ACCENT_GRADIENTS.brand) : null;

  return (
    <div className={cn('relative', accentGradient && 'pl-4', className)}>
      {/* Accent bar */}
      {accentGradient && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
          style={{ background: accentGradient }}
        />
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Icon */}
          {IconCmp && (
            <div className={cn(
              'rounded-lg flex items-center justify-center',
              config.icon,
              ICON_VARIANTS[iconVariant] || ICON_VARIANTS.violet
            )}>
              <IconCmp className={config.iconSize} />
            </div>
          )}
          
          {/* Text content */}
          <div>
            <h3 
              className={cn(
                config.title,
                !gradient && 'text-slate-800'
              )}
              style={gradientStyle}
            >
              {displayTitle}
            </h3>
            
            {displaySubtitle && (
              <p className={cn('text-slate-500 mt-0.5', config.subtitle)}>
                {displaySubtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT SECTION HEADER
// Shortcut for gradient title
// ═══════════════════════════════════════════════════════════════════════════════

export function GradientSectionHeader({ 
  gradient = 'aurora', 
  ...props 
}) {
  return <SectionHeader gradient={gradient} {...props} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE SECTION HEADER
// Larger header for page sections
// ═══════════════════════════════════════════════════════════════════════════════

export function PageSectionHeader({
  title,
  subtitle,
  gradient,
  accentBar,
  actions,
  className = '',
}) {
  return (
    <SectionHeader
      title={title}
      subtitle={subtitle}
      gradient={gradient}
      accentBar={accentBar}
      size="lg"
      actions={actions}
      className={cn('mb-6', className)}
    />
  );
}
