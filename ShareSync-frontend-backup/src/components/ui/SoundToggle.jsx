// src/components/ui/SoundToggle.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE F: The Sound of Progress - Sound Toggle
// ═══════════════════════════════════════════════════════════════════════════════
//
// Quick mute/unmute button for navbar or anywhere in the UI.
// Shows visual feedback for sound state.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useSoundMute, useSoundVolume } from '../../contexts/SoundContext';
import { useSounds } from '../../hooks/useSounds';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function SoundToggle({
  // Styling
  variant = 'default', // 'default' | 'compact' | 'pill' | 'icon-only'
  size = 'md', // 'sm' | 'md' | 'lg'
  showLabel = false,
  
  // Styling customization
  className = '',
  activeColor = 'brand', // 'brand' | 'white' | 'cyan'
  
  // Tooltip
  tooltip = true,
}) {
  const { isMuted, toggleMute } = useSoundMute();
  const { volumes } = useSoundVolume();
  const { playClick } = useSounds();
  
  // Size configurations
  const sizes = {
    sm: {
      button: 'p-1.5',
      icon: 14,
      text: 'text-xs',
      pill: 'px-2 py-1 gap-1',
    },
    md: {
      button: 'p-2',
      icon: 18,
      text: 'text-sm',
      pill: 'px-3 py-1.5 gap-1.5',
    },
    lg: {
      button: 'p-2.5',
      icon: 22,
      text: 'text-base',
      pill: 'px-4 py-2 gap-2',
    },
  };
  
  // Color configurations
  const colors = {
    brand: {
      active: 'text-brand-400 bg-brand-500/10 hover:bg-brand-500/20',
      muted: 'text-text-tertiary bg-white/5 hover:bg-white/10',
    },
    white: {
      active: 'text-white bg-white/10 hover:bg-white/20',
      muted: 'text-text-tertiary bg-white/5 hover:bg-white/10',
    },
    cyan: {
      active: 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20',
      muted: 'text-text-tertiary bg-white/5 hover:bg-white/10',
    },
  };
  
  const sizeConfig = sizes[size];
  const colorConfig = colors[activeColor];
  
  // Get appropriate icon based on state and volume
  const getIcon = () => {
    if (isMuted) return VolumeX;
    if (volumes.master < 0.33) return Volume1;
    return Volume2;
  };
  
  const Icon = getIcon();
  
  // Handle click
  const handleClick = useCallback(() => {
    // Don't play sound when muting (that would be weird)
    if (isMuted) {
      playClick();
    }
    toggleMute();
  }, [isMuted, toggleMute, playClick]);
  
  // Get tooltip text
  const tooltipText = isMuted ? 'Unmute sounds' : 'Mute sounds';
  
  // Icon-only variant
  if (variant === 'icon-only') {
    return (
      <button
        onClick={handleClick}
        className={`
          ${sizeConfig.button} rounded-lg transition-all
          ${isMuted ? colorConfig.muted : colorConfig.active}
          ${className}
        `}
        title={tooltip ? tooltipText : undefined}
        aria-label={tooltipText}
      >
        <motion.div
          initial={false}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Icon size={sizeConfig.icon} />
        </motion.div>
      </button>
    );
  }
  
  // Compact variant (icon with subtle background)
  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`
          ${sizeConfig.button} rounded-full transition-all
          ${isMuted ? colorConfig.muted : colorConfig.active}
          ${className}
        `}
        title={tooltip ? tooltipText : undefined}
        aria-label={tooltipText}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isMuted ? 'muted' : 'unmuted'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Icon size={sizeConfig.icon} />
          </motion.div>
        </AnimatePresence>
      </button>
    );
  }
  
  // Pill variant (icon + label)
  if (variant === 'pill') {
    return (
      <button
        onClick={handleClick}
        className={`
          flex items-center ${sizeConfig.pill} rounded-full transition-all
          ${isMuted ? colorConfig.muted : colorConfig.active}
          border border-white/[0.06]
          ${className}
        `}
        title={tooltip ? tooltipText : undefined}
        aria-label={tooltipText}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isMuted ? 'muted' : 'unmuted'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5"
          >
            <Icon size={sizeConfig.icon} />
            <span className={`${sizeConfig.text} font-medium`}>
              {isMuted ? 'Muted' : 'Sound'}
            </span>
          </motion.div>
        </AnimatePresence>
      </button>
    );
  }
  
  // Default variant
  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center gap-2 ${sizeConfig.button} rounded-lg transition-all
        ${isMuted ? colorConfig.muted : colorConfig.active}
        border border-white/[0.06]
        ${className}
      `}
      title={tooltip ? tooltipText : undefined}
      aria-label={tooltipText}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isMuted ? 'muted' : 'unmuted'}
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
          transition={{ duration: 0.2 }}
        >
          <Icon size={sizeConfig.icon} />
        </motion.div>
      </AnimatePresence>
      
      {showLabel && (
        <span className={`${sizeConfig.text} font-medium`}>
          {isMuted ? 'Muted' : 'Sound On'}
        </span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED SOUND WAVE INDICATOR
// Shows when sounds are playing
// ═══════════════════════════════════════════════════════════════════════════════
export function SoundWaveIndicator({ 
  isActive = false, 
  size = 'md',
  className = '',
}) {
  const sizes = {
    sm: { bars: 'w-0.5 gap-0.5', heights: [8, 12, 10] },
    md: { bars: 'w-1 gap-1', heights: [12, 18, 14] },
    lg: { bars: 'w-1.5 gap-1', heights: [16, 24, 20] },
  };
  
  const config = sizes[size];
  
  return (
    <div className={`flex items-center ${config.bars} ${className}`}>
      {config.heights.map((height, i) => (
        <motion.div
          key={i}
          className="bg-brand-400 rounded-full"
          style={{ width: parseInt(config.bars) }}
          animate={isActive ? {
            height: [height * 0.3, height, height * 0.5, height * 0.8, height * 0.3],
          } : {
            height: height * 0.3,
          }}
          transition={isActive ? {
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          } : {
            duration: 0.2,
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND STATUS BADGE
// Shows current sound state as a badge
// ═══════════════════════════════════════════════════════════════════════════════
export function SoundStatusBadge({ className = '' }) {
  const { isMuted } = useSoundMute();
  const { volumes } = useSoundVolume();
  
  if (isMuted) {
    return (
      <span className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full
        text-xs font-medium bg-red-500/10 text-red-400
        ${className}
      `}>
        <VolumeX size={12} />
        Muted
      </span>
    );
  }
  
  const percentage = Math.round(volumes.master * 100);
  
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded-full
      text-xs font-medium bg-brand-500/10 text-brand-400
      ${className}
    `}>
      <Volume2 size={12} />
      {percentage}%
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVBAR SOUND TOGGLE (pre-configured for navbar use)
// ═══════════════════════════════════════════════════════════════════════════════
export function NavbarSoundToggle({ className = '' }) {
  return (
    <SoundToggle
      variant="compact"
      size="md"
      tooltip={true}
      className={className}
    />
  );
}
