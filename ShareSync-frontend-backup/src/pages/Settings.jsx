// src/pages/Settings.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC SETTINGS PAGE v4.2 - Wired to /api/settings
// ═══════════════════════════════════════════════════════════════════════════════
//
// THEME: "The Control Room" (Adaptive Light/Dark)
//
// CHANGES in v4.2:
// - Switched from getMe()/updateProfile()/updateNotifications
//   to dedicated Settings API (GET/PUT /settings).
// - Maps Nest Settings schema to existing React state.
// - Keeps ALL UI + layout identical.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
// OLD: import { getMe, updateProfile, updateNotifications } from '../api/user';
import { getSettings, updateSettings } from '../api/settings';
import { toast } from '../components/ui/Toaster.jsx';
import { trackMentorSettings, trackProfileDiscoverToggle } from '../utils/telemetry';
import { DISCOVERABILITY } from '../config/flags.js';
import {
  Beaker,
  Target, Brain, Users as UsersIcon, Shield, Heart, Sparkles,
  Play, Zap, Clock, Film, Star, Moon, Sun, Eye, Settings as SettingsIcon,
  AlertTriangle, Trash2, CreditCard, Phone, CheckCircle
} from 'lucide-react';
import PresenceSettings from '../components/settings/PresenceSettings';
import ExperimentHistory from "../components/settings/ExperimentHistory";
import WhatWorksAnalyzer from "../components/settings/WhatWorksAnalyzer";
import PrivacyCard from "../components/settings/PrivacyCard";
import BillingSettings from "../components/settings/BillingSettings";
import PersonaPicker from "../components/settings/PersonaPicker";
import CelebrationStylePicker from "../components/settings/CelebrationStylePicker";
import useDocumentTitle from "../hooks/useDocumentTitle";

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDER COMPONENT - Adaptive
// ═══════════════════════════════════════════════════════════════════════════════
function Slider({ label, value, onChange, min = 0, max = 10, unit = '', icon: Icon }) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-violet-500 dark:text-violet-400" />}
          <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">{label}</label>
        </div>
        <span className="text-lg font-bold text-slate-900 dark:text-white">
          {value}{unit}
        </span>
      </div>

      <div className="relative">
        <div className="h-3 rounded-full bg-slate-200 dark:bg-[#1f1f23] overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, #7C3AED 0%, #3B82F6 50%, #06B6D4 100%)'
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-500">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOGGLE COMPONENT - Adaptive
// ═══════════════════════════════════════════════════════════════════════════════
function Toggle({ label, checked, onChange, description }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        {/* Toggle track */}
        <div
          className={`w-11 h-6 rounded-full transition-all border ${checked ? 'border-transparent' : 'border-slate-300 dark:border-[#27272a] bg-slate-200 dark:bg-[#1f1f23]'}`}
          style={{
            background: checked ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' : undefined
          }}
        />
        {/* Toggle thumb */}
        <div
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all"
          style={{ left: checked ? '24px' : '4px' }}
        />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {label}
        </div>
        {description && (
          <div className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">{description}</div>
        )}
      </div>
    </label>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RADIO GROUP COMPONENT - Adaptive
// ═══════════════════════════════════════════════════════════════════════════════
function RadioGroup({ label, options, value, onChange, icon: Icon }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-violet-500 dark:text-violet-400" />}
        <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">{label}</label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`px-4 py-3 rounded-xl border transition-all text-left ${
              value === option.value
                ? 'border-violet-500/50 bg-violet-50 dark:bg-violet-500/10'
                : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-violet-300 dark:hover:border-violet-500/30 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            <div className={`text-sm font-medium ${value === option.value ? 'text-violet-800 dark:text-white' : 'text-slate-800 dark:text-white'}`}>
              {option.label}
            </div>
            {option.description && (
              <div className="text-xs text-slate-500 dark:text-zinc-500 mt-1">{option.description}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION CARD COMPONENT - Adaptive
// ═══════════════════════════════════════════════════════════════════════════════
function SectionCard({ icon: Icon, iconBg, iconColor, title, children, danger = false }) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        danger
          ? 'bg-red-50/90 dark:bg-[#1A0B0D] border-red-200/90 dark:border-red-500/25 shadow-sm dark:shadow-[0_18px_50px_rgba(127,29,29,0.18)]'
          : 'bg-white/95 dark:bg-[#121216] border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-[0_18px_55px_rgba(0,0,0,0.25)]'
      }`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h2 className={`text-xl font-bold ${danger ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
          {title}
        </h2>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function Settings() {
  useDocumentTitle("Settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ok, setOk] = useState('');

  // LAYER 1: Momentum Engine
  const [dailyShipsGoal, setDailyShipsGoal] = useState(5);
  const [weekendShipsCount, setWeekendShipsCount] = useState(true);
  const [allowStreakFreeze, setAllowStreakFreeze] = useState(true);

  // LAYER 2: Focus DNA
  const [deepWorkTarget, setDeepWorkTarget] = useState(4);
  const [autoStartFocus, setAutoStartFocus] = useState(false);
  const [focusStartTime, setFocusStartTime] = useState('09:00');

  // LAYER 3: Social Proof
  const [showStreakTo, setShowStreakTo] = useState('friends');
  const [celebratePublicly, setCelebratePublicly] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [discoverable, setDiscoverable] = useState(false);

  // LAYER 4: AI Mentor Personality
  const [mentorEnabled, setMentorEnabled] = useState(true);
  const [mentorTone, setMentorTone] = useState('wise');
  const [mentorIntensity, setMentorIntensity] = useState(3);

  // LAYER 5: Distraction Shield (stored in focus in backend)
  const [blockedApps, setBlockedApps] = useState(['slack', 'youtube', 'tiktok']);
  const [emergencyBreaksLeft, setEmergencyBreaksLeft] = useState(1);

  // LAYER 6: Legacy Mode
  const [showLegacyEverywhere, setShowLegacyEverywhere] = useState(true);
  const [yearlyMontage, setYearlyMontage] = useState(false);

  // LAYER 7: Kid Mode / Pro Mode
  const [userMode, setUserMode] = useState('pro');

  // Existing settings
  const [theme, setTheme] = useState('system');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPowerUser, setShowPowerUser] = useState(false);
  const [emailActivity, setEmailActivity] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  // ✅ PHONE VERIFICATION STATE (Item 13)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneStatus, setPhoneStatus] = useState('idle'); // 'idle' | 'pending' | 'verified'
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const otpRefs = useRef([]);

  const mqlRef = useRef(null);

  // SETTINGS THEME HYDRATION FIX
  // Settings.jsx should display the actual user-selected theme, not a stale
  // backend fallback. The local theme is the immediate source of truth because
  // applyTheme() writes it as soon as the user changes the dropdown.
  const normalizeThemeMode = (value, fallback = 'system') => {
    return value === 'light' || value === 'dark' || value === 'system'
      ? value
      : fallback;
  };

  const readSavedThemePreference = () => {
    if (typeof window === 'undefined') return null;
    return normalizeThemeMode(window.localStorage.getItem('ss.theme'), null);
  };

  const readResolvedDocumentTheme = () => {
    if (typeof document === 'undefined') return null;

    const root = document.documentElement;

    if (root.dataset.theme === 'dark' || root.classList.contains('dark')) {
      return 'dark';
    }

    if (root.dataset.theme === 'light') {
      return 'light';
    }

    return null;
  };

  const applyTheme = (mode) => {
    const root = document.documentElement;
    const media = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

    const applyResolvedTheme = (nextMode) => {
      const isDark =
        nextMode === "dark" ||
        (nextMode === "system" && Boolean(media?.matches));

      root.classList.toggle("dark", isDark);
      root.dataset.theme = isDark ? "dark" : "light";
      document.body.style.backgroundColor = isDark ? "#09090B" : "#F8FAFC";
    };

    if (mqlRef.current?.removeEventListener && mqlRef.current?._handler) {
      mqlRef.current.removeEventListener("change", mqlRef.current._handler);
      mqlRef.current = null;
    } else if (mqlRef.current?.removeListener && mqlRef.current?._handler) {
      mqlRef.current.removeListener(mqlRef.current._handler);
      mqlRef.current = null;
    }

    if (mode === "system" && media) {
      const handler = () => applyResolvedTheme("system");

      if (media.addEventListener) {
        media.addEventListener("change", handler);
      } else if (media.addListener) {
        media.addListener(handler);
      }

      media._handler = handler;
      mqlRef.current = media;
    }

    localStorage.setItem("ss.theme", mode);
    applyResolvedTheme(mode);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD SETTINGS FROM /api/settings
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    let ignore = false;
    setLoading(true);

    getSettings()
      .then((settings) => {
        if (ignore || !settings) return;

        // Momentum
        const momentum = settings.momentum || {};
        setDailyShipsGoal(momentum.dailyGoal ?? 5);
        setWeekendShipsCount(
          momentum.weekendCount !== undefined ? Boolean(momentum.weekendCount) : true
        );
        setAllowStreakFreeze(
          momentum.allowFreeze !== undefined ? Boolean(momentum.allowFreeze) : true
        );

        // Focus
        const focus = settings.focus || {};
        setDeepWorkTarget(focus.dailyTarget ?? 4);
        setAutoStartFocus(Boolean(focus.autoStart ?? false));
        setFocusStartTime(focus.startTime || '09:00');

        // Distraction shield bits (live under focus in schema)
        setBlockedApps(Array.isArray(focus.blockedApps) ? focus.blockedApps : ['slack', 'youtube', 'tiktok']);
        setEmergencyBreaksLeft(focus.emergencyBreaksLeft ?? 1);

        // Social
        const social = settings.social || {};
        setShowStreakTo(social.showStreakTo || 'friends');
        setCelebratePublicly(Boolean(social.celebrate ?? true));

        const resolvedPublicProfile =
          social.publicProfile ??
          settings.publicProfile ??
          true;
        const resolvedDiscoverable =
          social.discoverable ??
          settings.discoverable ??
          false;

        setPublicProfile(Boolean(resolvedPublicProfile));
        setDiscoverable(Boolean(resolvedDiscoverable));

        // Mentor
        const mentor = settings.mentor || {};
        setMentorEnabled(Boolean(mentor.enabled ?? true));
        setMentorTone(mentor.tone || 'wise');
        setMentorIntensity(mentor.intensity ?? 3);

        // Legacy
        const legacy = settings.legacy || {};
        setShowLegacyEverywhere(Boolean(legacy.showEverywhere ?? true));
        setYearlyMontage(Boolean(legacy.yearlyVideo ?? false));

        // Appearance
        const appearance = settings.appearance || {};

        // Theme hydration priority:
        // 1. Local immediate user choice from applyTheme()
        // 2. Backend saved setting
        // 3. Current DOM-resolved theme
        // 4. System fallback
        const storedTheme = readSavedThemePreference();
        const backendTheme = normalizeThemeMode(appearance.theme, null);
        const documentTheme = readResolvedDocumentTheme();
        const initialTheme =
          storedTheme ||
          backendTheme ||
          documentTheme ||
          'system';

        setTheme(initialTheme);
        setUserMode(appearance.mode || 'pro');
        applyTheme(initialTheme);

        // Notifications
        const notifications = settings.notifications || {};
        setEmailActivity(Boolean(notifications.emailActivity ?? true));
        setEmailDigest(Boolean(notifications.emailDigest ?? true));

        // Security
        const security = settings.security || {};
        setTwoFA(Boolean(security.twoFA ?? false));
      })
      .catch((e) => {
        if (ignore) return;
        // Prefer backend message if present
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          'Failed to load settings';
        setErrorMsg(String(msg));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE SETTINGS -> PUT /api/settings
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSave = async (e) => {
    e?.preventDefault?.();
    setErrorMsg('');
    setOk('');
    setSaving(true);

    try {
      const payload = {
        // legacy flat fields for backward compatibility
        publicProfile,
        discoverable: Boolean(discoverable),

        appearance: {
          theme,
          mode: userMode,
        },
        mentor: {
          enabled: Boolean(mentorEnabled),
          tone: mentorTone,
          intensity: mentorIntensity,
        },
        momentum: {
          dailyGoal: dailyShipsGoal,
          weekendCount: weekendShipsCount,
          allowFreeze: allowStreakFreeze,
        },
        focus: {
          dailyTarget: deepWorkTarget,
          autoStart: autoStartFocus,
          startTime: focusStartTime,
          blockedApps,
          emergencyBreaksLeft,
        },
        social: {
          showStreakTo,
          celebrate: celebratePublicly,
          publicProfile,
          discoverable: Boolean(discoverable),
        },
        legacy: {
          showEverywhere: showLegacyEverywhere,
          yearlyVideo: yearlyMontage,
        },
        notifications: {
          emailActivity,
          emailDigest,
        },
        security: {
          twoFA,
        },
      };

      await updateSettings(payload);

      setOk('Settings saved successfully! 🎉');
      trackMentorSettings({
        enabled: Boolean(mentorEnabled),
        tone: mentorTone,
        intensity: mentorIntensity,
        source: 'settings_save',
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Failed to save settings';
      setErrorMsg(String(msg));
    } finally {
      setSaving(false);
      setTimeout(() => setOk(''), 3000);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ PHONE VERIFICATION HANDLERS (Item 13)
  // ═══════════════════════════════════════════════════════════════════════════

  const handleRequestPhoneCode = async () => {
    if (!phoneNumber.trim()) {
      toast({ title: "Phone number required", variant: "error" });
      return;
    }
    setPhoneLoading(true);
    setErrorMsg('');
    try {
      const { sendPhoneVerificationCode } = await import('../api/users');
      await sendPhoneVerificationCode(phoneNumber);
      setPhoneStatus('pending');
      toast({ title: "Code sent!", description: "Check your messages.", variant: "success" });
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "Failed to send verification code.";
      toast({ title: "Verification Failed", description: msg, variant: "error" });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.substring(value.length - 1);
    setOtpCode(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyPhoneCode = async () => {
    const code = otpCode.join('');
    if (code.length < 6) return;
    setPhoneLoading(true);
    try {
      const { verifyPhoneCode } = await import('../api/users');
      await verifyPhoneCode(code);
      setPhoneStatus('verified');
      toast({ title: "Phone verified successfully!", variant: "success" });
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "Invalid code.";
      toast({ title: "Verification Failed", description: msg, variant: "error" });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleGenerateYearMontage = () => {
    toast({
      title: 'Year in Ships video coming soon!',
      description: 'This will generate a cinematic montage of everything you shipped this year.'
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#09090B]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 dark:text-zinc-400">Loading your preferences...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="settings-page-surface min-h-screen px-6 py-12 text-slate-900 transition-colors duration-300 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.08),transparent_30%),linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_50%,#F8FAFC_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_32%),linear-gradient(180deg,#09090B_0%,#0F0F14_48%,#09090B_100%)] dark:text-white">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <SettingsIcon className="w-5 h-5 text-violet-500" />
            <span className="text-xs text-slate-500 dark:text-zinc-500 uppercase tracking-wider">System</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Design Your Momentum
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-lg">Who do you want to become?</p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-6 py-4 text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}
        {ok && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-6 py-4 text-emerald-700 dark:text-emerald-400">
            {ok}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">

          {/* LAYER 1: Momentum Engine */}
          <SectionCard
            icon={Target}
            iconBg="bg-violet-100 dark:bg-violet-500/10"
            iconColor="text-violet-600 dark:text-violet-400"
            title="Momentum Engine"
          >
            <Slider
              label="Daily Ships Goal"
              value={dailyShipsGoal}
              onChange={setDailyShipsGoal}
              min={1}
              max={10}
              icon={Zap}
            />
            <Toggle
              label="Weekend ships count toward streak"
              checked={weekendShipsCount}
              onChange={setWeekendShipsCount}
              description="Keep your streak alive on Saturdays and Sundays"
            />
            <Toggle
              label="Allow 1 Streak Freeze per month"
              checked={allowStreakFreeze}
              onChange={setAllowStreakFreeze}
              description="Life happens. Protect your streak once a month."
            />
          </SectionCard>

          {/* Advanced Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#121216] shadow-sm dark:shadow-[0_18px_55px_rgba(0,0,0,0.22)] hover:bg-slate-50 dark:hover:bg-white/[0.045] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Advanced Settings</h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400">Persona, celebrations, focus, social, AI mentor</p>
              </div>
            </div>
            <span className={`text-sm font-medium text-violet-600 dark:text-violet-400 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
          </button>

          {showAdvanced && (
          <>
          {/* ⭐ Priority 4.1: Persona / Experience Mode */}
          <SectionCard
            icon={Sparkles}
            iconBg="bg-fuchsia-100 dark:bg-fuchsia-500/10"
            iconColor="text-fuchsia-600 dark:text-fuchsia-400"
            title="Experience Persona"
          >
            <div className="picker-settings-wrapper">
              <PersonaPicker />
            </div>
          </SectionCard>

          {/* ⭐ Priority 4.2: Celebration Style */}
          <SectionCard
            icon={Play}
            iconBg="bg-orange-100 dark:bg-orange-500/10"
            iconColor="text-orange-600 dark:text-orange-400"
            title="Celebration Style"
          >
            <div className="picker-settings-wrapper">
              <CelebrationStylePicker />
            </div>
          </SectionCard>

          {/* LAYER 1.5: Daily Pulse Check (Priority 3.4) */}
          <SectionCard
            icon={Heart}
            iconBg="bg-rose-100 dark:bg-rose-500/10"
            iconColor="text-rose-600 dark:text-rose-400"
            title="Daily Pulse Check"
          >
            <Toggle
              label="Enable daily pulse prompt"
              checked={emailActivity}
              onChange={setEmailActivity}
              description="Get a 30-second daily check-in for energy, focus, and blockers (+15 XP)"
            />
            <Toggle
              label="Show burnout alerts"
              checked={emailDigest}
              onChange={setEmailDigest}
              description="Alert you if 3+ consecutive low-energy days are detected"
            />
          </SectionCard>

      

          {/* LAYER 2: Focus DNA */}
          <SectionCard
            icon={Brain}
            iconBg="bg-blue-100 dark:bg-blue-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
            title="Focus DNA"
          >
            <Slider
              label="Deep Work Target"
              value={deepWorkTarget}
              onChange={setDeepWorkTarget}
              min={1}
              max={8}
              unit="h"
              icon={Clock}
            />
            <Toggle
              label="Auto-start Focus Mode at 9:00 AM weekdays"
              checked={autoStartFocus}
              onChange={setAutoStartFocus}
              description="Turn intention into automatic behavior"
            />
          </SectionCard>

          {/* LAYER 3: Social Proof */}
          <SectionCard
            icon={UsersIcon}
            iconBg="bg-cyan-100 dark:bg-cyan-500/10"
            iconColor="text-cyan-600 dark:text-cyan-400"
            title="Social Proof"
          >
            <RadioGroup
              label="Show my streak to"
              options={[
                { value: 'nobody', label: 'Nobody', description: 'Private' },
                { value: 'friends', label: 'Friends', description: 'Shared' },
                { value: 'everyone', label: 'Everyone', description: 'Public' },
              ]}
              value={showStreakTo}
              onChange={setShowStreakTo}
            />
            <Toggle
              label="Celebrate my ships publicly"
              checked={celebratePublicly}
              onChange={setCelebratePublicly}
              description="Let others see when you ship something great"
            />
            <Toggle
              label="Public Profile"
              checked={publicProfile}
              onChange={setPublicProfile}
              description="Allow others to view your profile"
            />
            <Toggle
              label="Share live activity with teammates"
              checked={celebratePublicly}
              onChange={setCelebratePublicly}
              description="Let teammates see when you're shipping in real time (Momentum Contagion)"
            />
          </SectionCard>

          {/* LAYER 4: AI Mentor Personality */}
          <SectionCard
            icon={Sparkles}
            iconBg="bg-amber-100 dark:bg-amber-500/10"
            iconColor="text-amber-600 dark:text-amber-400"
            title="AI Mentor Personality"
          >
            <Toggle
              label="Enable AI Mentor"
              checked={mentorEnabled}
              onChange={setMentorEnabled}
              description="Get real-time coaching and insights"
            />
            {mentorEnabled && (
              <>
                <RadioGroup
                  label="Tone"
                  options={[
                    { value: 'kind', label: 'Kind Coach', description: 'Gentle & supportive' },
                    { value: 'wise', label: 'Wise Sage', description: 'Calm & insightful' },
                    { value: 'drill', label: 'Drill Sergeant', description: 'Direct & tough' },
                  ]}
                  value={mentorTone}
                  onChange={setMentorTone}
                />
                <Slider
                  label="Intensity"
                  value={mentorIntensity}
                  onChange={setMentorIntensity}
                  min={1}
                  max={5}
                />
              </>
            )}
          </SectionCard>

          </>
          )}

          {/* Power User Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowPowerUser(!showPowerUser)}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#121216] shadow-sm dark:shadow-[0_18px_55px_rgba(0,0,0,0.22)] hover:bg-slate-50 dark:hover:bg-white/[0.045] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                <Beaker className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Power User</h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400">Cursor privacy, legacy mode, experiments</p>
              </div>
            </div>
            <span className={`text-sm font-medium text-amber-600 dark:text-amber-400 transition-transform ${showPowerUser ? 'rotate-90' : ''}`}>▶</span>
          </button>

          {showPowerUser && (
          <>
          {/* Cursor Presence Settings */}
          <SectionCard
            icon={Eye}
            iconBg="bg-emerald-100 dark:bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
            title="Live Cursor Privacy"
          >
            <PresenceSettings />
          </SectionCard>

          {/* LAYER 6: Legacy Mode */}
          <SectionCard
            icon={Heart}
            iconBg="bg-pink-100 dark:bg-pink-500/10"
            iconColor="text-pink-600 dark:text-pink-400"
            title="Legacy Mode"
          >
            <Toggle
              label="Show Legacy Counter everywhere"
              checked={showLegacyEverywhere}
              onChange={setShowLegacyEverywhere}
              description="See your lifetime ship count on every page"
            />
            <Toggle
              label="Send me a yearly 'Year in Ships' video"
              checked={yearlyMontage}
              onChange={setYearlyMontage}
              description="Cinematic montage of everything you shipped this year"
            />
            <button
              type="button"
              onClick={handleGenerateYearMontage}
              className="w-full text-slate-800 dark:text-white px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <Film className="w-5 h-5 text-violet-500 dark:text-violet-400" />
              Generate My 2025 Montage
            </button>
          </SectionCard>

          {/* LAYER 7: Experience Mode */}
          <SectionCard
            icon={Star}
            iconBg="bg-indigo-100 dark:bg-indigo-500/10"
            iconColor="text-indigo-600 dark:text-indigo-400"
            title="Experience Mode"
          >
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUserMode('kid')}
                className={`px-6 py-8 rounded-xl border transition-all ${
                  userMode === 'kid'
                    ? 'border-violet-500/50 bg-violet-50 dark:bg-violet-500/10'
                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-violet-300 dark:hover:border-violet-500/30'
                }`}
              >
                <Moon className="w-8 h-8 text-violet-500 dark:text-violet-400 mx-auto mb-3" />
                <div className={`text-lg font-bold ${userMode === 'kid' ? 'text-violet-800 dark:text-white' : 'text-slate-900 dark:text-white'}`}>Kid Mode</div>
                <div className="text-xs text-slate-500 dark:text-zinc-500 mt-2">
                  Bigger rings, confetti, private data
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUserMode('pro')}
                className={`px-6 py-8 rounded-xl border transition-all ${
                  userMode === 'pro'
                    ? 'border-blue-500/50 bg-blue-50 dark:bg-blue-500/10'
                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-blue-300 dark:hover:border-blue-500/30'
                }`}
              >
                <Sun className="w-8 h-8 text-blue-500 dark:text-blue-400 mx-auto mb-3" />
                <div className={`text-lg font-bold ${userMode === 'pro' ? 'text-blue-800 dark:text-white' : 'text-slate-900 dark:text-white'}`}>Pro Mode</div>
                <div className="text-xs text-slate-500 dark:text-zinc-500 mt-2">
                  Minimal, data-heavy, analytics
                </div>
              </button>
            </div>
          </SectionCard>

          {/* PHASE 4: SETTINGS LAB */}
          <SectionCard
            icon={Beaker}
            iconBg="bg-teal-100 dark:bg-teal-500/10"
            iconColor="text-teal-600 dark:text-teal-400"
            title="Settings Lab"
          >
            <ExperimentHistory />
            <WhatWorksAnalyzer />
          </SectionCard>

          </>
          )}

          {/* PHASE 4: PRIVACY TRANSPARENCY */}
          <PrivacyCard />

          {/* SUBSCRIPTION & BILLING */}
          <SectionCard
            icon={CreditCard}
            iconBg="bg-fuchsia-100 dark:bg-fuchsia-500/10"
            iconColor="text-fuchsia-600 dark:text-fuchsia-400"
            title="Subscription & Billing"
          >
            <BillingSettings />
          </SectionCard>

          {/* ✅ PHONE VERIFICATION (Item 13) */}
          <SectionCard
            icon={Phone}
            iconBg="bg-green-100 dark:bg-green-500/10"
            iconColor="text-green-600 dark:text-green-400"
            title="Phone Verification"
          >
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
              Add your phone number for SMS notifications and account security. Your number is never shown publicly.
            </p>

            {phoneStatus === 'verified' ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Phone verified: ***-***-{phoneNumber.slice(-4)}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Phone input + Send Code */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={phoneStatus === 'pending'}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0B0F] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                    />
                  </div>
                  {phoneStatus !== 'pending' && (
                    <button
                      type="button"
                      onClick={handleRequestPhoneCode}
                      disabled={phoneLoading || !phoneNumber.trim()}
                      className="px-5 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-violet-500/50 whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
                    >
                      {phoneLoading ? 'Sending...' : 'Send Code'}
                    </button>
                  )}
                </div>

                {/* OTP input (shown after code sent) */}
                {phoneStatus === 'pending' && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                      Enter the 6-digit code sent to {phoneNumber}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {otpCode.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-12 h-14 text-center text-2xl font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0B0F] text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => { setPhoneStatus('idle'); setOtpCode(['', '', '', '', '', '']); }}
                        className="text-sm text-slate-500 dark:text-zinc-400 hover:text-violet-500 transition-colors"
                      >
                        Change number
                      </button>
                      <button
                        type="button"
                        onClick={handleRequestPhoneCode}
                        disabled={phoneLoading}
                        className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors disabled:opacity-50"
                      >
                        {phoneLoading ? 'Sending...' : 'Resend code'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* Appearance */}
          <SectionCard
            icon={SettingsIcon}
            iconBg="bg-slate-100 dark:bg-white/[0.06]"
            iconColor="text-slate-600 dark:text-zinc-300"
            title="Appearance"
          >
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.08] dark:bg-[#0B0B0F]">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">Theme</label>
              <select
                value={theme}
                onChange={(e) => {
                  const nextTheme = normalizeThemeMode(e.target.value, 'system');
                  setTheme(nextTheme);
                  applyTheme(nextTheme);
                }}
                style={{ colorScheme: theme === "dark" ? "dark" : "light" }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-white/[0.10] dark:bg-[#111116] dark:text-white dark:shadow-none dark:focus:border-violet-400"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </SectionCard>

          {/* DANGER ZONE */}
          <SectionCard
            icon={AlertTriangle}
            iconBg="bg-red-100 dark:bg-red-500/20"
            iconColor="text-red-600 dark:text-red-500"
            title="Danger Zone"
            danger
          >
            <div className="space-y-4">
              <p className="text-sm text-red-600 dark:text-red-400">
                These actions are permanent and cannot be undone.
              </p>
              <button
                type="button"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-[#120B0D] border border-red-200/90 dark:border-red-500/25 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium shadow-sm dark:shadow-none"
                onClick={() => toast({ title: 'Export started', description: 'Your data will be emailed to you.' })}
              >
                Export all my data
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-red-50/90 dark:bg-red-500/10 border border-red-200/90 dark:border-red-500/25 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors font-medium"
                onClick={() => toast({ title: 'Contact support', description: 'Email support@sharesync.io to delete your account.', variant: 'error' })}
              >
                <Trash2 className="w-4 h-4" />
                Delete my account
              </button>
            </div>
          </SectionCard>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full text-white px-8 py-5 rounded-2xl font-bold text-xl transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed border border-violet-500/50"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
          >
            {saving ? 'Saving Your Future...' : 'Save Changes'}
          </button>
        </form>

      </div>
    </main>
  );
}
