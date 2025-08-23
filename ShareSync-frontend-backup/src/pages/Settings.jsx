// /src/pages/Settings.jsx
import React, { useEffect, useRef, useState } from 'react';
import { getMe, updateProfile, updateNotifications } from '../api/user';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  // form state
  const [publicProfile, setPublicProfile] = useState(true);
  const [theme, setTheme] = useState('system'); // 'light' | 'dark' | 'system'
  const [emailActivity, setEmailActivity] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [twoFA, setTwoFA] = useState(false); // placeholder switch

  // ---- THEME HANDLING (applies instantly) ----
  const mqlRef = useRef(null); // MediaQueryList for system theme listener

  const applyTheme = (mode) => {
    const root = document.documentElement;
    const setDark = (isDark) => {
      root.classList.toggle('dark', isDark);
      // optional: expose current theme for CSS/use
      root.dataset.theme = isDark ? 'dark' : 'light';
    };

    // Clean up any existing system listener
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
    // system
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    const sync = () => setDark(Boolean(mql?.matches));
    if (mql) {
      sync();
      const handler = () => sync();
      mql.addEventListener?.('change', handler);
      mql._handler = handler;
      mqlRef.current = mql;
    } else {
      // fallback: default light
      setDark(false);
    }
    localStorage.setItem('ss.theme', 'system');
  };

  // hydrate
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    getMe()
      .then((me) => {
        if (ignore) return;
        setPublicProfile(Boolean(me?.publicProfile ?? true));
        const initialTheme = me?.appearance?.theme ?? localStorage.getItem('ss.theme') ?? 'system';
        setTheme(initialTheme);
        applyTheme(initialTheme);

        const n = me?.notifications || {};
        setEmailActivity(Boolean(n.emailActivity ?? true));
        setEmailDigest(Boolean(n.emailDigest ?? true));
        setTwoFA(Boolean(me?.security?.twoFA ?? false));
      })
      .catch((e) => !ignore && setErr(String(e?.message || e)))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  // apply theme as soon as user changes the select (don’t wait for save)
  useEffect(() => {
    // avoid running before first hydrate finished? It’s fine—applyTheme is idempotent.
    try { applyTheme(theme); } catch {}
    // cleanup listener on unmount
    return () => {
      if (mqlRef.current?.removeEventListener) {
        mqlRef.current.removeEventListener('change', mqlRef.current._handler);
        mqlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setErr('');
    setOk('');
    setSaving(true);
    try {
      // 1) profile-ish settings
      await updateProfile({
        publicProfile,
        appearance: { theme },
      });

      // 2) notifications
      await updateNotifications({
        emailActivity,
        emailDigest,
      });

      setOk('Settings saved.');
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
      // tiny auto-clear for success
      setTimeout(() => setOk(''), 1800);
    }
  };

  if (loading) {
    return (
      <main id="main" role="main" tabIndex={-1}>
        <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto">
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
      <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>

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
          {/* Profile visibility */}
          <section className="rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Profile visibility</h2>
            <p className="text-xs text-slate-500 mt-1">
              Control whether your profile is visible at <code>/u/:username</code>.
            </p>

            <div className="mt-3 flex items-center gap-3">
              <input
                id="publicProfile"
                type="checkbox"
                className="h-4 w-4"
                checked={publicProfile}
                onChange={(e) => setPublicProfile(e.target.checked)}
              />
              <label htmlFor="publicProfile" className="text-sm text-slate-800 dark:text-slate-200">
                Public profile
              </label>
            </div>
          </section>

          {/* Appearance */}
          <section className="rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
            <p className="text-xs text-slate-500 mt-1">
              Choose your display theme. “System” follows your OS preference.
            </p>

            <div className="mt-3 flex items-center gap-3">
              <label htmlFor="theme" className="text-sm text-slate-700 dark:text-slate-300">
                Theme
              </label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </section>

          {/* Notifications */}
          <section className="rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h2>
            <div className="mt-3 space-y-3">
              <Toggle
                id="emailActivity"
                label="Email me for important activity"
                checked={emailActivity}
                onChange={setEmailActivity}
              />
              <Toggle
                id="emailDigest"
                label="Weekly email digest"
                checked={emailDigest}
                onChange={setEmailDigest}
              />
            </div>
          </section>

          {/* Account Security (placeholder 2FA switch) */}
          <section className="rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Account Security</h2>
            <p className="text-xs text-slate-500 mt-1">
              Two-factor auth setup is a separate flow; enable here to be prompted next sign-in.
            </p>
            <div className="mt-3">
              <Toggle
                id="twoFA"
                label="Require two-factor authentication"
                checked={twoFA}
                onChange={setTwoFA}
              />
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <span className="text-xs text-slate-500">Keyboard: Tab through controls; Enter to submit.</span>
          </div>
        </form>
      </div>
    </main>
  );
}

function Toggle({ id, label, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm text-slate-800 dark:text-slate-200">{label}</span>
    </label>
  );
}