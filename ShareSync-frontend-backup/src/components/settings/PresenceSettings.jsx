/**
 * PresenceSettings.jsx
 * Comprehensive privacy and presence controls
 * 
 * Features:
 * - Who can see your cursor
 * - Activity status settings
 * - Notification preferences
 * - Privacy presets
 * - Granular controls
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Users,
  Lock,
  Globe,
  Shield,
  Bell,
  BellOff,
  Ghost,
  Focus,
  Settings as SettingsIcon,
  Check,
  X,
} from 'lucide-react';
import useCursorStore from '../../store/cursorSlice';
import usePresenceStore from '../../store/presenceSlice';

// ============================================
// PRESENCE SETTINGS
// ============================================

export function PresenceSettings() {
  const { settings, updateSettings, saveSettings } = useCursorStore();
  const { updateOwnPresence } = usePresenceStore();

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState(() => {
    const saved = localStorage.getItem('cursor_privacy_settings');
    return saved
      ? JSON.parse(saved)
      : {
          visibility: 'team',        // 'everyone' | 'team' | 'nobody'
          showActivity: true,         // Show typing/clicking/dragging
          showLocation: true,         // Show which page/project
          allowProximity: true,       // Allow proximity detection
          allowFocus: true,           // Allow focus together
          notifications: {
            proximity: true,          // Notify when near someone
            focus: true,              // Notify when someone focuses on you
            mentions: true,           // Notify when mentioned (future)
          },
        };
  });

  // ============================================
  // SAVE SETTINGS
  // ============================================

  const savePrivacySettings = (newSettings) => {
    setPrivacySettings(newSettings);
    localStorage.setItem('cursor_privacy_settings', JSON.stringify(newSettings));
    
    // Update presence based on visibility
    updateOwnPresence({
      mode: newSettings.visibility === 'nobody' ? 'ghost' : 'team',
    });

    console.log('🔒 Privacy settings saved:', newSettings);
  };

  // ============================================
  // UPDATE HANDLERS
  // ============================================

  const updateVisibility = (visibility) => {
    savePrivacySettings({ ...privacySettings, visibility });
  };

  const toggleSetting = (key) => {
    savePrivacySettings({
      ...privacySettings,
      [key]: !privacySettings[key],
    });
  };

  const toggleNotification = (key) => {
    savePrivacySettings({
      ...privacySettings,
      notifications: {
        ...privacySettings.notifications,
        [key]: !privacySettings.notifications[key],
      },
    });
  };

  // ============================================
  // PRIVACY PRESETS
  // ============================================

  const applyPreset = (preset) => {
    const presets = {
      open: {
        visibility: 'everyone',
        showActivity: true,
        showLocation: true,
        allowProximity: true,
        allowFocus: true,
        notifications: {
          proximity: true,
          focus: true,
          mentions: true,
        },
      },
      balanced: {
        visibility: 'team',
        showActivity: true,
        showLocation: true,
        allowProximity: true,
        allowFocus: true,
        notifications: {
          proximity: true,
          focus: true,
          mentions: true,
        },
      },
      private: {
        visibility: 'team',
        showActivity: false,
        showLocation: false,
        allowProximity: false,
        allowFocus: false,
        notifications: {
          proximity: false,
          focus: false,
          mentions: true,
        },
      },
      invisible: {
        visibility: 'nobody',
        showActivity: false,
        showLocation: false,
        allowProximity: false,
        allowFocus: false,
        notifications: {
          proximity: false,
          focus: false,
          mentions: false,
        },
      },
    };

    savePrivacySettings(presets[preset]);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Presence & Privacy
        </h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, margin: 0 }}>
          Control who can see your cursor and when
        </p>
      </div>

      {/* Privacy Presets */}
      <div>
        <h4 style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          Quick Presets
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <PresetButton
            icon={Globe}
            label="Open"
            description="Visible to everyone"
            color="#10B981"
            onClick={() => applyPreset('open')}
            active={privacySettings.visibility === 'everyone' && privacySettings.showActivity}
          />
          <PresetButton
            icon={Users}
            label="Balanced"
            description="Team members only"
            color="#8B5CF6"
            onClick={() => applyPreset('balanced')}
            active={privacySettings.visibility === 'team' && privacySettings.showActivity}
          />
          <PresetButton
            icon={Shield}
            label="Private"
            description="Minimal sharing"
            color="#F59E0B"
            onClick={() => applyPreset('private')}
            active={privacySettings.visibility === 'team' && !privacySettings.showActivity}
          />
          <PresetButton
            icon={Ghost}
            label="Invisible"
            description="Ghost mode"
            color="#6366F1"
            onClick={() => applyPreset('invisible')}
            active={privacySettings.visibility === 'nobody'}
          />
        </div>
      </div>

      {/* Visibility Settings */}
      <div>
        <h4 style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          Who Can See Your Cursor
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RadioOption
            icon={Globe}
            label="Everyone"
            description="All users in the project"
            selected={privacySettings.visibility === 'everyone'}
            onClick={() => updateVisibility('everyone')}
          />
          <RadioOption
            icon={Users}
            label="Team Only"
            description="Only your team members"
            selected={privacySettings.visibility === 'team'}
            onClick={() => updateVisibility('team')}
          />
          <RadioOption
            icon={Ghost}
            label="Nobody"
            description="Invisible to all users"
            selected={privacySettings.visibility === 'nobody'}
            onClick={() => updateVisibility('nobody')}
          />
        </div>
      </div>

      {/* Activity Settings */}
      <div>
        <h4 style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          Activity Sharing
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ToggleOption
            icon={Eye}
            label="Show Activity"
            description="Let others see when you're typing, clicking, etc."
            checked={privacySettings.showActivity}
            onChange={() => toggleSetting('showActivity')}
          />
          <ToggleOption
            icon={Focus}
            label="Show Location"
            description="Let others see which page/project you're on"
            checked={privacySettings.showLocation}
            onChange={() => toggleSetting('showLocation')}
          />
        </div>
      </div>

      {/* Interaction Settings */}
      <div>
        <h4 style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          Interactions
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ToggleOption
            icon={Users}
            label="Allow Proximity Detection"
            description="Enable sync pulses when near other cursors"
            checked={privacySettings.allowProximity}
            onChange={() => toggleSetting('allowProximity')}
          />
          <ToggleOption
            icon={Eye}
            label="Allow Focus Together"
            description="Let others follow your cursor"
            checked={privacySettings.allowFocus}
            onChange={() => toggleSetting('allowFocus')}
          />
        </div>
      </div>

      {/* Notification Settings */}
      <div>
        <h4 style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          Notifications
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ToggleOption
            icon={Bell}
            label="Proximity Alerts"
            description="Notify when someone gets close"
            checked={privacySettings.notifications.proximity}
            onChange={() => toggleNotification('proximity')}
          />
          <ToggleOption
            icon={Bell}
            label="Focus Alerts"
            description="Notify when someone focuses on you"
            checked={privacySettings.notifications.focus}
            onChange={() => toggleNotification('focus')}
          />
        </div>
      </div>

      {/* Info Box */}
      <div
        style={{
          padding: 16,
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <Shield size={20} color="#8B5CF6" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 8px 0' }}>
              Your Privacy Matters
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              These settings control your real-time presence. You can change them anytime, and they apply immediately across all sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PRESET BUTTON
// ============================================

function PresetButton({ icon: Icon, label, description, color, onClick, active }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        padding: 16,
        background: active
          ? `${color}22`
          : 'rgba(255, 255, 255, 0.05)',
        border: active
          ? `2px solid ${color}`
          : '2px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Icon size={20} color={color} />
        <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
          {label}
        </span>
        {active && (
          <Check size={16} color={color} style={{ marginLeft: 'auto' }} />
        )}
      </div>
      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12, margin: 0 }}>
        {description}
      </p>
    </motion.button>
  );
}

// ============================================
// RADIO OPTION
// ============================================

function RadioOption({ icon: Icon, label, description, selected, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      style={{
        padding: 12,
        background: selected
          ? 'rgba(139, 92, 246, 0.1)'
          : 'rgba(255, 255, 255, 0.05)',
        border: selected
          ? '1px solid rgba(139, 92, 246, 0.5)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'all 0.2s',
      }}
    >
      <Icon size={18} color={selected ? '#8B5CF6' : 'rgba(255, 255, 255, 0.6)'} />
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
          {label}
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}>
          {description}
        </div>
      </div>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: `2px solid ${selected ? '#8B5CF6' : 'rgba(255, 255, 255, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#8B5CF6',
            }}
          />
        )}
      </div>
    </motion.button>
  );
}

// ============================================
// TOGGLE OPTION
// ============================================

function ToggleOption({ icon: Icon, label, description, checked, onChange }) {
  return (
    <div
      style={{
        padding: 12,
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Icon size={18} color="rgba(255, 255, 255, 0.6)" />
      <div style={{ flex: 1 }}>
        <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
          {label}
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}>
          {description}
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onChange}
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          background: checked
            ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
            : 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s',
        }}
      >
        <motion.div
          animate={{ x: checked ? 22 : 2 }}
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
    </div>
  );
}

export default PresenceSettings;