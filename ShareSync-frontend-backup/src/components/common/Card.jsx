// src/components/common/Card.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC CARD v4.1 - Depth Audit
// OPTICAL TWEAKS: Replaced flat shadow-sm with multi-layered realistic shadows.
// Softened borders and added a subtle white ring to simulate material thickness.
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";

const cn = (...classes) => classes.filter(Boolean).join(' ');

const GRADIENT_BACKGROUNDS = {
  none: '',
  softGlow: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 100%)',
  softViolet: 'linear-gradient(180deg, #FFFFFF 0%, #F5F3FF 100%)',
  softBlue: 'linear-gradient(180deg, #FFFFFF 0%, #EFF6FF 100%)',
  softTeal: 'linear-gradient(180deg, #FFFFFF 0%, #F0FDFA 100%)',
  softAmber: 'linear-gradient(180deg, #FFFFFF 0%, #FFFBEB 100%)',
  softRose: 'linear-gradient(180deg, #FFFFFF 0%, #FFF1F2 100%)',
};

const ACCENT_GRADIENTS = {
  aurora: 'linear-gradient(180deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF 100%)',
  sunset: 'linear-gradient(180deg, #8B5CF6 0%, #A855F7 50%, #EC4899 100%)',
  ocean: 'linear-gradient(180deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)',
  brand: 'linear-gradient(180deg, #8B5CF6 0%, #7C3AED 100%)',
  success: 'linear-gradient(180deg, #2DD4BF 0%, #14B8A6 100%)',
  warning: 'linear-gradient(180deg, #FBBF24 0%, #F59E0B 100%)',
  energy: 'linear-gradient(180deg, #FB923C 0%, #F43F5E 100%)',
  danger: 'linear-gradient(180deg, #F87171 0%, #EF4444 100%)',
};

export default function Card({
  children,
  className = '',
  gradient = 'none',
  accentBar = null,
  hover = true,
  padding = true,
  rounded = 'xl',
  shadow = true,
  border = true,
  onClick,
  ...rest
}) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-3xl',
  };

  const gradientBackground = GRADIENT_BACKGROUNDS[gradient] || '';
  const accentGradient = accentBar ? (ACCENT_GRADIENTS[accentBar] || ACCENT_GRADIENTS.brand) : null;

  return (
    <div
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        !gradientBackground && 'bg-white',
        border && 'border border-slate-200/60 ring-1 ring-white/50',
        shadow && 'shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]',
        roundedClasses[rounded] || roundedClasses.xl,
        hover && 'hover:shadow-[0_8px_24px_rgba(139,92,246,0.08),0_2px_8px_rgba(139,92,246,0.04)] hover:border-violet-200/80',
        onClick && 'cursor-pointer',
        className
      )}
      style={gradientBackground ? { background: gradientBackground } : {}}
      onClick={onClick}
      {...rest}
    >
      {accentGradient && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ background: accentGradient }}
        />
      )}
      
      <div className={cn(
        padding && 'p-6',
        accentGradient && 'pl-5'
      )}>
        {children}
      </div>
    </div>
  );
}

export function CardHeader({ children, className = '', ...rest }) {
  return (
    <div className={cn('mb-4', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '', ...rest }) {
  return (
    <div className={cn('', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...rest }) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-slate-100', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ 
  children, 
  as: Tag = 'h3', 
  className = '',
  gradient = null,
  ...rest 
}) {
  const gradientStyle = gradient ? {
    background: ACCENT_GRADIENTS[gradient] || ACCENT_GRADIENTS.brand,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } : {};

  return (
    <Tag 
      className={cn('text-lg font-semibold text-slate-800', className)} 
      style={gradientStyle}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardMeta({ children, className = '', ...rest }) {
  return (
    <p className={cn('text-sm text-slate-500 mt-1', className)} {...rest}>
      {children}
    </p>
  );
}

export function CardMetric({ 
  value, 
  label, 
  trend, 
  trendDirection = 'up',
  className = '' 
}) {
  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-red-500',
    neutral: 'text-slate-500',
  };

  return (
    <div className={cn('', className)}>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      {label && <div className="text-sm text-slate-500">{label}</div>}
      {trend && (
        <div className={cn('text-sm font-medium', trendColors[trendDirection])}>
          {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : ''}
          {trend}
        </div>
      )}
    </div>
  );
}

export function CardBadge({ children, tone = 'violet', className = '', ...rest }) {
  const toneClasses = {
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border',
        toneClasses[tone] || toneClasses.violet,
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

export function CardIconBox({ 
  icon: Icon, 
  variant = 'brand',
  size = 'md',
  className = '' 
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const variantClasses = {
    brand: 'bg-violet-50 text-violet-600',
    blue: 'bg-blue-50 text-blue-600',
    teal: 'bg-teal-50 text-teal-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <div 
      className={cn(
        'rounded-lg flex items-center justify-center',
        sizeClasses[size] || sizeClasses.md,
        variantClasses[variant] || variantClasses.brand,
        className
      )}
    >
      {Icon && <Icon className={iconSizes[size] || iconSizes.md} />}
    </div>
  );
}

export function CardProgress({ 
  value, 
  max = 100, 
  variant = 'ocean',
  showLabel = false,
  className = '' 
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const gradients = {
    ocean: 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)',
    brand: 'linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%)',
    success: 'linear-gradient(90deg, #2DD4BF 0%, #14B8A6 100%)',
    energy: 'linear-gradient(90deg, #FB923C 0%, #F43F5E 100%)',
  };

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Progress</span>
          <span className="font-medium text-slate-700">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${percentage}%`,
            background: gradients[variant] || gradients.ocean,
          }}
        />
      </div>
    </div>
  );
}

export function GlowCard({ children, variant = 'softViolet', ...props }) {
  return (
    <Card gradient={variant} {...props}>
      {children}
    </Card>
  );
}

export function AccentCard({ children, accent = 'brand', ...props }) {
  return (
    <Card accentBar={accent} {...props}>
      {children}
    </Card>
  );
}

export function StatCard({
  label,
  value,
  trend,
  trendDirection = 'up',
  icon: Icon,
  accentBar,
  className = '',
  ...rest
}) {
  return (
    <Card accentBar={accentBar} className={className} {...rest}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-800 mt-1">{value}</p>
          {trend && (
            <p className={cn(
              'text-sm mt-1',
              trendDirection === 'up' ? 'text-emerald-600' : 
              trendDirection === 'down' ? 'text-red-500' : 'text-slate-500'
            )}>
              {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : ''}
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <CardIconBox icon={Icon} variant="brand" />
        )}
      </div>
    </Card>
  );
}
