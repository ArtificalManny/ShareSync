import React, { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { User, Mail, Smartphone, Eye, EyeOff, Palette, Lock, Bell } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { user, updateUserProfile } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: true,
    },
    profileVisibility: 'public',
    theme: 'dark',
    password: '',
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name in settings.notifications) {
      setSettings((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, [name]: checked },
      }));
    } else {
      setSettings((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const saveSettings = () => {
    updateUserProfile({
      profileVisibility: settings.profileVisibility,
      theme: settings.theme,
    });
    console.log('Settings saved:', settings);
  };

  return (
    <div className="settings-container">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-4xl font-playfair text-accent-gold mb-6 text-center flex items-center justify-center">
          <Settings className="w-6 h-6 mr-2" /> Settings
        </h1>
        <div className="card p-6">
          <h2 className="text-2xl font-playfair text-accent-teal mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" /> Profile Settings
          </h2>
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-accent-teal" />
              <label className="text-primary">Profile Visibility:</label>
              <select
                name="profileVisibility"
                value={settings.profileVisibility}
                onChange={handleInputChange}
                className="input-field flex-1 rounded-full"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <h2 className="text-2xl font-playfair text-accent-teal mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" /> Notification Preferences
          </h2>
          <div className="space-y-4 mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="email"
                checked={settings.notifications.email}
                onChange={handleInputChange}
              />
              <Mail className="w-5 h-5 text-accent-teal" /> Email Notifications
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="sms"
                checked={settings.notifications.sms}
                onChange={handleInputChange}
              />
              <Smartphone className="w-5 h-5 text-accent-teal" /> SMS Notifications
            </label>
          </div>

          <h2 className="text-2xl font-playfair text-accent-teal mb-4 flex items-center">
            <Palette className="w-5 h-5 mr-2" /> Appearance
          </h2>
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-primary">Theme:</label>
              <select
                name="theme"
                value={settings.theme}
                onChange={handleInputChange}
                className="input-field flex-1 rounded-full"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>

          <h2 className="text-2xl font-playfair text-accent-teal mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2" /> Account Security
          </h2>
          <div className="space-y-4 mb-6">
            <input
              type="password"
              name="password"
              value={settings.password}
              onChange={handleInputChange}
              placeholder="New Password"
              className="input-field w-full rounded-full"
            />
          </div>

          <button onClick={saveSettings} className="btn-primary rounded-full w-full">Save Settings</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;