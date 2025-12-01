/**
 * CursorCustomization.jsx
 * Settings panel for customizing cursor effects
 * 
 * Allows users to:
 * - Enable/disable cursor features
 * - Choose cursor trail effects
 * - Select cursor colors
 * - Adjust animation speeds
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Ghost,
  Flame,
  Star,
  Circle,
} from 'lucide-react';

function CursorCustomization() {
  // Load settings from localStorage
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('cursor_settings');
    return saved
      ? JSON.parse(saved)
      : {
          enabled: true,
          showOwnCursor: false,
          ghostTrail: true,
          trailLength: 10,
          trailEffect: 'sparkle', // 'sparkle' | 'ghost' | 'fire' | 'star'
          breathingSpeed: 'normal', // 'slow' | 'normal' | 'fast'
          flashEnabled: true,
          syncPulseEnabled: true,
          proximityThreshold: 50,
          cursorSize: 'medium', // 'small' | 'medium' | 'large'
          showNames: true,
        };
  });

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('cursor_settings', JSON.stringify(settings));
    
    // Dispatch event for other components to react
    window.dispatchEvent(
      new CustomEvent('cursor:settings-changed', { detail: settings })
    );
  }, [settings]);

  // Update a setting
  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 8,
          background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Cursor Effects
      </h2>
      <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 32 }}>
        Customize how you see and interact with live cursors
      </p>

      {/* Main toggle */}
      <SettingCard>
        <SettingRow
          icon={<Eye className="w-5 h-5" />}
          title="Enable Live Cursors"
          description="See other people's cursors moving in real-time"
          value={settings.enabled}
          onChange={(value) => updateSetting('enabled', value)}
          type="toggle"
        />
      </SettingCard>

      {/* Visibility settings */}
      <SettingCard title="Visibility">
        <SettingRow
          icon={<Circle className="w-5 h-5" />}
          title="Show My Cursor"
          description="Display your own cursor on screen"
          value={settings.showOwnCursor}
          onChange={(value) => updateSetting('showOwnCursor', value)}
          type="toggle"
          disabled={!settings.enabled}
        />

        <SettingRow
          icon={<Sparkles className="w-5 h-5" />}
          title="Show Names"
          description="Display usernames next to cursors"
          value={settings.showNames}
          onChange={(value) => updateSetting('showNames', value)}
          type="toggle"
          disabled={!settings.enabled}
        />
      </SettingCard>

      {/* Trail effects */}
      <SettingCard title="Trail Effects">
        <SettingRow
          icon={<Ghost className="w-5 h-5" />}
          title="Ghost Trail"
          description="Show where cursors have been (3 seconds)"
          value={settings.ghostTrail}
          onChange={(value) => updateSetting('ghostTrail', value)}
          type="toggle"
          disabled={!settings.enabled}
        />

        <SettingRow
          title="Trail Length"
          description="Number of trail points"
          value={settings.trailLength}
          onChange={(value) => updateSetting('trailLength', value)}
          type="slider"
          min={5}
          max={20}
          disabled={!settings.enabled || !settings.ghostTrail}
        />

        <SettingRow
          title="Trail Effect"
          description="Visual style of the trail"
          value={settings.trailEffect}
          onChange={(value) => updateSetting('trailEffect', value)}
          type="select"
          options={[
            { value: 'sparkle', label: 'Sparkle ✨' },
            { value: 'ghost', label: 'Ghost 👻' },
            { value: 'fire', label: 'Fire 🔥' },
            { value: 'star', label: 'Star ⭐' },
          ]}
          disabled={!settings.enabled || !settings.ghostTrail}
        />
      </SettingCard>

      {/* Animation settings */}
      <SettingCard title="Animations">
        <SettingRow
          icon={<Zap className="w-5 h-5" />}
          title="Activity Flashes"
          description="White burst when clicking/typing"
          value={settings.flashEnabled}
          onChange={(value) => updateSetting('flashEnabled', value)}
          type="toggle"
          disabled={!settings.enabled}
        />

        <SettingRow
          icon={<Flame className="w-5 h-5" />}
          title="Sync Pulse"
          description="Ring effect when cursors are near"
          value={settings.syncPulseEnabled}
          onChange={(value) => updateSetting('syncPulseEnabled', value)}
          type="toggle"
          disabled={!settings.enabled}
        />

        <SettingRow
          title="Breathing Speed"
          description="How fast cursors pulse"
          value={settings.breathingSpeed}
          onChange={(value) => updateSetting('breathingSpeed', value)}
          type="select"
          options={[
            { value: 'slow', label: 'Slow (Calm)' },
            { value: 'normal', label: 'Normal' },
            { value: 'fast', label: 'Fast (Energetic)' },
          ]}
          disabled={!settings.enabled}
        />
      </SettingCard>

      {/* Proximity settings */}
      <SettingCard title="Proximity Detection">
        <SettingRow
          title="Detection Distance"
          description="Distance (in pixels) to trigger sync pulse"
          value={settings.proximityThreshold}
          onChange={(value) => updateSetting('proximityThreshold', value)}
          type="slider"
          min={20}
          max={100}
          disabled={!settings.enabled || !settings.syncPulseEnabled}
        />
      </SettingCard>

      {/* Cursor size */}
      <SettingCard title="Appearance">
        <SettingRow
          title="Cursor Size"
          description="Size of cursor dots and avatars"
          value={settings.cursorSize}
          onChange={(value) => updateSetting('cursorSize', value)}
          type="select"
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ]}
          disabled={!settings.enabled}
        />
      </SettingCard>

      {/* Reset button */}
      <button
        onClick={() => {
          if (confirm('Reset all cursor settings to defaults?')) {
            localStorage.removeItem('cursor_settings');
            window.location.reload();
          }
        }}
        style={{
          marginTop: 32,
          padding: '12px 24px',
          background: 'transparent',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          borderRadius: 8,
          color: '#EF4444',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Reset to Defaults
      </button>
    </div>
  );
}

// Setting card wrapper
function SettingCard({ title, children }) {
  return (
    <div
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
      }}
    >
      {title && (
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 16,
            color: 'white',
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

// Setting row component
function SettingRow({
  icon,
  title,
  description,
  value,
  onChange,
  type,
  options,
  min,
  max,
  disabled,
}) {
  const renderControl = () => {
    switch (type) {
      case 'toggle':
        return (
          <motion.button
            onClick={() => !disabled && onChange(!value)}
            disabled={disabled}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              background: value ? '#8B5CF6' : 'rgba(148, 163, 184, 0.3)',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              position: 'relative',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <motion.div
              animate={{ x: value ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                background: 'white',
                position: 'absolute',
                top: 2,
              }}
            />
          </motion.button>
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            style={{
              padding: '8px 12px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 8,
              color: 'white',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'slider':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range"
              min={min}
              max={max}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              disabled={disabled}
              style={{
                flex: 1,
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            />
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#8B5CF6',
                minWidth: 30,
                textAlign: 'right',
              }}
            >
              {value}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 0',
        borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
      }}
    >
      {icon && (
        <div style={{ color: disabled ? '#64748B' : '#8B5CF6' }}>{icon}</div>
      )}

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: disabled ? '#64748B' : 'white',
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: '#94A3B8' }}>{description}</div>
        )}
      </div>

      {renderControl()}
    </div>
  );
}

export default CursorCustomization;