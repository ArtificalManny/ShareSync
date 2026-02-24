// src/components/ui/SoundToggle.jsx
import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useSoundMute, useSoundVolume } from '../../contexts/SoundContext';
import { useSounds } from '../../hooks/useSounds';

export default function SoundToggle({
  variant = 'default', size = 'md', showLabel = false, className = '', activeColor = 'brand', tooltip = true,
}) {
  const { isMuted, toggleMute } = useSoundMute();
  const { volumes } = useSoundVolume();
  const { playClick } = useSounds();
  
  const sizes = {
    sm: { button: 'p-1.5', icon: 14, text: 'text-xs', pill: 'px-2 py-1 gap-1' },
    md: { button: 'p-2', icon: 18, text: 'text-sm', pill: 'px-3 py-1.5 gap-1.5' },
    lg: { button: 'p-2.5', icon: 22, text: 'text-base', pill: 'px-4 py-2 gap-2' },
  };
  
  // PURE ICON HOVER: No background boxes
  const colors = {
    brand: {
      active: 'text-violet-600 dark:text-violet-400 hover:scale-110',
      muted: 'text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:scale-110',
    },
    white: {
      active: 'text-slate-800 dark:text-white hover:scale-110',
      muted: 'text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:scale-110',
    },
    cyan: {
      active: 'text-cyan-600 dark:text-cyan-400 hover:scale-110',
      muted: 'text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:scale-110',
    },
  };
  
  const sizeConfig = sizes[size];
  const colorConfig = colors[activeColor];
  
  const Icon = isMuted ? VolumeX : (volumes.master < 0.33 ? Volume1 : Volume2);
  
  const handleClick = useCallback(() => {
    if (isMuted) playClick();
    toggleMute();
  }, [isMuted, toggleMute, playClick]);
  
  const tooltipText = isMuted ? 'Unmute sounds' : 'Mute sounds';
  
  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`${sizeConfig.button} transition-all focus-visible:outline-none ${isMuted ? colorConfig.muted : colorConfig.active} ${className}`}
        title={tooltip ? tooltipText : undefined}
      >
        <AnimatePresence mode="wait">
          <motion.div key={isMuted ? 'muted' : 'unmuted'} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }}>
            <Icon size={sizeConfig.icon} />
          </motion.div>
        </AnimatePresence>
      </button>
    );
  }
  
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 ${sizeConfig.button} transition-all ${isMuted ? colorConfig.muted : colorConfig.active} ${className}`}
      title={tooltip ? tooltipText : undefined}
    >
      <AnimatePresence mode="wait">
        <motion.div key={isMuted ? 'muted' : 'unmuted'} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.2 }}>
          <Icon size={sizeConfig.icon} />
        </motion.div>
      </AnimatePresence>
      {showLabel && <span className={`${sizeConfig.text} font-medium`}>{isMuted ? 'Muted' : 'Sound On'}</span>}
    </button>
  );
}

export function NavbarSoundToggle({ className = '' }) {
  return <SoundToggle variant="compact" size="md" tooltip={true} className={className} />;
}
