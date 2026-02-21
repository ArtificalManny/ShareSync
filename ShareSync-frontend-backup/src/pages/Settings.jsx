// src/pages/Settings.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC SETTINGS PAGE v4.0 - "The Gallery Walk" Light Theme
// ═══════════════════════════════════════════════════════════════════════════════
//
// THEME: "The Control Room"
//
// COLOR MAP:
// - Page Background: #F8FAFC (clean)
// - Settings Cards: #FFFFFF (white sections)
// - Section Headers: #1E293B (dark)
// - Form Labels: #475569 (body text)
// - Input Fields: #FFFFFF border #E2E8F0
// - Input Focus: Border #3B82F6, ring blue
// - Toggle (Off): #CBD5E1 (gray)
// - Toggle (On): #3B82F6 (BLUE!)
// - Save Button: #3B82F6 (BLUE!)
// - Danger Zone: #FEE2E2 bg (red tint)
// - Delete Button: #DC2626 (red)
//
// NO BACKEND CHANGES
//
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
  AlertTriangle, Trash2
} from 'lucide-react';
import PresenceSettings from '../components/settings/PresenceSettings';
import ExperimentHistory from "../components/settings/ExperimentHistory";
import WhatWorksAnalyzer from "../components/settings/WhatWorksAnalyzer";
import PrivacyCard from "../components/settings/PrivacyCard";

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDER COMPONENT - Light theme
// ═══════════════════════════════════════════════════════════════════════════════
function Slider({ label, value, onChange, min = 0, max = 10, unit = '', icon: Icon }) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-violet-500" />}
          <label className="text-sm font-medium text-slate-700">{label}</label>
        </div>
        <span className="text-lg font-bold text-slate-800">
          {value}{unit}
        </span>
      </div>

      <div className="relative">
        <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{ 
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)'
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

      <div className="flex justify-between text-xs text-slate-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOGGLE COMPONENT - Blue when ON (#3B82F6)
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
        {/* Toggle track - Blue when on (#3B82F6) */}
        <div 
          className="w-11 h-6 rounded-full transition-all"
          style={{ 
            background: checked 
              ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' 
              : '#CBD5E1'
          }}
        />
        {/* Toggle thumb */}
        <div 
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all"
          style={{ left: checked ? '24px' : '4px' }}
        />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-700 group-hover:text-violet-600 transition-colors">
          {label}
        </div>
        {description && (
          <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        )}
      </div>
    </label>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RADIO GROUP COMPONENT - Light theme
// ═══════════════════════════════════════════════════════════════════════════════
function RadioGroup({ label, options, value, onChange, icon: Icon }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-violet-500" />}
        <label className="text-sm font-medium text-slate-700">{label}</label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`px-4 py-3 rounded-xl border-2 transition-all text-left ${
              value === option.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <div className="text-sm font-medium text-slate-800">{option.label}</div>
            {option.description && (
              <div className="text-xs text-slate-500 mt-1">{option.description}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function SectionCard({ icon: Icon, iconBg, iconColor, title, children, danger = false }) {
  return (
    <div 
      className={`rounded-2xl border p-6 ${
        danger 
          ? 'bg-red-50 border-red-200' 
          : 'bg-white border-slate-200'
      }`}
      style={!danger ? { boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' } : {}}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h2 className={`text-xl font-bold ${danger ? 'text-red-800' : 'text-slate-800'}`}>
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

        const initialTheme = me?.appearance?.theme ?? localStorage.getItem('ss.theme') ?? 'light';

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
      <main 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600">Loading your preferences...</span>
        </div>
      </main>
    );
  }

  return (
    <main 
      className="min-h-screen px-6 py-12"
      style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)' }}
    >
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <SettingsIcon className="w-5 h-5 text-violet-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">System</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            Design Your Momentum
          </h1>
          <p className="text-slate-500 text-lg">Who do you want to become?</p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">
            {errorMsg}
          </div>
        )}
        {ok && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-6 py-4 text-teal-700">
            {ok}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">

          {/* LAYER 1: Momentum Engine */}
          <SectionCard 
            icon={Target} 
            iconBg="bg-violet-100" 
            iconColor="text-violet-600" 
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
            iconBg="bg-blue-100" 
            iconColor="text-blue-600" 
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
            iconBg="bg-teal-100" 
            iconColor="text-teal-600" 
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
            iconBg="bg-amber-100" 
            iconColor="text-amber-600" 
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
            iconBg="bg-cyan-100" 
            iconColor="text-cyan-600" 
            title="Live Cursor Privacy"
          >
            <PresenceSettings />
          </SectionCard>

          {/* LAYER 6: Legacy Mode */}
          <SectionCard 
            icon={Heart} 
            iconBg="bg-pink-100" 
            iconColor="text-pink-600" 
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
              className="w-full text-white px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-md shadow-violet-200 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)' }}
            >
              <Film className="w-5 h-5" />
              Generate My 2025 Montage
            </button>
          </SectionCard>

          {/* LAYER 7: Experience Mode */}
          <SectionCard 
            icon={Star} 
            iconBg="bg-indigo-100" 
            iconColor="text-indigo-600" 
            title="Experience Mode"
          >
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUserMode('kid')}
                className={`px-6 py-8 rounded-xl border-2 transition-all ${
                  userMode === 'kid'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 bg-white hover:border-violet-300'
                }`}
              >
                <Moon className="w-8 h-8 text-violet-500 mx-auto mb-3" />
                <div className="text-lg font-bold text-slate-800">Kid Mode</div>
                <div className="text-xs text-slate-500 mt-2">
                  Bigger rings, confetti, private data
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUserMode('pro')}
                className={`px-6 py-8 rounded-xl border-2 transition-all ${
                  userMode === 'pro'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <Sun className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <div className="text-lg font-bold text-slate-800">Pro Mode</div>
                <div className="text-xs text-slate-500 mt-2">
                  Minimal, data-heavy, analytics
                </div>
              </button>
            </div>
          </SectionCard>

          {/* PHASE 4: SETTINGS LAB */}
          <SectionCard 
            icon={Beaker} 
            iconBg="bg-teal-100" 
            iconColor="text-teal-600" 
            title="Settings Lab"
          >
            <ExperimentHistory />
            <WhatWorksAnalyzer />
          </SectionCard>

          {/* PHASE 4: PRIVACY TRANSPARENCY */}
          <PrivacyCard />

          {/* Appearance */}
          <SectionCard 
            icon={SettingsIcon} 
            iconBg="bg-slate-100" 
            iconColor="text-slate-600" 
            title="Appearance"
          >
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Theme</label>
              <select
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value);
                  applyTheme(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </SectionCard>

          {/* DANGER ZONE - Red tint (#FEE2E2) */}
          <SectionCard 
            icon={AlertTriangle} 
            iconBg="bg-red-200" 
            iconColor="text-red-600" 
            title="Danger Zone"
            danger
          >
            <div className="space-y-4">
              <p className="text-sm text-red-700">
                These actions are permanent and cannot be undone.
              </p>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-red-300 text-red-600 hover:bg-red-100 transition-colors"
                onClick={() => toast({ title: 'Export started', description: 'Your data will be emailed to you.' })}
              >
                Export all my data
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
                style={{ background: '#DC2626' }}
                onClick={() => toast({ title: 'Contact support', description: 'Email support@sharesync.io to delete your account.', variant: 'error' })}
              >
                <Trash2 className="w-4 h-4" />
                Delete my account
              </button>
            </div>
          </SectionCard>

          {/* Save Button - Blue (#3B82F6) */}
          <button
            type="submit"
            disabled={saving}
            className="w-full text-white px-8 py-5 rounded-2xl font-bold text-xl transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
          >
            {saving ? 'Saving Your Future...' : 'Save Changes'}
          </button>
        </form>

      </div>
    </main>
  );
}
