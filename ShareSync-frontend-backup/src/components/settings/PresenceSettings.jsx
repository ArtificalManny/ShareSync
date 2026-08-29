/**
 * PresenceSettings.jsx
 * Comprehensive privacy and presence controls
 * * Features:
 * - Who can see your cursor
 * - Activity status settings
 * - Notification preferences
 * - Privacy presets
 * - Granular controls
 * * UPDATE: Removed hardcoded inline styles. Implemented adaptive
 * Tailwind classes (slate-900/white) for seamless Light/Dark mode.
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Presence & Privacy
        </h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 m-0">
          Control who can see your cursor and when
        </p>
      </div>

      {/* Privacy Presets */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Quick Presets
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <PresetButton
            icon={Globe}
            label="Open"
            description="Visible to everyone"
            color="#10B981" // Emerald
            onClick={() => applyPreset('open')}
            active={privacySettings.visibility === 'everyone' && privacySettings.showActivity}
          />
          <PresetButton
            icon={Users}
            label="Balanced"
            description="Team members only"
            color="#8B5CF6" // Violet
            onClick={() => applyPreset('balanced')}
            active={privacySettings.visibility === 'team' && privacySettings.showActivity}
          />
          <PresetButton
            icon={Shield}
            label="Private"
            description="Minimal sharing"
            color="#F59E0B" // Amber
            onClick={() => applyPreset('private')}
            active={privacySettings.visibility === 'team' && !privacySettings.showActivity}
          />
          <PresetButton
            icon={Ghost}
            label="Invisible"
            description="Ghost mode"
            color="#6366F1" // Indigo
            onClick={() => applyPreset('invisible')}
            active={privacySettings.visibility === 'nobody'}
          />
        </div>
      </div>

      {/* Visibility Settings */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Who Can See Your Cursor
        </h4>
        <div className="flex flex-col gap-2">
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
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Activity Sharing
        </h4>
        <div className="flex flex-col gap-2">
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
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Interactions
        </h4>
        <div className="flex flex-col gap-2">
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
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Notifications
        </h4>
        <div className="flex flex-col gap-2">
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
      <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30">
        <div className="flex gap-3">
          <Shield size={20} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-violet-900 dark:text-white mb-2">
              Your Privacy Matters
            </p>
            <p className="text-xs text-violet-700 dark:text-zinc-300 m-0 leading-relaxed">
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
      className={`p-4 rounded-xl cursor-pointer text-left transition-all border ${
        active
          ? '' // Styles injected via inline for dynamic hex colors
          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
      }`}
      style={
        active
          ? { backgroundColor: `${color}15`, borderColor: color }
          : {}
      }
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon size={20} color={color} />
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {label}
        </span>
        {active && (
          <Check size={16} color={color} className="ml-auto" />
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-zinc-400 m-0">
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
      className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-all border ${
        selected
          ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/50'
          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
      }`}
    >
      <Icon
        size={18}
        className={selected ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-400'}
      />
      <div className="flex-1 text-left">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">
          {label}
        </div>
        <div className="text-xs text-slate-500 dark:text-zinc-400">
          {description}
        </div>
      </div>
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
          selected ? 'border-violet-600 dark:border-violet-400' : 'border-slate-300 dark:border-white/30'
        }`}
      >
        {selected && (
          <div className="w-2.5 h-2.5 rounded-full bg-violet-600 dark:bg-violet-400" />
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
    <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg flex items-center gap-3">
      <Icon size={18} className="text-slate-400 dark:text-zinc-400" />
      <div className="flex-1">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">
          {label}
        </div>
        <div className="text-xs text-slate-500 dark:text-zinc-400">
          {description}
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onChange}
        className={`w-12 h-7 rounded-full cursor-pointer relative transition-all border-none ${
          checked ? '' : 'bg-slate-300 dark:bg-white/10'
        }`}
        style={
          checked
            ? { background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }
            : {}
        }
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
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        />
      </motion.button>
    </div>
  );
}

export default PresenceSettings;
