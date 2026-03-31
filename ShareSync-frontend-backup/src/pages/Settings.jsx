// src/pages/Settings.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC SETTINGS PAGE v4.3 - Zero Latency Context Driven
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { toast } from '../components/ui/Toaster.jsx';
import { trackMentorSettings } from '../utils/telemetry';
import {
  Beaker, Target, Brain, Users as UsersIcon, Heart, Sparkles,
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

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS (Slider, Toggle, RadioGroup, SectionCard)
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
        <span className="text-lg font-bold text-slate-900 dark:text-white">{value}{unit}</span>
      </div>
      <div className="relative">
        <div className="h-3 rounded-full bg-slate-200 dark:bg-[#1f1f23] overflow-hidden">
          <div className="h-full transition-all duration-300" style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, #7C3AED 0%, #3B82F6 50%, #06B6D4 100%)' }} />
        </div>
        <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
      </div>
      <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-500">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, description }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className={`w-11 h-6 rounded-full transition-all border ${checked ? 'border-transparent' : 'border-slate-300 dark:border-[#27272a] bg-slate-200 dark:bg-[#1f1f23]'}`} style={{ background: checked ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' : undefined }} />
        <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all" style={{ left: checked ? '24px' : '4px' }} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{label}</div>
        {description && <div className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">{description}</div>}
      </div>
    </label>
  );
}

function RadioGroup({ label, options, value, onChange, icon: Icon }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-violet-500 dark:text-violet-400" />}
        <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">{label}</label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {options.map((option) => (
          <button key={option.value} type="button" onClick={() => onChange(option.value)} className={`px-4 py-3 rounded-xl border transition-all text-left ${value === option.value ? 'border-violet-500/50 bg-violet-50 dark:bg-violet-500/10' : 'border-slate-200 dark:border-[#1f1f23] bg-slate-50 dark:bg-[#09090B] hover:border-violet-300 dark:hover:border-violet-500/30 hover:bg-slate-100 dark:hover:bg-[#111113]'}`}>
            <div className={`text-sm font-medium ${value === option.value ? 'text-violet-800 dark:text-white' : 'text-slate-800 dark:text-white'}`}>{option.label}</div>
            {option.description && <div className="text-xs text-slate-500 dark:text-zinc-500 mt-1">{option.description}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, iconBg, iconColor, title, children, danger = false }) {
  return (
    <div className={`rounded-2xl border p-6 ${danger ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20' : 'bg-white dark:bg-[#111113] border-slate-200 dark:border-[#1f1f23] shadow-sm dark:shadow-none'}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}><Icon className={`w-5 h-5 ${iconColor}`} /></div>
        <h2 className={`text-xl font-bold ${danger ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{title}</h2>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Settings() {
  const { settings: globalSettings, updateSettings: globalUpdateSettings, loading: globalLoading, error: globalError } = useSettings();

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ok, setOk] = useState('');

  // LOCAL STATE
  const [dailyShipsGoal, setDailyShipsGoal] = useState(5);
  const [weekendShipsCount, setWeekendShipsCount] = useState(true);
  const [allowStreakFreeze, setAllowStreakFreeze] = useState(true);
  const [deepWorkTarget, setDeepWorkTarget] = useState(4);
  const [autoStartFocus, setAutoStartFocus] = useState(false);
  const [focusStartTime, setFocusStartTime] = useState('09:00');
  const [showStreakTo, setShowStreakTo] = useState('friends');
  const [celebratePublicly, setCelebratePublicly] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [discoverable, setDiscoverable] = useState(false);
  const [mentorEnabled, setMentorEnabled] = useState(true);
  const [mentorTone, setMentorTone] = useState('wise');
  const [mentorIntensity, setMentorIntensity] = useState(3);
  const [blockedApps, setBlockedApps] = useState(['slack', 'youtube', 'tiktok']);
  const [emergencyBreaksLeft, setEmergencyBreaksLeft] = useState(1);
  const [showLegacyEverywhere, setShowLegacyEverywhere] = useState(true);
  const [yearlyMontage, setYearlyMontage] = useState(false);
  const [userMode, setUserMode] = useState('pro');
  const [theme, setTheme] = useState('system');
  const [emailActivity, setEmailActivity] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  // Phone Verification
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneStatus, setPhoneStatus] = useState('idle');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const otpRefs = useRef([]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HYDRATE STATE ON MOUNT
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (globalLoading) return;
    if (globalError) {
      setErrorMsg(globalError);
      return;
    }
    if (!globalSettings) return;

    try {
      const momentum = globalSettings.momentum || {};
      setDailyShipsGoal(momentum.dailyGoal ?? 5);
      setWeekendShipsCount(momentum.weekendCount ?? true);
      setAllowStreakFreeze(momentum.allowFreeze ?? true);

      const focus = globalSettings.focus || {};
      setDeepWorkTarget(focus.dailyTarget ?? 4);
      setAutoStartFocus(focus.autoStart ?? false);
      setFocusStartTime(focus.startTime || '09:00');
      setBlockedApps(Array.isArray(focus.blockedApps) ? focus.blockedApps : ['slack', 'youtube', 'tiktok']);
      setEmergencyBreaksLeft(focus.emergencyBreaksLeft ?? 1);

      const social = globalSettings.social || {};
      setShowStreakTo(social.showStreakTo || 'friends');
      setCelebratePublicly(social.celebrate ?? true);
      setPublicProfile(social.publicProfile ?? true);
      setDiscoverable(social.discoverable ?? false);

      const mentor = globalSettings.mentor || {};
      setMentorEnabled(mentor.enabled ?? true);
      setMentorTone(mentor.tone || 'wise');
      setMentorIntensity(mentor.intensity ?? 3);

      const legacy = globalSettings.legacy || {};
      setShowLegacyEverywhere(legacy.showEverywhere ?? true);
      setYearlyMontage(legacy.yearlyVideo ?? false);

      const appearance = globalSettings.appearance || {};
      setTheme(appearance.theme || 'dark');
      setUserMode(appearance.mode || 'pro');

      const notifications = globalSettings.notifications || {};
      setEmailActivity(notifications.emailActivity ?? true);
      setEmailDigest(notifications.emailDigest ?? true);

      const security = globalSettings.security || {};
      setTwoFA(security.twoFA ?? false);

    } catch (e) {
      console.error("Hydration error:", e);
    }
  }, [globalSettings, globalLoading, globalError]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE HANDLER
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSave = async (e) => {
    e?.preventDefault?.();
    setErrorMsg('');
    setOk('');
    setSaving(true);

    try {
      const payload = {
        appearance: { theme, mode: userMode },
        mentor: { enabled: Boolean(mentorEnabled), tone: mentorTone, intensity: mentorIntensity },
        momentum: { dailyGoal: dailyShipsGoal, weekendCount: weekendShipsCount, allowFreeze: allowStreakFreeze },
        focus: { dailyTarget: deepWorkTarget, autoStart: autoStartFocus, startTime: focusStartTime, blockedApps, emergencyBreaksLeft },
        social: { showStreakTo, celebrate: celebratePublicly, publicProfile, discoverable: Boolean(discoverable) },
        legacy: { showEverywhere: showLegacyEverywhere, yearlyVideo: yearlyMontage },
        notifications: { emailActivity, emailDigest },
        security: { twoFA }
      };

      await globalUpdateSettings(payload);

      setOk('Settings saved successfully! ��');
      trackMentorSettings({ enabled: Boolean(mentorEnabled), tone: mentorTone, intensity: mentorIntensity, source: 'settings_save' });
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
      setTimeout(() => setOk(''), 3000);
    }
  };

  if (globalLoading) {
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
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">Design Your Momentum</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-lg">Who do you want to become?</p>
        </div>

        {errorMsg && <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-6 py-4 text-red-600 dark:text-red-400">{errorMsg}</div>}
        {ok && <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-6 py-4 text-emerald-700 dark:text-emerald-400">{ok}</div>}

        <form onSubmit={handleSave} className="space-y-6">
          <SectionCard icon={Target} iconBg="bg-violet-100 dark:bg-violet-500/10" iconColor="text-violet-600 dark:text-violet-400" title="Momentum Engine">
            <Slider label="Daily Ships Goal" value={dailyShipsGoal} onChange={setDailyShipsGoal} min={1} max={10} icon={Zap} />
            <Toggle label="Weekend ships count toward streak" checked={weekendShipsCount} onChange={setWeekendShipsCount} description="Keep your streak alive on Saturdays and Sundays" />
            <Toggle label="Allow 1 Streak Freeze per month" checked={allowStreakFreeze} onChange={setAllowStreakFreeze} description="Life happens. Protect your streak once a month." />
          </SectionCard>

          <SectionCard icon={Sparkles} iconBg="bg-fuchsia-100 dark:bg-fuchsia-500/10" iconColor="text-fuchsia-600 dark:text-fuchsia-400" title="Experience Persona">
            <PersonaPicker />
          </SectionCard>

          <SectionCard icon={Play} iconBg="bg-orange-100 dark:bg-orange-500/10" iconColor="text-orange-600 dark:text-orange-400" title="Celebration Style">
            <CelebrationStylePicker />
          </SectionCard>

          <SectionCard icon={Heart} iconBg="bg-rose-100 dark:bg-rose-500/10" iconColor="text-rose-600 dark:text-rose-400" title="Daily Pulse Check">
            <Toggle label="Enable daily pulse prompt" checked={emailActivity} onChange={setEmailActivity} description="Get a 30-second daily check-in for energy, focus, and blockers (+15 XP)" />
            <Toggle label="Show burnout alerts" checked={emailDigest} onChange={setEmailDigest} description="Alert you if 3+ consecutive low-energy days are detected" />
          </SectionCard>

          <SectionCard icon={Brain} iconBg="bg-blue-100 dark:bg-blue-500/10" iconColor="text-blue-600 dark:text-blue-400" title="Focus DNA">
            <Slider label="Deep Work Target" value={deepWorkTarget} onChange={setDeepWorkTarget} min={1} max={8} unit="h" icon={Clock} />
            <Toggle label="Auto-start Focus Mode at 9:00 AM weekdays" checked={autoStartFocus} onChange={setAutoStartFocus} description="Turn intention into automatic behavior" />
          </SectionCard>

          <SectionCard icon={UsersIcon} iconBg="bg-cyan-100 dark:bg-cyan-500/10" iconColor="text-cyan-600 dark:text-cyan-400" title="Social Proof">
            <RadioGroup label="Show my streak to" options={[{ value: 'nobody', label: 'Nobody' }, { value: 'friends', label: 'Friends' }, { value: 'everyone', label: 'Everyone' }]} value={showStreakTo} onChange={setShowStreakTo} />
            <Toggle label="Celebrate my ships publicly" checked={celebratePublicly} onChange={setCelebratePublicly} />
            <Toggle label="Public Profile" checked={publicProfile} onChange={setPublicProfile} />
          </SectionCard>

          <SectionCard icon={Sparkles} iconBg="bg-amber-100 dark:bg-amber-500/10" iconColor="text-amber-600 dark:text-amber-400" title="AI Mentor Personality">
            <Toggle label="Enable AI Mentor" checked={mentorEnabled} onChange={setMentorEnabled} />
            {mentorEnabled && (
              <>
                <RadioGroup label="Tone" options={[{ value: 'kind', label: 'Kind Coach' }, { value: 'wise', label: 'Wise Sage' }, { value: 'drill', label: 'Drill Sergeant' }]} value={mentorTone} onChange={setMentorTone} />
                <Slider label="Intensity" value={mentorIntensity} onChange={setMentorIntensity} min={1} max={5} />
              </>
            )}
          </SectionCard>

          <SectionCard icon={Eye} iconBg="bg-emerald-100 dark:bg-emerald-500/10" iconColor="text-emerald-600 dark:text-emerald-400" title="Live Cursor Privacy">
            <PresenceSettings />
          </SectionCard>

          <SectionCard icon={Heart} iconBg="bg-pink-100 dark:bg-pink-500/10" iconColor="text-pink-600 dark:text-pink-400" title="Legacy Mode">
            <Toggle label="Show Legacy Counter everywhere" checked={showLegacyEverywhere} onChange={setShowLegacyEverywhere} />
            <Toggle label="Send me a yearly 'Year in Ships' video" checked={yearlyMontage} onChange={setYearlyMontage} />
          </SectionCard>

          <SectionCard icon={Star} iconBg="bg-indigo-100 dark:bg-indigo-500/10" iconColor="text-indigo-600 dark:text-indigo-400" title="Experience Mode">
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setUserMode('kid')} className={`px-6 py-8 rounded-xl border transition-all ${userMode === 'kid' ? 'border-violet-500/50 bg-violet-50 dark:bg-violet-500/10' : 'border-slate-200 dark:border-[#1f1f23] bg-slate-50 dark:bg-[#09090B]'}`}>
                <Moon className="w-8 h-8 text-violet-500 mx-auto mb-3" />
                <div className="text-lg font-bold">Kid Mode</div>
              </button>
              <button type="button" onClick={() => setUserMode('pro')} className={`px-6 py-8 rounded-xl border transition-all ${userMode === 'pro' ? 'border-blue-500/50 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-[#1f1f23] bg-slate-50 dark:bg-[#09090B]'}`}>
                <Sun className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <div className="text-lg font-bold">Pro Mode</div>
              </button>
            </div>
          </SectionCard>

          <SectionCard icon={SettingsIcon} iconBg="bg-slate-200 dark:bg-zinc-800" iconColor="text-slate-600 dark:text-zinc-300" title="Appearance">
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-[#1f1f23] bg-white dark:bg-[#09090B] px-4 py-3 text-slate-900 dark:text-white">
              <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
            </select>
          </SectionCard>

          <button type="submit" disabled={saving} className="w-full text-white px-8 py-5 rounded-2xl font-bold text-xl transition-all border border-violet-500/50" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}>
            {saving ? 'Saving Your Future...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </main>
  );
}
