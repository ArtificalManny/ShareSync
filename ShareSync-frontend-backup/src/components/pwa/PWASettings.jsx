import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Download, Check, Smartphone } from 'lucide-react';
import { 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  isSubscribedToPushNotifications 
} from '../../utils/pushNotifications';
import { toast } from '../ui/toast';

const PWASettings = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if PWA is installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsInstalled(isStandalone);
    };

    // Check push notification status
    const checkPushStatus = async () => {
      const subscribed = await isSubscribedToPushNotifications();
      setIsPushEnabled(subscribed);
    };

    checkInstalled();
    checkPushStatus();
  }, []);

  const handleTogglePush = async () => {
    try {
      setLoading(true);
      
      if (isPushEnabled) {
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          setIsPushEnabled(false);
          toast({ title: 'Push notifications disabled', variant: 'success' });
        }
      } else {
        const subscription = await subscribeToPushNotifications();
        if (subscription) {
          setIsPushEnabled(true);
          toast({ title: 'Push notifications enabled! 🔔', variant: 'success' });
        } else {
          toast({ title: 'Failed to enable push notifications', variant: 'error' });
        }
      }
    } catch (error) {
      toast({ title: 'Failed to update notification settings', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">App Settings</h2>
        <p className="text-slate-400 text-sm">Manage your OpenShare app experience</p>
      </div>

      {/* Installation Status */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isInstalled 
              ? 'bg-emerald-500/20 border border-emerald-500' 
              : 'bg-slate-700/50 border border-slate-600'
          }`}>
            {isInstalled ? (
              <Check className="w-6 h-6 text-emerald-400" />
            ) : (
              <Download className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">
              {isInstalled ? 'App Installed' : 'Install App'}
            </h3>
            <p className="text-sm text-slate-400">
              {isInstalled 
                ? 'OpenShare is installed on your device' 
                : 'Install OpenShare for the best experience'}
            </p>
          </div>
          {!isInstalled && (
            <Smartphone className="w-5 h-5 text-purple-400" />
          )}
        </div>
      </div>

      {/* Push Notifications Toggle */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isPushEnabled 
                ? 'bg-purple-500/20 border border-purple-500' 
                : 'bg-slate-700/50 border border-slate-600'
            }`}>
              {isPushEnabled ? (
                <Bell className="w-6 h-6 text-purple-400" />
              ) : (
                <BellOff className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Push Notifications</h3>
              <p className="text-sm text-slate-400">
                Get notified about important updates
              </p>
            </div>
          </div>

          <button
            onClick={handleTogglePush}
            disabled={loading}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors disabled:opacity-50 ${
              isPushEnabled ? 'bg-purple-600' : 'bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                isPushEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {isPushEnabled && (
          <div className="pt-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-400">
              ✅ You'll receive push notifications for:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-500">
              <li>• New announcements</li>
              <li>• @mentions in comments</li>
              <li>• Task assignments</li>
              <li>• Deadline reminders</li>
            </ul>
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4">About This App</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Version</span>
            <span className="text-white font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Cache Size</span>
            <span className="text-white font-medium">~5 MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Offline Support</span>
            <span className="text-emerald-400 font-medium">Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWASettings;
