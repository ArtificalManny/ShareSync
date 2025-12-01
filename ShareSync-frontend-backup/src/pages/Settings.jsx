// src/pages/Settings.jsx - "WHO DO YOU WANT TO BECOME?"
import React, { useEffect, useRef, useState } from 'react';
import { getMe, updateProfile, updateNotifications } from '../api/user';
import { toast } from '../components/ui/Toaster.jsx';
import { trackMentorSettings, trackProfileDiscoverToggle } from '../utils/telemetry';
import { DISCOVERABILITY } from '../config/flags.js';
import { 
  Target, Brain, Users as UsersIcon, Shield, Heart, Sparkles, 
  Play, Zap, Clock, Film, Star, Moon, Sun, Eye // ← Eye ADDED
} from 'lucide-react';

// ⭐ NEW IMPORT: Cursor Customization Component
import CursorCustomization from '../components/settings/CursorCustomization';

// ... [Slider, Toggle, RadioGroup components unchanged — keeping them exactly as you had] ...

// Slider Component (unchanged)
function Slider({ label, value, onChange, min = 0, max = 10, unit = '', icon: Icon }) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-purple-400" />}
          <label className="text-sm font-medium text-white">{label}</label>
        </div>
        <span className="text-lg font-bold text-white">
          {value}{unit}
        </span>
      </div>
      
      <div className="relative">
        <div className="h-3 rounded-full bg-slate-700/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-300"
            style={{ width: `${percentage}%` }}
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
      
      <div className="flex justify-between text-xs text-slate-500">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// Toggle & RadioGroup unchanged — perfect as-is

export default function Settings() {
  // ... [all your existing state and useEffect logic — 100% unchanged] ...

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent mb-3">
            Design Your Momentum
          </h1>
          <p className="text-slate-400 text-lg">Who do you want to become?</p>
        </div>

        {/* Notifications */}
        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-300">
            {err}
          </div>
        )}
        {ok && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-emerald-300">
            {ok}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* LAYER 1: Momentum Engine */}
          {/* ... unchanged ... */}

          {/* LAYER 2: Focus DNA */}
          {/* ... unchanged ... */}

          {/* LAYER 3: Social Proof */}
          {/* ... unchanged ... */}

          {/* LAYER 4: AI Mentor Personality */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-purple-500/30 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">AI Mentor Personality</h2>
            </div>
            {/* ... unchanged ... */}
          </div>

          {/* ⭐ LAYER 5: LIVE CURSOR EFFECTS — NEW SECTION ⭐ */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-purple-500/30 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Live Cursor Effects</h2>
            </div>
            
            {/* This component handles everything: toggle, trail, sparkle, speed, size */}
            <CursorCustomization />
          </div>

          {/* LAYER 6: Legacy Mode */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-purple-500/30 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Legacy Mode</h2>
            </div>
            {/* ... unchanged ... */}
          </div>

          {/* LAYER 7: Kid Mode / Pro Mode */}
          {/* ... unchanged ... */}

          {/* Appearance */}
          {/* ... unchanged ... */}

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-8 py-5 rounded-2xl font-bold text-xl transition-all hover:scale-105 shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving Your Future...' : 'Save Changes'}
          </button>
        </form>

      </div>
    </main>
  );
}