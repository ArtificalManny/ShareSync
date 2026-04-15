import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Moon, Phone, Check, X } from 'lucide-react';
import { updateNotificationSettings, updatePhoneNumber } from '../api/notifications';
import { toast } from '../components/ui/toast';
import useDocumentTitle from "../hooks/useDocumentTitle";

const NotificationSettings = () => {
  useDocumentTitle("Notification Settings");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    inApp: 'all',
    email: 'instant',
    sms: 'off',
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
    },
  });

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    // TODO: Fetch current settings from API
    // For now, using defaults
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateNotificationSettings(settings);
      
      if (phoneNumber) {
        await updatePhoneNumber(phoneNumber);
      }
      
      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Failed to save',
        description: 'Could not update notification settings.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617, #0f172a, #020617)' }} className="text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Notification Settings
          </h1>
          <p className="text-slate-400 mt-2">
            Control how and when you receive notifications
          </p>
        </div>

        <div className="space-y-6">
          {/* In-App Notifications */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold">In-App Notifications</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Notifications that appear in OpenShare
            </p>
            
            <div className="space-y-3">
              {[
                { value: 'all', label: 'All notifications', desc: 'Get notified about everything' },
                { value: 'mentions', label: 'Mentions only', desc: 'Only when someone @mentions you' },
                { value: 'off', label: 'Off', desc: 'No in-app notifications' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings({ ...settings, inApp: option.value })}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    settings.inApp === option.value
                      ? 'bg-purple-500/20 border-purple-500 text-white'
                      : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{option.desc}</p>
                    </div>
                    {settings.inApp === option.value && (
                      <Check className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Email Notifications */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold">Email Notifications</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Receive notifications via email
            </p>
            
            <div className="space-y-3">
              {[
                { value: 'instant', label: 'Instant', desc: 'Get emails immediately' },
                { value: 'digest', label: 'Daily digest', desc: 'One email per day with all updates' },
                { value: 'off', label: 'Off', desc: 'No email notifications' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings({ ...settings, email: option.value })}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    settings.email === option.value
                      ? 'bg-purple-500/20 border-purple-500 text-white'
                      : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{option.desc}</p>
                    </div>
                    {settings.email === option.value && (
                      <Check className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold">SMS Notifications</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Critical notifications via text message
            </p>

            {/* Phone Number Input */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Phone Number</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {phoneVerified && (
                  <div className="px-4 py-3 bg-emerald-500/20 border border-emerald-500 rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400">Verified</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                { value: 'urgent', label: 'Urgent only', desc: 'Critical notifications and mentions' },
                { value: 'off', label: 'Off', desc: 'No SMS notifications' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings({ ...settings, sms: option.value })}
                  disabled={!phoneNumber && option.value !== 'off'}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    settings.sms === option.value
                      ? 'bg-purple-500/20 border-purple-500 text-white'
                      : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{option.desc}</p>
                    </div>
                    {settings.sms === option.value && (
                      <Check className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Moon className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold">Quiet Hours</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Pause non-urgent notifications during specific hours
            </p>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.quietHours.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, enabled: e.target.checked }
                  })}
                  className="w-5 h-5 rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium">Enable quiet hours</span>
              </label>

              {settings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Start time</label>
                    <input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={(e) => setSettings({
                        ...settings,
                        quietHours: { ...settings.quietHours, start: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">End time</label>
                    <input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={(e) => setSettings({
                        ...settings,
                        quietHours: { ...settings.quietHours, end: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
