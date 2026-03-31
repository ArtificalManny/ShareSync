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

  useEffect(() => {
    const fetchInitialSettings = async () => {
      try {
        setLoading(true);
        const data = await getSettings();
        
        // Bulletproof NestJS Parsing
        const userSettings = data?.appSettings || data?.settings || data?.data?.appSettings || data || {};
        setSettings(userSettings);
        
        if (userSettings?.appearance?.theme) {
          applyGlobalTheme(userSettings.appearance.theme);
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
      const updatedData = await apiUpdateSettings(newSettingsPayload);
      const updatedSettings = updatedData?.appSettings || updatedData?.settings || updatedData?.data?.appSettings || updatedData || {};
      
      setSettings(updatedSettings);

      if (newSettingsPayload?.appearance?.theme) {
        applyGlobalTheme(newSettingsPayload.appearance.theme);
      }

      return { success: true, data: updatedSettings };
    } catch (err) {
      console.error('Failed to update global settings:', err);
      throw err;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, error, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
