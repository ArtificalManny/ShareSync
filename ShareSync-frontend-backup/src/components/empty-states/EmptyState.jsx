// src/components/empty-states/EmptyState.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE D: Empty States That Inspire - Base Component
// ═══════════════════════════════════════════════════════════════════════════════
//
// Transforms "you have nothing" into "you're about to start something amazing"
//
// VARIANTS:
// - minimal: Icon + text, no illustration (for inline/small spaces)
// - illustrated: Full illustration + copy + CTA (default)
// - animated: Illustrated with floating elements + particles
// - celebratory: For victories (inbox zero, all shipped) with confetti
//
// All variants respond to momentum level for enhanced effects at high momentum.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowRight, Sparkles, Command } from 'lucide-react';
import { useMomentumContext } from '../../contexts/MomentumContext';

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING PARTICLES (for animated variant)
// ═══════════════════════════════════════════════════════════════════════════════
const FloatingParticles = ({ count = 6, color = 'brand' }) => {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 4,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
    })),
    [count]
  );

  const colorMap = {
    brand: 'bg-brand-500/30',
    cyan: 'bg-cyan-500/30',
    energy: 'bg-energy-500/30',
    success: 'bg-success-500/30',
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${colorMap[color] || colorMap.brand}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFETTI (for celebratory variant)
// ═══════════════════════════════════════════════════════════════════════════════
const Confetti = ({ count = 20 }) => {
  const confettiPieces = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ['bg-brand-400', 'bg-cyan-400', 'bg-energy-400', 'bg-success-400', 'bg-warning-400'][i % 5],
      delay: Math.random() * 0.5,
      rotation: Math.random() * 360,
    })),
    [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className={`absolute w-2 h-2 ${piece.color}`}
          style={{
            left: `${piece.x}%`,
            top: '-10%',
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
          initial={{ y: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: '120vh',
            rotate: piece.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: piece.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUT BADGE
// ═══════════════════════════════════════════════════════════════════════════════
const KeyboardShortcut = ({ shortcut }) => {
  if (!shortcut) return null;
  
  return (
    <div className="flex items-center gap-1 text-xs text-text-tertiary mt-2">
      <span>or press</span>
      <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-white/[0.08] font-mono text-text-secondary">
        {shortcut}
      </kbd>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EMPTY STATE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function EmptyState({
  // Content
  icon: Icon,
  illustration: Illustration,
  title,
  description,
  
  // Actions
  primaryAction,
  primaryActionLabel = 'Get Started',
  primaryActionIcon: PrimaryIcon = Plus,
  secondaryAction,
  secondaryActionLabel,
  keyboardShortcut,
  
  // Styling
  variant = 'illustrated', // 'minimal' | 'illustrated' | 'animated' | 'celebratory'
  size = 'default', // 'compact' | 'default' | 'large'
  align = 'center', // 'left' | 'center'
  accentColor = 'brand', // 'brand' | 'cyan' | 'energy' | 'success'
  
  // Extras
  showConfetti = false,
  className = '',
  children,
}) {
  const { glowLevel, isFireMode } = useMomentumContext();
  
  // Size configurations
  const sizeConfig = {
    compact: {
      container: 'py-8 px-4',
      icon: 'w-10 h-10',
      iconInner: 'w-5 h-5',
      title: 'text-base',
      description: 'text-sm',
      illustration: 'w-24 h-24',
    },
    default: {
      container: 'py-12 px-6',
      icon: 'w-14 h-14',
      iconInner: 'w-6 h-6',
      title: 'text-lg',
      description: 'text-sm',
      illustration: 'w-40 h-40',
    },
    large: {
      container: 'py-16 px-8',
      icon: 'w-20 h-20',
      iconInner: 'w-8 h-8',
      title: 'text-xl',
      description: 'text-base',
      illustration: 'w-56 h-56',
    },
  };
  
  const config = sizeConfig[size] || sizeConfig.default;
  
  // Accent color mapping
  const accentMap = {
    brand: {
      iconBg: 'bg-brand-500/10',
      iconColor: 'text-brand-400',
      buttonBg: 'bg-brand-600 hover:bg-brand-500',
      glow: 'shadow-glow-brand',
      ring: 'ring-brand-500/20',
    },
    cyan: {
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
      buttonBg: 'bg-cyan-600 hover:bg-cyan-500',
      glow: 'shadow-glow-cyan',
      ring: 'ring-cyan-500/20',
    },
    energy: {
      iconBg: 'bg-energy-500/10',
      iconColor: 'text-energy-400',
      buttonBg: 'bg-energy-600 hover:bg-energy-500',
      glow: 'shadow-glow-energy',
      ring: 'ring-energy-500/20',
    },
    success: {
      iconBg: 'bg-success-500/10',
      iconColor: 'text-success-400',
      buttonBg: 'bg-success-600 hover:bg-success-500',
      glow: 'shadow-glow-success',
      ring: 'ring-success-500/20',
    },
  };
  
  const accent = accentMap[isFireMode ? 'energy' : accentColor] || accentMap.brand;
  
  // Animation variants for entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
    },
  };
  
  // Enhanced effects at high momentum
  const hasEnhancedEffects = glowLevel >= 3 || variant === 'animated';
  const showParticles = variant === 'animated' || (variant === 'illustrated' && glowLevel >= 4);
  
  return (
    <motion.div
      className={`
        relative
        ${config.container}
        ${align === 'center' ? 'text-center' : 'text-left'}
        ${className}
      `}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      data-momentum={glowLevel}
    >
      {/* Particles for animated/high-momentum */}
      {showParticles && <FloatingParticles count={8} color={accentColor} />}
      
      {/* Confetti for celebratory */}
      {(variant === 'celebratory' || showConfetti) && <Confetti count={25} />}
      
      {/* Illustration or Icon */}
      <motion.div 
        className={`${align === 'center' ? 'mx-auto' : ''} mb-6`}
        variants={itemVariants}
      >
        {Illustration ? (
          <div 
            className={`
              ${config.illustration} 
              ${align === 'center' ? 'mx-auto' : ''}
              ${hasEnhancedEffects ? 'animate-float' : ''}
            `}
          >
            <Illustration 
              glowLevel={glowLevel} 
              accentColor={accentColor}
              isFireMode={isFireMode}
            />
          </div>
        ) : Icon ? (
          <div 
            className={`
              ${config.icon} rounded-2xl
              ${accent.iconBg}
              ${align === 'center' ? 'mx-auto' : ''}
              flex items-center justify-center
              ${hasEnhancedEffects ? `ring-2 ${accent.ring}` : ''}
              transition-all duration-500
            `}
          >
            <Icon className={`${config.iconInner} ${accent.iconColor}`} />
          </div>
        ) : null}
      </motion.div>
      
      {/* Title */}
      <motion.h3 
        className={`
          ${config.title} font-semibold text-text-primary mb-2
          ${hasEnhancedEffects && glowLevel >= 4 ? 'text-glow' : ''}
        `}
        variants={itemVariants}
      >
        {title}
      </motion.h3>
      
      {/* Description */}
      <motion.p 
        className={`
          ${config.description} text-text-secondary 
          max-w-md ${align === 'center' ? 'mx-auto' : ''}
          mb-6
        `}
        variants={itemVariants}
      >
        {description}
      </motion.p>
      
      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <motion.div 
          className={`
            flex flex-wrap gap-3
            ${align === 'center' ? 'justify-center' : 'justify-start'}
          `}
          variants={itemVariants}
        >
          {primaryAction && (
            <button
              onClick={primaryAction}
              className={`
                inline-flex items-center gap-2
                px-4 py-2.5 rounded-xl
                ${accent.buttonBg}
                text-white text-sm font-medium
                transition-all duration-200
                hover:scale-[1.02]
                ${glowLevel >= 4 ? accent.glow : ''}
              `}
            >
              <PrimaryIcon className="w-4 h-4" />
              {primaryActionLabel}
            </button>
          )}
          
          {secondaryAction && secondaryActionLabel && (
            <button
              onClick={secondaryAction}
              className="
                inline-flex items-center gap-2
                px-4 py-2.5 rounded-xl
                bg-surface-2 hover:bg-surface-3
                text-text-secondary hover:text-text-primary
                text-sm font-medium
                border border-white/[0.06]
                transition-all duration-200
              "
            >
              {secondaryActionLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
      
      {/* Keyboard shortcut hint */}
      {keyboardShortcut && (
        <motion.div 
          className={align === 'center' ? 'flex justify-center' : ''}
          variants={itemVariants}
        >
          <KeyboardShortcut shortcut={keyboardShortcut} />
        </motion.div>
      )}
      
      {/* Custom children */}
      {children && (
        <motion.div className="mt-6" variants={itemVariants}>
          {children}
        </motion.div>
      )}
      
      {/* Inline styles for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .shadow-glow-brand {
          box-shadow: 0 0 20px rgb(var(--brand-500-rgb) / 0.3);
        }
        
        .shadow-glow-cyan {
          box-shadow: 0 0 20px rgb(var(--cyan-500-rgb) / 0.3);
        }
        
        .shadow-glow-energy {
          box-shadow: 0 0 20px rgb(var(--energy-500-rgb) / 0.3);
        }
        
        .shadow-glow-success {
          box-shadow: 0 0 20px rgb(var(--success-500-rgb) / 0.3);
        }
        
        .text-glow {
          text-shadow: 0 0 20px rgb(var(--brand-500-rgb) / 0.3);
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-float {
            animation: none;
          }
        }
      `}</style>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINIMAL VARIANT SHORTCUT
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptyStateMinimal({
  icon: Icon,
  title,
  description,
  action,
  actionLabel = 'Add',
  className = '',
}) {
  return (
    <div className={`
      flex items-center gap-4 p-4 rounded-xl
      bg-surface-1 border border-white/[0.06] border-dashed
      hover:border-brand-500/30 hover:bg-surface-2
      transition-all duration-200 cursor-pointer
      ${className}
    `}
    onClick={action}
    >
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description && (
          <p className="text-xs text-text-tertiary truncate">{description}</p>
        )}
      </div>
      <Plus className="w-5 h-5 text-text-tertiary" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE VARIANT (for lists)
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptyStateInline({
  icon: Icon,
  message,
  action,
  actionLabel,
  className = '',
}) {
  return (
    <div className={`
      flex items-center justify-center gap-3 py-8
      text-text-tertiary
      ${className}
    `}>
      {Icon && <Icon className="w-4 h-4" />}
      <span className="text-sm">{message}</span>
      {action && actionLabel && (
        <button
          onClick={action}
          className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
