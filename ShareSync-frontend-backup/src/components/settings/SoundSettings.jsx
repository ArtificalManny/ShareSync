// src/components/settings/SoundSettings.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE F: The Sound of Progress - Sound Settings Panel
// ═══════════════════════════════════════════════════════════════════════════════
//
// Full sound preferences panel for the settings page.
// Includes master volume, category controls, and feature toggles.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, 
  VolumeX,
  Bell,
  Music,
  Zap,
  MousePointer,
  Trophy,
  Users,
  Headphones,
  Info,
  RefreshCw,
} from 'lucide-react';

import { 
  useSoundContext,
  useSoundMute,
  useSoundVolume,
  useSoundPreferences,
  SOUND_CATEGORIES,
} from '../../contexts/SoundContext';
import VolumeSlider from '../ui/VolumeSlider';
import { useSounds } from '../../hooks/useSounds';

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const CATEGORY_CONFIG = {
  ui: {
    id: 'ui',
    label: 'UI Feedback',
    description: 'Clicks, toggles, and navigation sounds',
    icon: MousePointer,
    color: 'text-text-secondary',
    testSound: 'click',
  },
  achievement: {
    id: 'achievement',
    label: 'Achievements',
    description: 'Task completion, ships, and level ups',
    icon: Trophy,
    color: 'text-warning-500',
    testSound: 'task_complete',
  },
  momentum: {
    id: 'momentum',
    label: 'Momentum',
    description: 'Sounds that intensify with your momentum',
    icon: Zap,
    color: 'text-brand-400',
    testSound: 'momentum_tick',
  },
  notification: {
    id: 'notification',
    label: 'Notifications',
    description: 'Team activity, mentions, and alerts',
    icon: Bell,
    color: 'text-cyan-400',
    testSound: 'message',
  },
  ambient: {
    id: 'ambient',
    label: 'Ambient',
    description: 'Focus mode background sounds',
    icon: Music,
    color: 'text-success',
    testSound: null, // Ambient has its own player
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOGGLE SWITCH COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ToggleSwitch({ checked, onChange, disabled = false, label, id }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      id={id}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50
        ${checked ? 'bg-brand-500' : 'bg-white/10'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <motion.span
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`
          inline-block h-5 w-5 rounded-full bg-white shadow-lg
          ${disabled ? '' : 'shadow-brand-500/20'}
        `}
      />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY VOLUME CARD
// ═══════════════════════════════════════════════════════════════════════════════

function CategoryVolumeCard({ 
  category, 
  volume, 
  onVolumeChange, 
  enabled, 
  onToggle,
  onTest,
}) {
  const config = CATEGORY_CONFIG[category];
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <div className={`
      p-4 rounded-xl bg-surface-1 border border-white/[0.06]
      ${!enabled ? 'opacity-60' : ''}
      transition-opacity
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            bg-white/5 ${config.color}
          `}>
            <Icon size={20} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-primary">
              {config.label}
            </h4>
            <p className="text-xs text-text-tertiary">
              {config.description}
            </p>
          </div>
        </div>
        
        <ToggleSwitch
          checked={enabled}
          onChange={onToggle}
          label={`Toggle ${config.label} sounds`}
        />
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <VolumeSlider
            value={volume}
            onChange={onVolumeChange}
            variant="compact"
            size="sm"
            showIcon={false}
            showPercentage={true}
          />
        </div>
        
        {config.testSound && (
          <button
            onClick={onTest}
            disabled={!enabled}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium
              bg-white/5 hover:bg-white/10 text-text-secondary
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            `}
          >
            Test
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREFERENCE TOGGLE ROW
// ═══════════════════════════════════════════════════════════════════════════════

function PreferenceToggle({ 
  label, 
  description, 
  checked, 
  onChange, 
  icon: Icon,
  disabled = false,
}) {
  return (
    <div className={`
      flex items-center justify-between py-3
      ${disabled ? 'opacity-50' : ''}
    `}>
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon size={18} className="text-text-tertiary" />
        )}
        <div>
          <p className="text-sm font-medium text-text-primary">
            {label}
          </p>
          {description && (
            <p className="text-xs text-text-tertiary">
              {description}
            </p>
          )}
        </div>
      </div>
      
      <ToggleSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        label={label}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SoundSettings({ className = '' }) {
  const { isInitialized, initialize, stopAll } = useSoundContext();
  const { isMuted, toggleMute } = useSoundMute();
  const { volumes, setMasterVolume, setCategoryVolume } = useSoundVolume();
  const { preferences, updatePreferences } = useSoundPreferences();
  const { play } = useSounds();
  
  // Test sound for a category
  const handleTestSound = useCallback((category) => {
    const config = CATEGORY_CONFIG[category];
    if (config?.testSound) {
      play(config.testSound);
    }
  }, [play]);
  
  // Reset to defaults
  const handleReset = useCallback(() => {
    setMasterVolume(0.7);
    setCategoryVolume('ui', 0.5);
    setCategoryVolume('achievement', 0.8);
    setCategoryVolume('momentum', 0.7);
    setCategoryVolume('notification', 0.6);
    setCategoryVolume('ambient', 0.3);
    updatePreferences({
      enableUIFeedback: true,
      enableAchievementSounds: true,
      enableMomentumSounds: true,
      enableNotificationSounds: true,
      enableAmbientSounds: true,
      enableHoverSounds: false,
    });
  }, [setMasterVolume, setCategoryVolume, updatePreferences]);
  
  // Map preferences to category enables
  const categoryEnabled = {
    ui: preferences.enableUIFeedback,
    achievement: preferences.enableAchievementSounds,
    momentum: preferences.enableMomentumSounds,
    notification: preferences.enableNotificationSounds,
    ambient: preferences.enableAmbientSounds,
  };
  
  const toggleCategory = (category) => {
    const prefKey = {
      ui: 'enableUIFeedback',
      achievement: 'enableAchievementSounds',
      momentum: 'enableMomentumSounds',
      notification: 'enableNotificationSounds',
      ambient: 'enableAmbientSounds',
    }[category];
    
    if (prefKey) {
      updatePreferences({ [prefKey]: !categoryEnabled[category] });
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Sound Settings
          </h2>
          <p className="text-sm text-text-tertiary">
            Configure audio feedback and ambient sounds
          </p>
        </div>
        
        <button
          onClick={handleReset}
          className="
            flex items-center gap-2 px-3 py-1.5 rounded-lg
            text-sm text-text-secondary
            bg-white/5 hover:bg-white/10
            transition-colors
          "
        >
          <RefreshCw size={14} />
          Reset
        </button>
      </div>
      
      {/* Master Volume */}
      <div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              ${isMuted ? 'bg-red-500/10 text-red-400' : 'bg-brand-500/10 text-brand-400'}
            `}>
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </div>
            <div>
              <h3 className="text-base font-medium text-text-primary">
                Master Volume
              </h3>
              <p className="text-sm text-text-tertiary">
                {isMuted ? 'All sounds muted' : 'Controls all sound levels'}
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleMute}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm
              transition-colors
              ${isMuted 
                ? 'bg-brand-500 text-white hover:bg-brand-600' 
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
              }
            `}
          >
            {isMuted ? 'Unmute' : 'Mute All'}
          </button>
        </div>
        
        <VolumeSlider
          value={volumes.master}
          onChange={setMasterVolume}
          isMuted={isMuted}
          variant="default"
          size="lg"
          showIcon={false}
        />
      </div>
      
      {/* Category Volumes */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Category Volumes
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.keys(CATEGORY_CONFIG).map((category) => (
            <CategoryVolumeCard
              key={category}
              category={category}
              volume={volumes[category] ?? 0.5}
              onVolumeChange={(v) => setCategoryVolume(category, v)}
              enabled={categoryEnabled[category]}
              onToggle={() => toggleCategory(category)}
              onTest={() => handleTestSound(category)}
            />
          ))}
        </div>
      </div>
      
      {/* Additional Preferences */}
      <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
        <h3 className="text-sm font-medium text-text-secondary mb-2">
          Additional Settings
        </h3>
        
        <div className="divide-y divide-white/[0.06]">
          <PreferenceToggle
            label="Hover Sounds"
            description="Play subtle sounds when hovering over interactive elements"
            checked={preferences.enableHoverSounds}
            onChange={(v) => updatePreferences({ enableHoverSounds: v })}
            icon={MousePointer}
          />
        </div>
      </div>
      
      {/* Binaural Note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
        <Headphones size={20} className="text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-text-primary">
            Binaural Beats
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            For the best experience with binaural beats and focus sounds, use headphones. 
            These sounds create a subtle difference between left and right audio channels 
            that can help improve focus and concentration.
          </p>
        </div>
      </div>
      
      {/* Initialization Status */}
      {!isInitialized && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-warning-500/5 border border-warning-500/20">
          <Info size={20} className="text-warning-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-text-primary">
              Sound system not initialized
            </p>
            <p className="text-xs text-text-tertiary">
              Click any button to enable sounds
            </p>
          </div>
          <button
            onClick={initialize}
            className="
              px-3 py-1.5 rounded-lg text-sm font-medium
              bg-warning-500 text-white hover:bg-warning-600
              transition-colors
            "
          >
            Initialize
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT SOUND SETTINGS (for modals/popovers)
// ═══════════════════════════════════════════════════════════════════════════════

export function CompactSoundSettings({ className = '' }) {
  const { isMuted, toggleMute } = useSoundMute();
  const { volumes, setMasterVolume } = useSoundVolume();
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">Sound</span>
        <button
          onClick={toggleMute}
          className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${isMuted 
              ? 'bg-red-500/10 text-red-400' 
              : 'bg-brand-500/10 text-brand-400'
            }
          `}
        >
          {isMuted ? 'Muted' : 'On'}
        </button>
      </div>
      
      <VolumeSlider
        value={volumes.master}
        onChange={setMasterVolume}
        isMuted={isMuted}
        onMuteToggle={toggleMute}
        variant="compact"
        size="sm"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND SETTINGS SECTION (for embedding in larger settings pages)
// ═══════════════════════════════════════════════════════════════════════════════

export function SoundSettingsSection({ title = 'Sounds', className = '' }) {
  return (
    <section className={className}>
      {title && (
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {title}
        </h2>
      )}
      <SoundSettings />
    </section>
  );
}
