// src/context/SettingsContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getSettings, updateSettings as apiUpdateSettings } from '../api/settings';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const applyGlobalTheme = (theme) => {
    if (!theme) return;
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else if (theme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  // 🛡️ BULLETPROOF MODULAR EXTRACTION
  // This completely ignores old "preferences" and "settings" objects
  // and exclusively pulls the modern modules from the NestJS response.
  const extractModularSettings = (responseData) => {
    // Handle NestJS wrapper { success: true, data: { ... } } or direct object
    const rootUser = responseData?.data || responseData || {};
    
    return {
      appearance: rootUser.appearance || { theme: 'system', mode: 'pro' },
      focus: rootUser.focus || { dailyTarget: 5, autoStart: false, startTime: '09:00', blockedApps: [] },
      momentum: rootUser.momentum || { dailyGoal: 5, weekendCount: false, allowFreeze: true },
      mentor: rootUser.mentor || { enabled: true, tone: 'wise', intensity: 3 },
      social: rootUser.social || { showStreakTo: 'friends', celebrate: true, publicProfile: true, discoverable: false },
      legacy: rootUser.legacy || { showEverywhere: true, yearlyVideo: false },
      notifications: rootUser.notifications || { emailActivity: true, emailDigest: true },
      security: rootUser.security || { twoFA: false }
    };
  };

  useEffect(() => {
    const fetchInitialSettings = async () => {
      try {
        setLoading(true);
        const data = await getSettings();
        
        const extractedSettings = extractModularSettings(data);
        setSettings(extractedSettings);
        
        if (extractedSettings?.appearance?.theme) {
          applyGlobalTheme(extractedSettings.appearance.theme);
        }
      } catch (err) {
        console.error('Failed to load global settings:', err);
        setError(err.response?.data?.message || 'Error loading settings from database.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialSettings();
  }, []);

  const updateSettings = async (newSettingsPayload) => {
    try {
      // 🛡️ OPTIMISTIC UPDATE: Update UI instantly so the form doesn't flash or reset
      const optimisticSettings = { ...settings, ...newSettingsPayload };
      setSettings(optimisticSettings);
      
      if (newSettingsPayload?.appearance?.theme) {
        applyGlobalTheme(newSettingsPayload.appearance.theme);
      }

      // Send the payload to the backend
      const updatedData = await apiUpdateSettings(newSettingsPayload);
      
      // Parse the backend's confirmation
      const extractedSettings = extractModularSettings(updatedData);
      setSettings(extractedSettings);

      // Re-apply theme just in case backend modified it
      if (extractedSettings?.appearance?.theme) {
        applyGlobalTheme(extractedSettings.appearance.theme);
      }

      return { success: true, data: extractedSettings };
    } catch (err) {
      console.error('Failed to update global settings:', err);
      // Revert optimistic update on error by re-fetching the original safe state
      const rollbackData = await getSettings().catch(() => null);
      if (rollbackData) {
          const rollbackSettings = extractModularSettings(rollbackData);
          setSettings(rollbackSettings);
          applyGlobalTheme(rollbackSettings?.appearance?.theme);
      }
      throw err;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, error, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
