import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { User, Mail, Smartphone, Eye, EyeOff, Palette, Lock, Bell, Settings as SettingsIcon } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { user, isAuthenticated, updateUserProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: { email: true, sms: true },
    profileVisibility: 'public',
    theme: 'dark',
    password: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
    } else {
      setSettings({
        notifications: user.notifications || { email: true, sms: true },
        profileVisibility: user.profileVisibility || 'public',
        theme: user.theme || 'dark',
        password: '',
      });
      setLoading(false);
    }
  }, [isAuthenticated, navigate]);

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
      notifications: settings.notifications,
    });
    if (settings.password) {
      console.log('Password update not implemented in this example');
    }
  };

  if (loading) return <div className="settings-container"><p className="text-holo-gray">Loading...</p></div>;

  return (
    <div className="settings-container">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-4xl font-inter text-holo-blue mb-6 text-center flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 mr-2 text-holo-pink" /> Settings
        </h1>
        <div className="card p-6">
          <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-holo-pink" /> Profile Settings
          </h2>
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-holo-pink" />
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

          <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-holo-pink" /> Notification Preferences
          </h2>
          <div className="space-y-4 mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="email"
                checked={settings.notifications.email}
                onChange={handleInputChange}
              />
              <Mail className="w-5 h-5 text-holo-pink" /> Email Notifications
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="sms"
                checked={settings.notifications.sms}
                onChange={handleInputChange}
              />
              <Smartphone className="w-5 h-5 text-holo-pink" /> SMS Notifications
            </label>
          </div>

          <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
            <Palette className="w-5 h-5 mr-2 text-holo-pink" /> Appearance
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

          <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-holo-pink" /> Account Security
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