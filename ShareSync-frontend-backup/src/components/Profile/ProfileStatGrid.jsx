// src/components/profile/ProfileStatGrid.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE STAT GRID - Phase 2.7 (Gebbia-Grade Polish)
// Replaces jargon with clear language. Uses tactile surfaces.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Rocket, Flame, Zap, FolderDot } from 'lucide-react';

const StatBox = ({ icon: Icon, label, value, colorClass, bgClass, borderClass }) => (
  <div className={`card-surface relative overflow-hidden p-6 hover:-translate-y-1 transition-all duration-300 group`}>
    <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.04] group-hover:scale-110 transition-transform duration-500 ${bgClass}`} />
    
    <div className="flex items-center gap-3 mb-4 relative z-10">
      <div className={`p-3 rounded-xl ${bgClass} ${colorClass} border ${borderClass} shadow-sm group-hover:scale-105 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">{label}</span>
    </div>
    
    <div className="text-[32px] font-black text-text-primary tabular-nums tracking-tight relative z-10">
      {value}
    </div>
  </div>
);

export default function ProfileStatGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Changed 'Moves' to 'Ships' per Audit 2.7 */}
      <StatBox icon={Rocket} label="Ships" value={stats.moves} colorClass="text-info-600" bgClass="bg-info-subtle" borderClass="border-info-200" />
      <StatBox icon={Flame} label="Streak" value={`${stats.streak}d`} colorClass="text-warning" bgClass="bg-warning-subtle" borderClass="border-warning-200" />
      <StatBox icon={Zap} label="Total XP" value={stats.xp} colorClass="text-brand" bgClass="bg-brand-subtle" borderClass="border-brand-200" />
      <StatBox icon={FolderDot} label="Projects" value={stats.projects} colorClass="text-success" bgClass="bg-success-subtle" borderClass="border-success-200" />
    </div>
  );
}
