// src/pages/Settings.jsx
import React, { useEffect, useRef, useState } from 'react';
import { getMe, updateProfile, updateNotifications } from '../api/user';
import SectionHeader from '../components/ui/SectionHeader';
import { toast } from '../components/ui/Toaster.jsx';
import { trackMentorSettings, trackProfileDiscoverToggle } from '../utils/telemetry';
import { DISCOVERABILITY } from '../config/flags.js';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const [publicProfile, setPublicProfile] = useState(true);
  const [discoverable, setDiscoverable] = useState(false);
  const [theme, setTheme] = useState('system');
  const [emailActivity, setEmailActivity] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  const [allowShareLinks, setAllowShareLinks] = useState(false);
  const [allowFollow, setAllowFollow] = useState(false);

  const [mentorEnabled, setMentorEnabled] = useState(true);
  const [mentorIntensity, setMentorIntensity] = useState('standard');

  const mqlRef = useRef(null);

  const applyTheme = (mode) => {
    const root = document.documentElement;
    const setDark = (isDark) => {
      root.classList.toggle('dark', isDark);
      root.dataset.theme = isDark ? 'dark' : 'light';
    };

    if (mqlRef.current?.removeEventListener) {
      mqlRef.current.removeEventListener('change', mqlRef.current._handler);
      mqlRef.current = null;
    }

    if (mode === 'dark') {
      setDark(true);
      localStorage.setItem('ss.theme', 'dark');
      return;
    }
    if (mode === 'light') {
      setDark(false);
      localStorage.setItem('ss.theme', 'light');
      return;
    }

    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    const sync = () => setDark(Boolean(mql?.matches));
    if (mql) {
      sync();
      const handler = () => sync();
      mql.addEventListener?.('change', handler);
      mql._handler = handler;
      mqlRef.current = mql;
    } else {
      setDark(false);
    }
    localStorage.setItem('ss.theme', 'system');
  };

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    getMe()
      .then((me) => {
        if (ignore) return;
        setPublicProfile(Boolean(me?.publicProfile ?? true));
        setDiscoverable(Boolean(me?.discoverable ?? false));
        const initialTheme = me?.appearance?.theme ?? localStorage.getItem('ss.theme') ?? 'system';
        setTheme(initialTheme);
        applyTheme(initialTheme);

        const n = me?.notifications || {};
        setEmailActivity(Boolean(n.emailActivity ?? true));
        setEmailDigest(Boolean(n.emailDigest ?? true));
        setTwoFA(Boolean(me?.security?.twoFA ?? false));

        const sharing = me?.sharing || {};
        setAllowShareLinks(Boolean(sharing.links ?? false));
        setAllowFollow(Boolean(sharing.follow ?? false));

        const mentor = me?.mentor || me?.preferences?.mentor || {};
        const lsEnabled = localStorage.getItem('ss.mentor.enabled');
        const lsIntensity = localStorage.getItem('ss.mentor.intensity');
        setMentorEnabled(
          typeof mentor.enabled === 'boolean'
            ? mentor.enabled
            : lsEnabled != null
              ? lsEnabled === 'true'
              : true
        );
        setMentorIntensity(
          mentor.intensity === 'light' || mentor.intensity === 'standard'
            ? mentor.intensity
            : (lsIntensity === 'light' ? 'light' : 'standard')
        );
      })
      .catch((e) => !ignore && setErr(String(e?.message || e)))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    try { applyTheme(theme); } catch {}
    return () => {
      if (mqlRef.current?.removeEventListener) {
        mqlRef.current.removeEventListener('change', mqlRef.current._handler);
        mqlRef.current = null;
      }
    };
  }, [theme]);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setErr('');
    setOk('');
    setSaving(true);
    try {
      await updateProfile({
        publicProfile,
        discoverable: Boolean(discoverable),
        appearance: { theme },
        sharing: {
          links: allowShareLinks,
          follow: allowFollow,
        },
        mentor: {
          enabled: Boolean(mentorEnabled),
          intensity: mentorIntensity === 'light' ? 'light' : 'standard',
        },
        security: {
          twoFA,
        },
      });

      try {
        localStorage.setItem('ss.mentor.enabled', String(Boolean(mentorEnabled)));
        localStorage.setItem('ss.mentor.intensity', mentorIntensity === 'light' ? 'light' : 'standard');
      } catch {}

      await updateNotifications({
        emailActivity,
        emailDigest,
      });

      if (DISCOVERABILITY) {
        trackProfileDiscoverToggle({ on: Boolean(discoverable), source: 'settings_save'});
      }

      setOk('Settings saved.');
      trackMentorSettings({
        enabled: Boolean(mentorEnabled),
        intensity: mentorIntensity,
        source: 'settings_save',
      });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
      setTimeout(() => setOk(''), 1800);
    }
  };

  const handleResetMentorTips = () => {
    let removed = 0;
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('ss.mentor.') || k.startsWith('mentor.'))) keys.push(k);
      }
      keys.forEach((k) => {
        localStorage.removeItem(k);
        removed++;
      });
      localStorage.setItem('ss.mentor.resetAt', String(Date.now()));
    } catch {}
    toast({ title: 'Mentor tips reset', description: removed ? `Cleared ${removed} cached items.` : undefined });
    trackMentorSettings({ action: 'reset_tips', removed, source: 'settings_button' });
  };

  if (loading) {
    return (
      <main id="main" role="main" tabIndex={-1}>
        <div className="with-sidebar px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-1/3 bg-slate-200/60 rounded" />
            <div className="h-24 bg-slate-200/60 rounded" />
            <div className="h-24 bg-slate-200/60 rounded" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main" role="main" tabIndex={-1}>
      <div className="with-sidebar px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto space-y-6">
        <h1 className="h-hero">Settings</h1>
        <p className="h-sub mt-1">Preferences, notifications, and account.</p>

        {err && (
          <div
            role="status"
            aria-live="assertive"
            className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2"
          >
            {err}
          </div>
        )}
        {ok && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2"
          >
            {ok}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Theme */}
          <div className="card glass p-6">
            <h2 className="text-lg font-semibold mb-4">Theme</h2>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* AI Preferences */}
          <div className="card glass p-6">
            <h2 className="text-lg font-semibold mb-4">AI Preferences</h2>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={mentorEnabled}
                onChange={(e) => setMentorEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Enable AI Mentor</span>
            </label>
            <div className="mt-3">
              <label className="block text-sm mb-1">Intensity</label>
              <select
                value={mentorIntensity}
                onChange={(e) => setMentorIntensity(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <option value="light">Light</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>

          {/* Privacy */}
          <div className="card glass p-6">
            <h2 className="text-lg font-semibold mb-4">Privacy</h2>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={publicProfile}
                onChange={(e) => setPublicProfile(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Public Profile</span>
            </label>
            <label className="flex items-center gap-3 mt-3">
              <input
                type="checkbox"
                checked={discoverable}
                onChange={(e) => setDiscoverable(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Discoverable in Search</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn--primary w-full"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </main>
  );
}