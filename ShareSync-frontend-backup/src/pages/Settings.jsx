// src/pages/Settings.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC SETTINGS PAGE v4.1 - Light Theme & Dark Mode Adapted
// ═══════════════════════════════════════════════════════════════════════════════
//
// THEME: "The Control Room" (Adaptive Light/Dark)
//
// NO BACKEND CHANGES. LOGIC PRESERVED EXACTLY.
// ADDED: BillingSettings integration.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
import { getMe, updateProfile, updateNotifications } from '../api/user';
import { toast } from '../components/ui/Toaster.jsx';
import { trackMentorSettings, trackProfileDiscoverToggle } from '../utils/telemetry';
import { DISCOVERABILITY } from '../config/flags.js';
import {
  Beaker,
  Target, Brain, Users as UsersIcon, Shield, Heart, Sparkles,
  Play, Zap, Clock, Film, Star, Moon, Sun, Eye, Settings as SettingsIcon,
  AlertTriangle, Trash2, CreditCard
} from 'lucide-react';
import PresenceSettings from '../components/settings/PresenceSettings';
import ExperimentHistory from "../components/settings/ExperimentHistory";
import WhatWorksAnalyzer from "../components/settings/WhatWorksAnalyzer";
import PrivacyCard from "../components/settings/PrivacyCard";
import BillingSettings from "../components/settings/BillingSettings";

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
                : 'border-slate-200 dark:border-[#1f1f23] bg-slate-50 dark:bg-[#09090B] hover:border-violet-300 dark:hover:border-violet-500/30 hover:bg-slate-100 dark:hover:bg-[#111113]'
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
          ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20' 
          : 'bg-white dark:bg-[#111113] border-slate-200 dark:border-[#1f1f23] shadow-sm dark:shadow-none'
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

  // LAYER 5: Distraction Shield
  const [blockedApps, setBlockedApps] = useState(['slack', 'youtube', 'tiktok']);
  const [emergencyBreaksLeft, setEmergencyBreaksLeft] = useState(1);

  // LAYER 6: Legacy Mode
  const [showLegacyEverywhere, setShowLegacyEverywhere] = useState(true);
  const [yearlyMontage, setYearlyMontage] = useState(false);

  // LAYER 7: Kid Mode / Pro Mode
  const [userMode, setUserMode] = useState('pro');

  // Existing settings
  const [theme, setTheme] = useState('system');
  const [emailActivity, setEmailActivity] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  const mqlRef = useRef(null);

  const applyTheme = (mode) => {
    const root = document.documentElement;

    const setDark = (isDark) => {
      root.classList.toggle('dark', isDark);
      root.dataset.theme = isDark ? 'dark' : 'light';
    };

    if (mqlRef.current?.removeEventListener && mqlRef.current?._handler) {
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

    // System mode
    setDark(false);
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

        const initialTheme = me?.appearance?.theme ?? localStorage.getItem('ss.theme') ?? 'dark'; // default to dark now

        setTheme(initialTheme);
        applyTheme(initialTheme);

        const n = me?.notifications || {};
        setEmailActivity(Boolean(n.emailActivity ?? true));
        setEmailDigest(Boolean(n.emailDigest ?? true));
        setTwoFA(Boolean(me?.security?.twoFA ?? false));

        const mentor = me?.mentor || me?.preferences?.mentor || {};
        setMentorEnabled(Boolean(mentor.enabled ?? true));
        setMentorTone(mentor.tone || 'wise');
        setMentorIntensity(mentor.intensity || 3);

        const momentum = me?.momentum || {};
        setDailyShipsGoal(momentum.dailyGoal || 5);
        setWeekendShipsCount(Boolean(momentum.weekendCount ?? true));
        setAllowStreakFreeze(Boolean(momentum.allowFreeze ?? true));

        const focus = me?.focus || {};
        setDeepWorkTarget(focus.dailyTarget || 4);
        setAutoStartFocus(Boolean(focus.autoStart ?? false));
        setFocusStartTime(focus.startTime || '09:00');

        setShowStreakTo(me?.social?.showStreakTo || 'friends');
        setCelebratePublicly(Boolean(me?.social?.celebrate ?? true));

        setShowLegacyEverywhere(Boolean(me?.legacy?.showEverywhere ?? true));
        setYearlyMontage(Boolean(me?.legacy?.yearlyVideo ?? false));

        setUserMode(me?.appearance?.mode || 'pro');
      })
      .catch((e) => !ignore && setErrorMsg(String(e?.message || e)))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setErrorMsg('');
    setOk('');
    setSaving(true);

    try {
      await updateProfile({
        publicProfile,
        discoverable: Boolean(discoverable),
        appearance: { theme, mode: userMode },
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
        },
        social: {
          showStreakTo,
          celebrate: celebratePublicly,
        },
        legacy: {
          showEverywhere: showLegacyEverywhere,
          yearlyVideo: yearlyMontage,
        },
        security: { twoFA },
      });

      await updateNotifications({
        emailActivity,
        emailDigest,
      });

      setOk('Settings saved successfully! 🎉');
      trackMentorSettings({
        enabled: Boolean(mentorEnabled),
        tone: mentorTone,
        intensity: mentorIntensity,
        source: 'settings_save',
      });
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
      setTimeout(() => setOk(''), 3000);
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
    <main className="min-h-screen px-6 py-12 bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-white transition-colors duration-300">
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
              className="w-full text-slate-800 dark:text-white px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 border border-slate-200 dark:border-[#1f1f23] bg-slate-50 dark:bg-[#09090B] hover:bg-slate-100 dark:hover:bg-[#1f1f23]"
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
                    : 'border-slate-200 dark:border-[#1f1f23] bg-slate-50 dark:bg-[#09090B] hover:border-violet-300 dark:hover:border-violet-500/30'
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
                    : 'border-slate-200 dark:border-[#1f1f23] bg-slate-50 dark:bg-[#09090B] hover:border-blue-300 dark:hover:border-blue-500/30'
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

          {/* Appearance */}
          <SectionCard 
            icon={SettingsIcon} 
            iconBg="bg-slate-200 dark:bg-zinc-800" 
            iconColor="text-slate-600 dark:text-zinc-300" 
            title="Appearance"
          >
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2 block">Theme</label>
              <select
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value);
                  applyTheme(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-[#1f1f23] bg-white dark:bg-[#09090B] px-4 py-3 text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
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
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-white dark:bg-[#09090B] border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium shadow-sm dark:shadow-none"
                onClick={() => toast({ title: 'Export started', description: 'Your data will be emailed to you.' })}
              >
                Export all my data
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors font-medium"
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
