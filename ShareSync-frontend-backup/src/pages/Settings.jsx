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

import React, { useEffect, useState, useRef } from 'react';
// OLD: import { getMe, updateProfile, updateNotifications } from '../api/user';
import { getSettings, updateSettings } from '../api/settings';
import { deleteAccount } from '../api/user';
import { toast } from '../components/ui/Toaster.jsx';
import { trackMentorSettings, trackProfileDiscoverToggle } from '../utils/telemetry';
import { DISCOVERABILITY } from '../config/flags.js';
import {
  Beaker,
  Target, Brain, Users as UsersIcon, Shield, Heart, Sparkles,
  Play, Zap, Clock, Film, Star, Moon, Sun, Eye, Settings as SettingsIcon,
  AlertTriangle, Trash2, CreditCard, Phone, CheckCircle,
  UserCircle,
  SlidersHorizontal,
  BellRing,
  ShieldCheck,
  Palette,
  Flame,
  PanelTop,
  BrainCircuit,
  Globe2,
  MousePointer2,
  WandSparkles,
    LogOut,
  } from 'lucide-react';
import PresenceSettings from '../components/settings/PresenceSettings';
import PrivacyCard from "../components/settings/PrivacyCard";
import BillingSettings from "../components/settings/BillingSettings";
import PersonaPicker from "../components/settings/PersonaPicker";
import CelebrationStylePicker from "../components/settings/CelebrationStylePicker";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { useAuth } from "../context/AuthContext";
import PilotFeedback from '../components/feedback/PilotFeedback';

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
          className={`w-11 h-6 rounded-full transition-all border shadow-sm ${checked ? 'border-violet-500 bg-violet-600' : 'border-slate-400 bg-slate-200 shadow-inner dark:border-zinc-500 dark:bg-zinc-700'}`}
          style={{
            background: checked ? 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)' : undefined
          }}
        />
        {/* Toggle thumb */}
        <div
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md ring-1 ring-black/10 transition-all"
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


const SETTINGS_SECTIONS = [
  {
    id: 'account',
    label: 'Account',
    description: 'Profile, email, visibility',
    icon: UserCircle,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Appearance, momentum, workspace feel',
    icon: SlidersHorizontal,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Email, invites, mentions, digests',
    icon: BellRing,
  },
  {
    id: 'privacy',
    label: 'Privacy & Security',
    description: 'Privacy, presence, account safety',
    icon: ShieldCheck,
  },
  {
    id: 'billing',
    label: 'Billing',
    description: 'Plan, usage, invoices',
    icon: CreditCard,
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'AI mentor, persona, power controls',
    icon: BrainCircuit,
  },
];


function MobileSettingsRows({ activeSection, onSelect, onLogout }) {
  const rows = [
    {
      id: 'preferences',
      label: 'Appearance / Dark Mode',
      description: 'Theme and app feel',
      icon: Palette,
    },
    {
      id: 'account',
      label: 'Account',
      description: 'Profile, email, identity',
      icon: UserCircle,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Email, mentions, invites',
      icon: BellRing,
    },
    {
      id: 'privacy',
      label: 'Privacy',
      description: 'Presence and visibility',
      icon: ShieldCheck,
    },
  ];

  return (
    <section
      data-mobile-settings-app-frame="true"
      className="md:hidden space-y-3"
    >
      <div className="overflow-hidden rounded-[26px] border border-white/70 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111116]/90">
        {rows.map(({ id, label, description, icon: Icon }, index) => {
          const active = activeSection === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:scale-[0.99] ${
                active
                  ? 'bg-violet-50/95 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200'
                  : 'text-slate-800 hover:bg-slate-50 dark:text-zinc-100 dark:hover:bg-white/[0.04]'
              } ${index > 0 ? 'border-t border-slate-100 dark:border-white/[0.06]' : ''}`}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                  active
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-zinc-400'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-black leading-tight">{label}</span>
                <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-500 dark:text-zinc-500">
                  {description}
                </span>
              </span>

              {active && (
                <span className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.55)]" />
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-3 rounded-[24px] border border-red-100 bg-white/90 px-4 py-3.5 text-left text-red-500 shadow-[0_14px_35px_rgba(244,63,94,0.08)] transition active:scale-[0.99] hover:bg-red-50 dark:border-red-500/10 dark:bg-[#111116]/90 dark:hover:bg-red-500/10"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
          <LogOut className="h-5 w-5" />
        </span>
        <span className="text-[13px] font-black">Log Out</span>
      </button>
    </section>
  );
}

function AccountIdentityPanel() {
  const [accountUser, setAccountUser] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const readToken = () => {
      if (typeof window === "undefined") return "";
      return (
        window.localStorage.getItem("token") ||
        window.localStorage.getItem("accessToken") ||
        window.localStorage.getItem("authToken") ||
        window.localStorage.getItem("ss.token") ||
        ""
      );
    };

    const normalizeUser = (payload) => {
      if (!payload) return null;
      return payload.user || payload.data?.user || payload.data || payload;
    };

    const loadUser = async () => {
      const token = readToken();
      const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "";

      const endpoints = [
        `${baseUrl}/users/me`,
        `${baseUrl}/auth/me`,
        `${baseUrl}/api/users/me`,
        `${baseUrl}/api/auth/me`,
      ];

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: "include",
          });

          if (!res.ok) continue;

          const json = await res.json();
          const nextUser = normalizeUser(json);

          if (!cancelled && nextUser) {
            setAccountUser(nextUser);
            return;
          }
        } catch {
          // Try the next endpoint.
        }
      }

      if (!cancelled) setAccountUser(null);
    };

    loadUser().finally(() => {
      if (!cancelled) setAccountLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName =
    accountUser?.displayName ||
    accountUser?.name ||
    accountUser?.fullName ||
    accountUser?.username ||
    "OpenShare account";

  const email = accountUser?.email || "Email not available";
  const handle = accountUser?.username || accountUser?.handle || accountUser?.slug || "Handle not set";
  const avatar =
    accountUser?.avatar ||
    accountUser?.avatarUrl ||
    accountUser?.profilePicture ||
    accountUser?.photoURL ||
    accountUser?.picture ||
    "";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "OS";

  const emailVerified = Boolean(
    accountUser?.emailVerified ||
    accountUser?.isEmailVerified ||
    accountUser?.verified
  );

  return (
    <div
      data-account-identity-panel
      className="grid gap-4 rounded-[28px] border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] md:grid-cols-[auto_1fr]"
    >
      <div className="flex items-center gap-4">
        {avatar ? (
          <img
            src={avatar}
            alt={displayName}
            className="h-16 w-16 shrink-0 rounded-3xl object-cover shadow-lg shadow-violet-500/20"
          />
        ) : (
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-xl font-black text-white shadow-lg shadow-violet-500/20">
            {accountLoading ? "..." : initials}
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-4">
        <div>
          <div className="text-base font-black text-slate-950 dark:text-white">
            Your OpenShare identity
          </div>
          <div className="text-sm text-slate-500 dark:text-zinc-400">
            Profile details come from your account. Settings controls visibility.
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70 dark:bg-white/[0.035] dark:ring-white/[0.08]">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">Profile photo</div>
            <div className="mt-1 text-sm font-bold text-slate-800 dark:text-zinc-100">{avatar ? "Uploaded" : "No photo set"}</div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70 dark:bg-white/[0.035] dark:ring-white/[0.08]">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">Display name</div>
            <div className="mt-1 truncate text-sm font-bold text-slate-800 dark:text-zinc-100">{displayName}</div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70 dark:bg-white/[0.035] dark:ring-white/[0.08]">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">Email</div>
            <div className="mt-1 truncate text-sm font-bold text-slate-800 dark:text-zinc-100">{email}</div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70 dark:bg-white/[0.035] dark:ring-white/[0.08]">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">Username / handle</div>
            <div className="mt-1 truncate text-sm font-bold text-slate-800 dark:text-zinc-100">{handle}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <a href="/profile" className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white">
            Open public profile
          </a>
          <a href="/profile?edit=1" className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-black text-violet-700">
            Manage profile
          </a>
          <div className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700">
            Account status: Active
          </div>
          <div className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-black text-slate-600">
            {emailVerified ? "Email verified" : "Email not verified"}
          </div>
        </div>
      </div>
    </div>
  );
}


function SettingsNav({ activeSection, onChange }) {
  return (
    <nav className="settings-section-nav lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
      <div className="flex max-h-none min-h-0 flex-col rounded-[30px] border border-slate-200/70 bg-white/70 p-3 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04] lg:max-h-[calc(100vh-7rem)]">
        <div className="mb-4 hidden shrink-0 lg:block">
          <div className="relative overflow-hidden rounded-3xl border border-violet-200/70 bg-gradient-to-br from-white via-violet-50 to-fuchsia-50 p-4 shadow-sm dark:border-violet-400/20 dark:from-[#181821] dark:via-[#1d1830] dark:to-[#22162a]">
            <div className="absolute -right-7 -top-7 h-28 w-28 rounded-full bg-violet-400/20 blur-2xl" />
            <div className="absolute -bottom-9 -left-7 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20" />

            <div className="relative flex items-start gap-3">
              <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-violet-500/25">
                <SlidersHorizontal className="h-6 w-6" />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-white/25" />
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-300 ring-2 ring-white dark:ring-[#1d1830]" />
              </div>

              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-500 dark:text-violet-300">
                  Control Center
                </div>

                <h2 className="mt-1 text-lg font-black leading-tight text-slate-950 dark:text-white">
                  Settings
                </h2>

                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
                  Preferences, privacy, notifications, and billing.
                </p>

                <div className="mt-3 inline-flex items-center rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-violet-700 shadow-sm ring-1 ring-violet-200/70 dark:bg-white/[0.08] dark:text-violet-200 dark:ring-violet-400/20">
                  6 sections
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3 flex shrink-0 items-center gap-2 px-1 lg:hidden">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white shadow-md shadow-violet-500/20">
            <SlidersHorizontal className="h-5 w-5" />
          </div>

          <div>
            <div className="text-sm font-black text-slate-950 dark:text-white">Settings</div>
            <div className="text-xs text-slate-600 dark:text-zinc-300">Control center</div>
          </div>
        </div>

        <div className="settings-rail-scroll flex min-h-0 gap-2 overflow-x-auto pb-2 lg:flex-1 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1 [scrollbar-gutter:stable] [scrollbar-width:thin]">
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onChange(section.id)}
                className={`group relative flex min-w-[220px] w-full shrink-0 items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-left transition-all duration-200 lg:min-w-0 lg:shrink ${
                  active
                    ? 'bg-gradient-to-r from-violet-50 via-white/90 to-fuchsia-50 shadow-md shadow-violet-500/10 ring-1 ring-violet-200/70 dark:from-violet-500/15 dark:via-white/[0.07] dark:to-fuchsia-500/10 dark:ring-violet-400/20'
                    : 'bg-transparent hover:bg-white/65 dark:hover:bg-white/[0.055]'
                }`}
              >
                {active && (
                  <>
                    <div className="absolute bottom-3 left-0 top-3 w-1 rounded-full bg-gradient-to-b from-violet-500 via-fuchsia-500 to-cyan-400" />
                    <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-violet-400/10 blur-2xl" />
                  </>
                )}

                <div
                  className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition-all ${
                    active
                      ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-violet-50 group-hover:text-violet-700 dark:bg-white/[0.07] dark:text-zinc-300 dark:group-hover:bg-violet-500/12 dark:group-hover:text-violet-200'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="relative min-w-0 flex-1 !border-0 !bg-transparent !p-0 !shadow-none !ring-0">
                  <div
                    className={`!border-0 !bg-transparent !p-0 !shadow-none !ring-0 text-sm font-black leading-tight ${
                      active
                        ? 'text-slate-950 dark:text-white'
                        : 'text-slate-800 dark:text-zinc-100'
                    }`}
                  >
                    {section.label}
                  </div>

                  <div
                    className={`mt-1 hidden !border-0 !bg-transparent !p-0 !shadow-none !ring-0 text-xs leading-snug sm:block ${
                      active
                        ? 'text-slate-600 dark:text-zinc-300'
                        : 'text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    {section.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function ComingSoonRow({ label, description }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 opacity-75 dark:border-white/[0.08] dark:bg-white/[0.03]">
      <div>
        <div className="text-sm font-bold text-slate-700 dark:text-zinc-200">{label}</div>
        {description && (
          <div className="mt-0.5 text-xs text-slate-500 dark:text-zinc-500">{description}</div>
        )}
      </div>

      <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-500">
        Soon
      </span>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function Settings() {
  useDocumentTitle("Settings");
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ok, setOk] = useState('');
  const [activeSection, setActiveSection] = useState('preferences');

  // account-delete-danger-v1
  // account-delete-password-v1
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');

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
  const [shareLiveActivity, setShareLiveActivity] = useState(true);
  const handleMobileLogout = () => {
    logout?.();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const handleDeleteAccount = async () => {
    if (
      deleteConfirmation !== 'DELETE' ||
      deletePassword.length === 0 ||
      deletingAccount
    ) return;

    setDeletingAccount(true);
    setDeleteAccountError('');

    try {
      await deleteAccount('DELETE', deletePassword);
      logout?.();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Could not delete your account. Please try again.';

      setDeleteAccountError(
        Array.isArray(message) ? message.join(' ') : String(message)
      );
      setDeletingAccount(false);
    }
  };

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
  const [projectInvites, setProjectInvites] = useState(true);
  const [taskAssignments, setTaskAssignments] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [billingAlerts, setBillingAlerts] = useState(true);
  const [defaultProjectVisibility, setDefaultProjectVisibility] = useState('private');
  const [defaultInviteRole, setDefaultInviteRole] = useState('member');
  const [requireJoinApproval, setRequireJoinApproval] = useState(true);
  const [defaultProjectNotificationLevel, setDefaultProjectNotificationLevel] = useState('mentions');
  const [twoFA, setTwoFA] = useState(false);

  const mqlRef = useRef(null);

  // SETTINGS THEME SYNC BRIDGE
  // Settings, the header theme button, localStorage, and the DOM should agree.
  // This keeps the Appearance dropdown synchronized even when theme changes
  // happen outside Settings.jsx.
  const THEME_STORAGE_KEY = "ss.theme";
  const LEGACY_THEME_STORAGE_KEYS = ["theme", "openshare.theme", "sharesync.theme"];

  const normalizeThemeMode = (value, fallback = 'system') => {
    return value === 'light' || value === 'dark' || value === 'system'
      ? value
      : fallback;
  };

  const getSystemResolvedTheme = () => {
    if (typeof window === 'undefined') return 'light';

    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
      ? 'dark'
      : 'light';
  };

  const getResolvedThemeFromPreference = (mode) => {
    const safeMode = normalizeThemeMode(mode, 'system');

    if (safeMode === 'system') {
      return getSystemResolvedTheme();
    }

    return safeMode;
  };

  const readSavedThemePreference = () => {
    if (typeof window === 'undefined') return null;

    const primary = normalizeThemeMode(
      window.localStorage.getItem(THEME_STORAGE_KEY),
      null
    );

    if (primary) return primary;

    for (const key of LEGACY_THEME_STORAGE_KEYS) {
      const legacy = normalizeThemeMode(window.localStorage.getItem(key), null);
      if (legacy) return legacy;
    }

    return null;
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

  const writeThemePreference = (mode) => {
    if (typeof window === 'undefined') return;

    const safeMode = normalizeThemeMode(mode, 'system');

    window.localStorage.setItem(THEME_STORAGE_KEY, safeMode);

    // Keep common legacy keys aligned so older header/theme code does not drift.
    for (const key of LEGACY_THEME_STORAGE_KEYS) {
      window.localStorage.setItem(key, safeMode);
    }
  };

  const broadcastThemePreference = (mode) => {
    if (typeof window === 'undefined') return;

    const safeMode = normalizeThemeMode(mode, 'system');
    const resolvedTheme = getResolvedThemeFromPreference(safeMode);

    window.dispatchEvent(
      new CustomEvent("openshare:theme-change", {
        detail: {
          theme: safeMode,
          resolvedTheme,
          source: "settings",
        },
      })
    );

    // Existing app code already uses a generic storage event in places.
    window.dispatchEvent(new Event("storage"));
  };

  const applyTheme = (mode) => {
    const safeMode = normalizeThemeMode(mode, 'system');
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

    if (safeMode === "system" && media) {
      const handler = () => {
        applyResolvedTheme("system");
        broadcastThemePreference("system");
      };

      if (media.addEventListener) {
        media.addEventListener("change", handler);
      } else if (media.addListener) {
        media.addListener(handler);
      }

      media._handler = handler;
      mqlRef.current = media;
    }

    writeThemePreference(safeMode);
    applyResolvedTheme(safeMode);
    broadcastThemePreference(safeMode);
  };

  const syncThemeStateFromEnvironment = (source = "environment") => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const storedPreference = readSavedThemePreference();
    const domTheme = readResolvedDocumentTheme();

    const storedResolved = storedPreference
      ? getResolvedThemeFromPreference(storedPreference)
      : null;

    // If another part of the app toggled the DOM without updating ss.theme,
    // trust the visible DOM and repair localStorage.
    if (
      source === "dom" &&
      domTheme &&
      storedPreference &&
      storedPreference !== "system" &&
      storedResolved !== domTheme
    ) {
      writeThemePreference(domTheme);
      setTheme((current) => (current === domTheme ? current : domTheme));
      return;
    }

    const nextTheme = storedPreference || domTheme || 'system';

    setTheme((current) => (current === nextTheme ? current : nextTheme));
  };

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    const root = document.documentElement;

    const handleThemeEvent = (event) => {
      const incomingTheme = normalizeThemeMode(event?.detail?.theme, null);

      if (incomingTheme) {
        setTheme((current) => (current === incomingTheme ? current : incomingTheme));
        return;
      }

      syncThemeStateFromEnvironment("event");
    };

    const handleStorageSync = () => {
      syncThemeStateFromEnvironment("storage");
    };

    const observer = new MutationObserver(() => {
      syncThemeStateFromEnvironment("dom");
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const media = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

    const handleSystemThemeChange = () => {
      syncThemeStateFromEnvironment("system");
    };

    if (media?.addEventListener) {
      media.addEventListener("change", handleSystemThemeChange);
    } else if (media?.addListener) {
      media.addListener(handleSystemThemeChange);
    }

    window.addEventListener("openshare:theme-change", handleThemeEvent);
    window.addEventListener("storage", handleStorageSync);

    syncThemeStateFromEnvironment("mount");

    return () => {
      observer.disconnect();
      window.removeEventListener("openshare:theme-change", handleThemeEvent);
      window.removeEventListener("storage", handleStorageSync);

      if (media?.removeEventListener) {
        media.removeEventListener("change", handleSystemThemeChange);
      } else if (media?.removeListener) {
        media.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  // SETTINGS SAVE PERSISTENCE BRIDGE
  // Backend remains the primary source, but this local snapshot prevents
  // Settings.jsx from showing stale values after navigation if the API response
  // lags or returns an older settings shape.
  const SETTINGS_LOCAL_SNAPSHOT_KEY = "ss.settings";

  const unwrapSettingsPayload = (value) => {
    const payload = value?.data ?? value;

    if (!payload || typeof payload !== "object") {
      return payload;
    }

    if (payload.settings && typeof payload.settings === "object") {
      return payload.settings;
    }

    if (payload.data?.settings && typeof payload.data.settings === "object") {
      return payload.data.settings;
    }

    if (payload.data && typeof payload.data === "object") {
      return payload.data;
    }

    return payload;
  };

  const mergeSettingsForSettingsPage = (base = {}, overlay = {}) => {
    const safeBase = base && typeof base === "object" ? base : {};
    const safeOverlay = overlay && typeof overlay === "object" ? overlay : {};

    const next = {
      ...safeBase,
      ...safeOverlay,
    };

    for (const key of [
      "appearance",
      "mentor",
      "momentum",
      "focus",
      "social",
      "legacy",
      "notifications",
      "security",
    ]) {
      next[key] = {
        ...(safeBase[key] || {}),
        ...(safeOverlay[key] || {}),
      };
    }

    return next;
  };

  const readLocalSettingsSnapshot = () => {
    if (typeof window === "undefined") return null;

    try {
      const raw = window.localStorage.getItem(SETTINGS_LOCAL_SNAPSHOT_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const unwrapped = unwrapSettingsPayload(parsed);

      return unwrapped && typeof unwrapped === "object" ? unwrapped : null;
    } catch {
      return null;
    }
  };

  const persistSettingsSnapshot = (nextSettings) => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        SETTINGS_LOCAL_SNAPSHOT_KEY,
        JSON.stringify(nextSettings)
      );
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Non-fatal. The backend save already succeeded.
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD SETTINGS FROM /api/settings
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    let ignore = false;
    setLoading(true);

    getSettings()
      .then((loadedSettings) => {
        let settings = unwrapSettingsPayload(loadedSettings);
        if (ignore || !settings) return;

        const localSnapshot = readLocalSettingsSnapshot();
        if (localSnapshot) {
          settings = mergeSettingsForSettingsPage(settings, localSnapshot);
        }

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
        setShareLiveActivity(Boolean(social.shareLiveActivity ?? true));

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
        setProjectInvites(Boolean(notifications.projectInvites ?? true));
        setTaskAssignments(Boolean(notifications.taskAssignments ?? true));
        setMentions(Boolean(notifications.mentionAlerts ?? notifications.mentions ?? true));
        setBillingAlerts(Boolean(notifications.billingAlerts ?? true));
        const projectDefaults = settings.projectDefaults || {};
        setDefaultProjectVisibility(projectDefaults.visibility || 'private');
        setDefaultInviteRole(projectDefaults.inviteRole || 'member');
        setRequireJoinApproval(Boolean(projectDefaults.requireApproval ?? true));
        setDefaultProjectNotificationLevel(projectDefaults.notificationLevel || 'mentions');

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
          shareLiveActivity: Boolean(shareLiveActivity),
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
          projectInvites,
          taskAssignments,
          mentionAlerts: mentions,
          billingAlerts,
        },
        projectDefaults: {
          visibility: defaultProjectVisibility,
          inviteRole: defaultInviteRole,
          requireApproval: requireJoinApproval,
          notificationLevel: defaultProjectNotificationLevel,
        },
        security: {
          twoFA,
        },
      };

      const serverSettings = unwrapSettingsPayload(await updateSettings(payload));
      const persistedSettings = mergeSettingsForSettingsPage(serverSettings || {}, payload);

      persistSettingsSnapshot(persistedSettings);

      const savedTheme = persistedSettings?.appearance?.theme || theme;
      const savedMode = persistedSettings?.appearance?.mode || userMode;

      setTheme(savedTheme);
      setUserMode(savedMode);
      applyTheme(savedTheme);

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
    <main data-settings-app-frame="true" className="settings-page-surface min-h-screen overflow-x-hidden px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pt-4 text-slate-900 transition-colors duration-300 md:px-6 md:py-12 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.08),transparent_30%),linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_50%,#F8FAFC_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_32%),linear-gradient(180deg,#09090B_0%,#0F0F14_48%,#09090B_100%)] dark:text-white">
        <style data-settings-mobile-css>{`
          @media (max-width: 767px) {
            [data-settings-app-frame="true"] {
              padding-left: 14px !important;
              padding-right: 14px !important;
              padding-top: 14px !important;
            }

            [data-mobile-settings-panels="true"] > div,
            [data-mobile-settings-panels="true"] > section {
              border-radius: 26px !important;
              padding: 18px !important;
              box-shadow: 0 16px 42px rgba(15, 23, 42, 0.07) !important;
            }

            [data-mobile-settings-panels="true"] h2,
            [data-mobile-settings-panels="true"] h3 {
              font-size: 18px !important;
              line-height: 1.15 !important;
            }

            [data-mobile-settings-panels="true"] p,
            [data-mobile-settings-panels="true"] label,
            [data-mobile-settings-panels="true"] span {
              line-height: 1.35;
            }

            [data-mobile-settings-panels="true"] input,
            [data-mobile-settings-panels="true"] select,
            [data-mobile-settings-panels="true"] textarea {
              font-size: 16px !important;
            }

            [data-mobile-settings-panels="true"] .grid {
              gap: 12px !important;
            }
          }
        `}</style>

      <div className="mx-auto max-w-[410px] space-y-3 md:max-w-6xl md:space-y-8">

        {/* Header */}
        <div className="hidden text-center mb-12 md:block">
          <div className="flex items-center justify-center gap-2 mb-3">
            <SettingsIcon className="w-5 h-5 text-violet-500" />
            <span className="text-xs text-slate-500 dark:text-zinc-500 uppercase tracking-wider">System</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Settings
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-lg">Manage your account, workspace preferences, privacy, and billing.</p>
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

        <div className="grid gap-4 md:gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          <div className="hidden md:block">
            <SettingsNav activeSection={activeSection} onChange={setActiveSection} />
          </div>
          <MobileSettingsRows activeSection={activeSection} onSelect={setActiveSection} onLogout={handleMobileLogout} />

          <form data-mobile-settings-panels="true" onSubmit={handleSave} className="min-w-0 space-y-4 md:space-y-6">
          {activeSection === 'account' && (
            <>
              <SectionCard
                icon={UserCircle}
                iconBg="bg-sky-100 dark:bg-sky-500/10"
                iconColor="text-sky-600 dark:text-sky-300"
                title="Profile & Account"
              >
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.08] dark:bg-[#0B0B0F]">
                  <div className="flex items-start gap-3">
                    <Globe2 className="mt-0.5 h-5 w-5 text-sky-500" />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Account overview</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                        Manage who you are on OpenShare. Profile details live on your Profile page; visibility controls stay here.
                      </p>
                    </div>
                  </div>
                </div>


                            <AccountIdentityPanel />
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => setPublicProfile((current) => !current)}
                  className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                    publicProfile
                      ? "bg-violet-600"
                      : "bg-slate-200 dark:bg-white/[0.10]"
                  }`}
                  aria-pressed={publicProfile}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      publicProfile ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>

                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                    Public Profile
                  </div>
                  <div className="text-sm text-slate-500 dark:text-zinc-400">
                    Allow others to view your public profile
                  </div>
                </div>
              </div>
<Toggle
                  label="Celebrate my ships publicly"
                  checked={celebratePublicly}
                  onChange={setCelebratePublicly}
                  description="Let others see selected ship milestones"
                />

                <Toggle
                  label="Share live activity with teammates"
                  checked={shareLiveActivity}
                  onChange={setShareLiveActivity}
                  description="Let teammates see selected real-time activity"
                />
              </SectionCard>
            </>
          )}


          {activeSection === 'account' && (
            <SectionCard
              icon={AlertTriangle}
              iconBg="bg-red-100 dark:bg-red-500/10"
              iconColor="text-red-600 dark:text-red-300"
              title="Danger Zone"
              danger
            >
              <div className="rounded-2xl border border-red-200/90 bg-white/80 p-4 dark:border-red-500/20 dark:bg-black/10 md:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Delete your OpenShare account
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
                      Permanently delete your account. This action cannot be undone.
                    </p>
                  </div>

                  {!deleteAccountOpen && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteAccountOpen(true);
                        setDeleteConfirmation('');
                        setDeletePassword('');
                        setDeleteAccountError('');
                      }}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-extrabold text-red-700 transition hover:border-red-400 hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete account
                    </button>
                  )}
                </div>

                {deleteAccountOpen && (
                  <div className="mt-5 border-t border-red-200/80 pt-5 dark:border-red-500/20">
                    <div className="rounded-xl bg-red-50/80 p-4 dark:bg-red-500/10">
                      <p className="text-sm font-bold text-red-800 dark:text-red-200">
                        Type <span className="font-black">DELETE</span> to confirm.
                      </p>
                      <p className="mt-1 text-xs leading-5 text-red-700/80 dark:text-red-300/80">
                        Your account access will end immediately and you will be signed out.
                      </p>
                    </div>

                    <label
                      htmlFor="delete-account-confirmation"
                      className="mt-4 block text-sm font-bold text-slate-700 dark:text-zinc-300"
                    >
                      Confirmation
                    </label>

                    <input
                      id="delete-account-confirmation"
                      type="text"
                      value={deleteConfirmation}
                      onChange={(event) => {
                        setDeleteConfirmation(event.target.value);
                        if (deleteAccountError) setDeleteAccountError('');
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                        }
                      }}
                      disabled={deletingAccount}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="DELETE"
                      className="mt-2 w-full rounded-xl border border-red-200 bg-white px-4 py-3 font-mono text-sm font-bold text-slate-900 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/25 dark:bg-[#111116] dark:text-white"
                    />

                    <label
                      htmlFor="delete-account-password"
                      className="mt-4 block text-sm font-bold text-slate-700 dark:text-zinc-300"
                    >
                      Current password
                    </label>

                    <input
                      id="delete-account-password"
                      type="password"
                      value={deletePassword}
                      onChange={(event) => {
                        setDeletePassword(event.target.value);
                        if (deleteAccountError) setDeleteAccountError('');
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                        }
                      }}
                      disabled={deletingAccount}
                      autoComplete="current-password"
                      placeholder="Enter your current password"
                      className="mt-2 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/25 dark:bg-[#111116] dark:text-white"
                    />

                    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-zinc-500">
                      For security, confirm the password you currently use to sign in.
                    </p>

                    {deleteAccountError && (
                      <p
                        role="alert"
                        className="mt-3 text-sm font-semibold text-red-600 dark:text-red-300"
                      >
                        {deleteAccountError}
                      </p>
                    )}

                    <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        disabled={deletingAccount}
                        onClick={() => {
                          setDeleteAccountOpen(false);
                          setDeleteConfirmation('');
                          setDeletePassword('');
                          setDeleteAccountError('');
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={
                          deleteConfirmation !== 'DELETE' ||
                          deletePassword.length === 0 ||
                          deletingAccount
                        }
                        onClick={handleDeleteAccount}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingAccount
                          ? 'Deleting account...'
                          : 'Permanently delete my account'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {activeSection === 'preferences' && (
            <>
          {/* Appearance */}
          <SectionCard
            icon={Palette}
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


          {/* LAYER 1: Momentum Engine */}
          <SectionCard
            icon={Flame}
            iconBg="bg-orange-100 dark:bg-orange-500/10"
            iconColor="text-orange-600 dark:text-orange-400"
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

              <SectionCard
                icon={PanelTop}
                iconBg="bg-indigo-100 dark:bg-indigo-500/10"
                iconColor="text-indigo-600 dark:text-indigo-400"
                title="Interface Density"
              >
                <RadioGroup
                  label="Workspace density"
                  options={[
                    { value: 'comfortable', label: 'Comfortable', description: 'More breathing room' },
                    { value: 'compact', label: 'Compact', description: 'More data on screen' },
                    { value: 'focused', label: 'Focused', description: 'Minimal visual noise' },
                  ]}
                  value={userMode === 'kid' || userMode === 'pro' ? 'comfortable' : userMode}
                  onChange={setUserMode}
                />
              </SectionCard>
            </>
          )}


            {activeSection === 'preferences' && (
              <SectionCard
                icon={SlidersHorizontal}
                iconBg="bg-cyan-100 dark:bg-cyan-500/10"
                iconColor="text-cyan-600 dark:text-cyan-300"
                title="Project Defaults"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <div className="text-sm font-bold text-slate-800 dark:text-zinc-100">Default project visibility</div>
                    <select
                      value={defaultProjectVisibility}
                      onChange={(event) => setDefaultProjectVisibility(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-violet-400 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white"
                    >
                      <option value="private">Private</option>
                      <option value="team">Team only</option>
                      <option value="public">Public</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <div className="text-sm font-bold text-slate-800 dark:text-zinc-100">Default invite role</div>
                    <select
                      value={defaultInviteRole}
                      onChange={(event) => setDefaultInviteRole(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-violet-400 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <div className="text-sm font-bold text-slate-800 dark:text-zinc-100">Default notification level</div>
                    <select
                      value={defaultProjectNotificationLevel}
                      onChange={(event) => setDefaultProjectNotificationLevel(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-violet-400 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white"
                    >
                      <option value="all">All activity</option>
                      <option value="mentions">Mentions only</option>
                      <option value="none">Muted</option>
                    </select>
                  </label>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
                    <Toggle
                      label="Require approval before members join"
                      checked={requireJoinApproval}
                      onChange={setRequireJoinApproval}
                      description="New members need approval before they can access new projects"
                    />
                  </div>
                </div>
              </SectionCard>
            )}


          {activeSection === 'notifications' && (
            <>
              <SectionCard
                icon={BellRing}
                iconBg="bg-amber-100 dark:bg-amber-500/10"
                iconColor="text-amber-600 dark:text-amber-300"
                title="Notifications"
              >
                <Toggle
                  label="Email activity updates"
                  checked={emailActivity}
                  onChange={setEmailActivity}
                  description="Receive important activity updates by email"
                />

                <Toggle
                  label="Weekly digest"
                  checked={emailDigest}
                  onChange={setEmailDigest}
                  description="Get a weekly summary of projects, ships, and momentum"
                />
                  <Toggle
                    label="Project invites"
                    checked={projectInvites}
                    onChange={setProjectInvites}
                    description="Control notifications for project invitations"
                  />
                  <Toggle
                    label="Task assignments"
                    checked={taskAssignments}
                    onChange={setTaskAssignments}
                    description="Control notifications when work is assigned to you"
                  />
                  <Toggle
                    label="Mentions"
                    checked={mentions}
                    onChange={setMentions}
                    description="Control notifications when someone mentions you"
                  />
                  <Toggle
                    label="Billing alerts"
                    checked={billingAlerts}
                    onChange={setBillingAlerts}
                    description="Control receipts, plan changes, and usage alerts"
                  />
              </SectionCard>
            </>
          )}


          {activeSection === 'privacy' && (
            <>
              <SectionCard
                icon={MousePointer2}
                iconBg="bg-emerald-100 dark:bg-emerald-500/10"
                iconColor="text-emerald-600 dark:text-emerald-300"
                title="Live Cursor Privacy"
              >
                <PresenceSettings />
              </SectionCard>

              <PrivacyCard />
            </>
          )}


          {activeSection === 'billing' && (
            <>
          {/* SUBSCRIPTION & BILLING */}
          <SectionCard
            icon={CreditCard}
            iconBg="bg-fuchsia-100 dark:bg-fuchsia-500/10"
            iconColor="text-fuchsia-600 dark:text-fuchsia-400"
            title="Subscription & Billing"
          >
            <div className="settings-billing-contrast-fix">
              <BillingSettings />
            </div>
          </SectionCard>


            </>
          )}


          {activeSection === 'advanced' && (
            <>
              <SectionCard
                icon={WandSparkles}
                iconBg="bg-fuchsia-100 dark:bg-fuchsia-500/10"
                iconColor="text-fuchsia-600 dark:text-fuchsia-300"
                title="Experience Persona"
              >
                <div className="picker-settings-wrapper">
                  <PersonaPicker />
                </div>
              </SectionCard>

              <SectionCard
                icon={Sparkles}
                iconBg="bg-orange-100 dark:bg-orange-500/10"
                iconColor="text-orange-600 dark:text-orange-300"
                title="Celebration Style"
              >
                <div className="picker-settings-wrapper">
                  <CelebrationStylePicker />
                </div>
              </SectionCard>

              <SectionCard
                icon={BrainCircuit}
                iconBg="bg-amber-100 dark:bg-amber-500/10"
                iconColor="text-amber-600 dark:text-amber-300"
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



          {/* Save Button */}
                      {/* pilot-feedback-settings-v1 */}
            <div className="pt-1">
              <PilotFeedback variant="settings" />
            </div>

<div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving ? 'true' : 'false'}
              data-settings-save-button="true"
              className="group inline-flex rounded-full p-[1.5px] bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 shadow-[0_18px_45px_rgba(124,58,237,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_58px_rgba(124,58,237,0.38)] focus:outline-none focus:ring-4 focus:ring-violet-500/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <span
                data-settings-save-button-inner="true"
                className="inline-flex min-w-[210px] items-center justify-center rounded-full px-10 py-3.5 text-sm font-extrabold tracking-wide !text-white bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 transition-all duration-200 group-hover:from-violet-700 group-hover:via-purple-700 group-hover:to-fuchsia-700 dark:from-violet-500 dark:via-purple-500 dark:to-fuchsia-500"
              >
                {saving ? 'Saving Your Future...' : 'Save Changes'}
              </span>
            </button>
          </div>
          </form>
        </div>
      </div>
    </main>
  );
}
