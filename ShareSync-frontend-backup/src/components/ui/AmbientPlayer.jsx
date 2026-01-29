// src/components/ui/AmbientPlayer.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE F: The Sound of Progress - Ambient Player
// ═══════════════════════════════════════════════════════════════════════════════
//
// Focus mode ambient audio controller with preset selection.
// Includes noise generators, binaural beats, and ambient drones.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, 
  Play, 
  Pause, 
  Headphones, 
  Radio,
  CloudRain,
  Waves,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Volume2,
  X,
} from 'lucide-react';

import { useAmbientSound } from '../../contexts/SoundContext';
import VolumeSlider from './VolumeSlider';
import { 
  AMBIENT_SOUNDS, 
  AMBIENT_PRESETS,
  useAmbientPlayer,
  useAmbientPresets,
} from '../../sounds/AmbientSounds';

// ═══════════════════════════════════════════════════════════════════════════════
// ICON MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const SOUND_ICONS = {
  white_noise: Radio,
  pink_noise: CloudRain,
  brown_noise: Waves,
  binaural_focus: Brain,
  binaural_deep: Brain,
  drone_ambient: Sparkles,
};

const PRESET_ICONS = {
  focus: '🎯',
  creative: '🎨',
  deep_work: '🧠',
  distraction_block: '🔇',
  calm: '🌿',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND OPTION BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

function SoundOption({ 
  sound, 
  isActive, 
  onClick, 
  disabled = false,
}) {
  const Icon = SOUND_ICONS[sound.id] || Music;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-3 p-3 rounded-xl w-full text-left
        transition-all
        ${isActive 
          ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' 
          : 'bg-white/5 border-white/[0.06] text-text-secondary hover:bg-white/10'
        }
        border
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center
        ${isActive ? 'bg-brand-500/20' : 'bg-white/5'}
      `}>
        <Icon size={20} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isActive ? 'text-brand-400' : 'text-text-primary'}`}>
          {sound.name}
        </p>
        <p className="text-xs text-text-tertiary truncate">
          {sound.description}
        </p>
      </div>
      
      {sound.requiresHeadphones && (
        <Headphones size={14} className="text-cyan-400 flex-shrink-0" />
      )}
      
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-2 h-2 rounded-full bg-brand-500"
        />
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESET BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

function PresetButton({ 
  presetId, 
  preset, 
  isActive, 
  onClick,
}) {
  const emoji = PRESET_ICONS[presetId] || '🎵';
  
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 p-3 rounded-xl
        transition-all
        ${isActive 
          ? 'bg-brand-500/10 border-brand-500/30' 
          : 'bg-white/5 border-white/[0.06] hover:bg-white/10'
        }
        border
      `}
    >
      <span className="text-2xl">{emoji}</span>
      <span className={`text-xs font-medium ${isActive ? 'text-brand-400' : 'text-text-secondary'}`}>
        {preset.name}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI PLAYER (for docks/headers)
// ═══════════════════════════════════════════════════════════════════════════════

export function MiniAmbientPlayer({ className = '' }) {
  const { activeAmbient, activeSound, isPlaying, startAmbient, stopAmbient, volume, setVolume } = useAmbientPlayer();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleToggle = useCallback(() => {
    if (isPlaying) {
      stopAmbient();
    } else {
      startAmbient('brown_noise'); // Default to brown noise
    }
  }, [isPlaying, startAmbient, stopAmbient]);
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleToggle}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          transition-all
          ${isPlaying 
            ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' 
            : 'bg-white/5 text-text-secondary hover:bg-white/10 border-white/[0.06]'
          }
          border
        `}
      >
        {isPlaying ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Music size={16} />
            </motion.div>
            <span className="text-sm font-medium">
              {activeSound?.name || 'Playing'}
            </span>
          </>
        ) : (
          <>
            <Music size={16} />
            <span className="text-sm">Ambient</span>
          </>
        )}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT PLAYER (for sidebars)
// ═══════════════════════════════════════════════════════════════════════════════

export function CompactAmbientPlayer({ className = '' }) {
  const { activeAmbient, activeSound, isPlaying, startAmbient, stopAmbient, volume, setVolume } = useAmbientPlayer();
  
  const handleQuickSelect = useCallback((soundId) => {
    if (activeAmbient === soundId) {
      stopAmbient();
    } else {
      startAmbient(soundId);
    }
  }, [activeAmbient, startAmbient, stopAmbient]);
  
  const quickOptions = ['brown_noise', 'pink_noise', 'binaural_focus'];
  
  return (
    <div className={`p-3 rounded-xl bg-surface-1 border border-white/[0.06] ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Music size={16} className={isPlaying ? 'text-brand-400' : 'text-text-tertiary'} />
          <span className="text-sm font-medium text-text-primary">Ambient</span>
        </div>
        
        {isPlaying && (
          <button
            onClick={stopAmbient}
            className="p-1 rounded hover:bg-white/10 text-text-tertiary"
          >
            <X size={14} />
          </button>
        )}
      </div>
      
      <div className="flex gap-2 mb-3">
        {quickOptions.map((soundId) => {
          const sound = AMBIENT_SOUNDS[soundId];
          const Icon = SOUND_ICONS[soundId] || Music;
          const isActive = activeAmbient === soundId;
          
          return (
            <button
              key={soundId}
              onClick={() => handleQuickSelect(soundId)}
              className={`
                flex-1 p-2 rounded-lg flex flex-col items-center gap-1
                transition-all
                ${isActive 
                  ? 'bg-brand-500/10 text-brand-400' 
                  : 'bg-white/5 text-text-tertiary hover:bg-white/10'
                }
              `}
              title={sound.name}
            >
              <Icon size={16} />
              <span className="text-[10px]">{sound.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
      
      {isPlaying && (
        <VolumeSlider
          value={volume}
          onChange={setVolume}
          variant="minimal"
          size="sm"
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT (Full Player)
// ═══════════════════════════════════════════════════════════════════════════════

export default function AmbientPlayer({
  // Display options
  variant = 'default', // 'default' | 'card' | 'panel'
  showPresets = true,
  showAllSounds = true,
  defaultExpanded = false,
  
  // Styling
  className = '',
}) {
  const { activeAmbient, activeSound, isPlaying, startAmbient, stopAmbient, volume, setVolume } = useAmbientPlayer();
  const { applyPreset, clearPreset, activePreset } = useAmbientPresets();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const handleSoundSelect = useCallback((soundId) => {
    if (activeAmbient === soundId) {
      stopAmbient();
    } else {
      startAmbient(soundId);
    }
  }, [activeAmbient, startAmbient, stopAmbient]);
  
  const handlePresetSelect = useCallback((presetId) => {
    if (activePreset === presetId) {
      clearPreset();
    } else {
      applyPreset(presetId);
    }
  }, [activePreset, applyPreset, clearPreset]);

  // Card variant
  if (variant === 'card') {
    return (
      <div className={`rounded-xl bg-surface-1 border border-white/[0.06] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                ${isPlaying ? 'bg-brand-500/10 text-brand-400' : 'bg-white/5 text-text-tertiary'}
              `}>
                {isPlaying ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  >
                    <Music size={20} />
                  </motion.div>
                ) : (
                  <Music size={20} />
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-text-primary">
                  {isPlaying ? (activeSound?.name || 'Playing') : 'Ambient Sound'}
                </h3>
                <p className="text-xs text-text-tertiary">
                  {isPlaying ? 'Focus mode active' : 'Select a background sound'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => isPlaying ? stopAmbient() : startAmbient('brown_noise')}
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                transition-all
                ${isPlaying 
                  ? 'bg-brand-500 text-white hover:bg-brand-600' 
                  : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }
              `}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
          </div>
        </div>
        
        {/* Volume Control */}
        {isPlaying && (
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <VolumeSlider
              value={volume}
              onChange={setVolume}
              label="Volume"
              variant="default"
              size="sm"
            />
          </div>
        )}
        
        {/* Presets */}
        {showPresets && (
          <div className="p-4">
            <p className="text-xs font-medium text-text-tertiary mb-3">Quick Presets</p>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(AMBIENT_PRESETS).map(([presetId, preset]) => (
                <PresetButton
                  key={presetId}
                  presetId={presetId}
                  preset={preset}
                  isActive={activePreset === presetId}
                  onClick={() => handlePresetSelect(presetId)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Expandable sounds list */}
        {showAllSounds && (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="
                w-full px-4 py-2 flex items-center justify-between
                text-xs text-text-tertiary hover:bg-white/5
                border-t border-white/[0.06]
              "
            >
              <span>All Sounds</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                    {Object.values(AMBIENT_SOUNDS).map((sound) => (
                      <SoundOption
                        key={sound.id}
                        sound={sound}
                        isActive={activeAmbient === sound.id}
                        onClick={() => handleSoundSelect(sound.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    );
  }

  // Default/panel variant
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Now Playing */}
      <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              ${isPlaying ? 'bg-brand-500/10 text-brand-400' : 'bg-white/5 text-text-tertiary'}
            `}>
              {isPlaying ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <Music size={24} />
                </motion.div>
              ) : (
                <Music size={24} />
              )}
            </div>
            
            <div>
              <h3 className="text-base font-medium text-text-primary">
                {isPlaying ? (activeSound?.name || 'Playing') : 'Ambient Sound'}
              </h3>
              <p className="text-sm text-text-tertiary">
                {isPlaying 
                  ? activeSound?.description || 'Focus mode active'
                  : 'Choose a background sound for focus'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={() => isPlaying ? stopAmbient() : startAmbient('brown_noise')}
            className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              transition-all
              ${isPlaying 
                ? 'bg-brand-500 text-white hover:bg-brand-600' 
                : 'bg-white/10 text-text-secondary hover:bg-white/20'
              }
            `}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
        </div>
        
        {isPlaying && (
          <VolumeSlider
            value={volume}
            onChange={setVolume}
            variant="default"
            size="md"
          />
        )}
      </div>
      
      {/* Presets */}
      {showPresets && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-3">
            Quick Presets
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(AMBIENT_PRESETS).map(([presetId, preset]) => (
              <PresetButton
                key={presetId}
                presetId={presetId}
                preset={preset}
                isActive={activePreset === presetId}
                onClick={() => handlePresetSelect(presetId)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* All Sounds */}
      {showAllSounds && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-3">
            All Sounds
          </h4>
          <div className="space-y-2">
            {Object.values(AMBIENT_SOUNDS).map((sound) => (
              <SoundOption
                key={sound.id}
                sound={sound}
                isActive={activeAmbient === sound.id}
                onClick={() => handleSoundSelect(sound.id)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Headphones Note */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
        <Headphones size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-tertiary">
          Use headphones for binaural beats. They work by playing slightly 
          different frequencies in each ear.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS DOCK AMBIENT PLAYER (pre-configured for focus dock)
// ═══════════════════════════════════════════════════════════════════════════════

export function FocusDockAmbientPlayer({ className = '' }) {
  return (
    <AmbientPlayer
      variant="card"
      showPresets={true}
      showAllSounds={true}
      defaultExpanded={false}
      className={className}
    />
  );
}
