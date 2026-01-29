// src/components/ui/VolumeSlider.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE F: The Sound of Progress - Volume Slider
// ═══════════════════════════════════════════════════════════════════════════════
//
// Reusable volume control slider with visual feedback.
// Includes icon, percentage display, and smooth interactions.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// VOLUME ICON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const VolumeIcon = ({ volume, isMuted, size = 18, className = '' }) => {
  const iconProps = { size, className };
  
  if (isMuted || volume === 0) {
    return <VolumeX {...iconProps} />;
  }
  if (volume < 0.33) {
    return <Volume {...iconProps} />;
  }
  if (volume < 0.66) {
    return <Volume1 {...iconProps} />;
  }
  return <Volume2 {...iconProps} />;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function VolumeSlider({
  // Value
  value = 0.7,
  onChange,
  
  // Optional mute
  isMuted = false,
  onMuteToggle,
  
  // Display options
  label,
  showPercentage = true,
  showIcon = true,
  
  // Styling
  variant = 'default', // 'default' | 'compact' | 'minimal'
  color = 'brand', // 'brand' | 'white' | 'cyan' | 'energy'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  
  // Accessibility
  ariaLabel,
  id,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const sliderRef = useRef(null);
  
  // Use local value during drag for smooth feedback
  const displayValue = isDragging ? localValue : value;
  const percentage = Math.round(displayValue * 100);
  
  // Size configurations
  const sizes = {
    sm: {
      height: 'h-1',
      thumb: 'w-3 h-3',
      icon: 14,
      text: 'text-xs',
      padding: 'py-1',
    },
    md: {
      height: 'h-1.5',
      thumb: 'w-4 h-4',
      icon: 18,
      text: 'text-sm',
      padding: 'py-2',
    },
    lg: {
      height: 'h-2',
      thumb: 'w-5 h-5',
      icon: 20,
      text: 'text-base',
      padding: 'py-3',
    },
  };
  
  // Color configurations
  const colors = {
    brand: {
      track: 'bg-brand-500',
      trackBg: 'bg-white/10',
      thumb: 'bg-brand-400 border-brand-300',
      icon: 'text-brand-400',
    },
    white: {
      track: 'bg-white',
      trackBg: 'bg-white/10',
      thumb: 'bg-white border-white/50',
      icon: 'text-white',
    },
    cyan: {
      track: 'bg-cyan-500',
      trackBg: 'bg-cyan-500/10',
      thumb: 'bg-cyan-400 border-cyan-300',
      icon: 'text-cyan-400',
    },
    energy: {
      track: 'bg-energy-500',
      trackBg: 'bg-energy-500/10',
      thumb: 'bg-energy-400 border-energy-300',
      icon: 'text-energy-400',
    },
  };
  
  const sizeConfig = sizes[size];
  const colorConfig = colors[color];
  
  // Handle value change
  const handleChange = useCallback((e) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
    if (onChange) onChange(newValue);
  }, [onChange]);
  
  // Handle drag start/end
  const handleDragStart = useCallback(() => setIsDragging(true), []);
  const handleDragEnd = useCallback(() => setIsDragging(false), []);
  
  // Handle icon click (mute toggle)
  const handleIconClick = useCallback(() => {
    if (onMuteToggle) {
      onMuteToggle();
    }
  }, [onMuteToggle]);
  
  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <input
          ref={sliderRef}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={displayValue}
          onChange={handleChange}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
          className={`
            w-full appearance-none cursor-pointer
            ${sizeConfig.height} rounded-full ${colorConfig.trackBg}
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:${sizeConfig.thumb}
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:${colorConfig.thumb}
            [&::-webkit-slider-thumb]:border
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
          `}
          style={{
            background: `linear-gradient(to right, var(--color-brand-500) ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`,
          }}
          aria-label={ariaLabel || label || 'Volume'}
          id={id}
        />
      </div>
    );
  }
  
  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && (
          <button
            onClick={handleIconClick}
            className={`
              p-1 rounded transition-colors
              ${colorConfig.icon}
              ${onMuteToggle ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default'}
            `}
            disabled={!onMuteToggle}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon 
              volume={displayValue} 
              isMuted={isMuted} 
              size={sizeConfig.icon} 
            />
          </button>
        )}
        
        <div className="relative flex-1 flex items-center">
          <input
            ref={sliderRef}
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : displayValue}
            onChange={handleChange}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            disabled={isMuted}
            className={`
              w-full appearance-none cursor-pointer
              ${sizeConfig.height} rounded-full ${colorConfig.trackBg}
              disabled:opacity-50 disabled:cursor-not-allowed
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:border
              [&::-webkit-slider-thumb]:border-white/50
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-webkit-slider-thumb]:disabled:cursor-not-allowed
            `}
            style={{
              background: isMuted 
                ? 'rgba(255,255,255,0.1)'
                : `linear-gradient(to right, var(--color-brand-500) ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`,
            }}
            aria-label={ariaLabel || label || 'Volume'}
            id={id}
          />
        </div>
        
        {showPercentage && (
          <span className={`${sizeConfig.text} text-text-secondary tabular-nums min-w-[3ch]`}>
            {isMuted ? '0' : percentage}%
          </span>
        )}
      </div>
    );
  }
  
  // Default variant (full)
  return (
    <div className={`${className}`}>
      {/* Label row */}
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label 
            htmlFor={id}
            className={`${sizeConfig.text} font-medium text-text-primary`}
          >
            {label}
          </label>
          {showPercentage && (
            <span className={`${sizeConfig.text} text-text-secondary tabular-nums`}>
              {isMuted ? '0' : percentage}%
            </span>
          )}
        </div>
      )}
      
      {/* Slider row */}
      <div className={`flex items-center gap-3 ${sizeConfig.padding}`}>
        {showIcon && (
          <button
            onClick={handleIconClick}
            className={`
              p-1.5 rounded-lg transition-all
              ${colorConfig.icon}
              ${onMuteToggle 
                ? 'hover:bg-white/10 cursor-pointer active:scale-95' 
                : 'cursor-default'
              }
              ${isMuted ? 'opacity-50' : ''}
            `}
            disabled={!onMuteToggle}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon 
              volume={displayValue} 
              isMuted={isMuted} 
              size={sizeConfig.icon} 
            />
          </button>
        )}
        
        <div className="relative flex-1">
          {/* Track background */}
          <div className={`
            absolute inset-0 rounded-full ${colorConfig.trackBg}
            ${sizeConfig.height}
          `} />
          
          {/* Track fill */}
          <motion.div
            className={`
              absolute left-0 top-0 rounded-full ${colorConfig.track}
              ${sizeConfig.height}
            `}
            style={{ width: `${isMuted ? 0 : percentage}%` }}
            animate={{ width: `${isMuted ? 0 : percentage}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          
          {/* Input */}
          <input
            ref={sliderRef}
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : displayValue}
            onChange={handleChange}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            disabled={isMuted}
            className={`
              relative w-full appearance-none cursor-pointer bg-transparent
              ${sizeConfig.height}
              disabled:opacity-50 disabled:cursor-not-allowed
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:${sizeConfig.thumb}
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-white/30
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-webkit-slider-thumb]:hover:border-white/50
              [&::-webkit-slider-thumb]:active:scale-95
              [&::-webkit-slider-thumb]:disabled:cursor-not-allowed
            `}
            aria-label={ariaLabel || label || 'Volume'}
            id={id}
          />
        </div>
        
        {!label && showPercentage && (
          <span className={`${sizeConfig.text} text-text-secondary tabular-nums min-w-[3ch]`}>
            {isMuted ? '0' : percentage}%
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESET VOLUME BUTTONS
// ═══════════════════════════════════════════════════════════════════════════════
export function VolumePresets({ 
  value, 
  onChange, 
  presets = [0, 0.25, 0.5, 0.75, 1],
  className = '',
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {presets.map((preset) => {
        const isActive = Math.abs(value - preset) < 0.05;
        const label = preset === 0 ? 'Mute' : `${Math.round(preset * 100)}%`;
        
        return (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={`
              px-2 py-1 rounded text-xs font-medium transition-all
              ${isActive 
                ? 'bg-brand-500 text-white' 
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
              }
            `}
            aria-label={`Set volume to ${label}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT VOLUME ICON
// ═══════════════════════════════════════════════════════════════════════════════
export { VolumeIcon };
