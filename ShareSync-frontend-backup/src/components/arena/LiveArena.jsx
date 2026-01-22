// src/components/arena/LiveArena.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.1: Live Arena - Main Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
//
// Real-time team visibility dashboard.
// Shows who's working, what they're working on, and enables collaboration.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  Users, 
  Target, 
  Zap, 
  Eye, 
  EyeOff, 
  Settings,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import useTeamPresence from '../../hooks/useTeamPresence';
import { usePresence, PRESENCE_STATUS } from '../../contexts/PresenceContext';
import TeamMemberCard from './TeamMemberCard';
import { PresenceBadge } from './PresenceIndicator';

/**
 * LiveArena - Main arena component
 */
export default function LiveArena({ onCoworkRequest, onMessageRequest }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showSettings, setShowSettings] = useState(false);
  
  const { members, stats, isConnected } = useTeamPresence({ activeOnly: false });
  const { preferences, updatePreferences, myPresence } = usePresence();

  const handleCowork = (member) => {
    onCoworkRequest?.(member);
  };

  const handleMessage = (member) => {
    onMessageRequest?.(member);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-accent-500 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              Live Arena
              {isConnected ? (
                <Wifi className="w-4 h-4 text-success" />
              ) : (
                <WifiOff className="w-4 h-4 text-error" />
              )}
            </h2>
            <p className="text-sm text-text-secondary">
              {stats.active} active now • {stats.focused} in focus mode
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* My visibility toggle */}
          <button
            onClick={() => updatePreferences({ showInArena: !preferences.showInArena })}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              transition-colors
              ${preferences.showInArena 
                ? 'bg-success/10 text-success border border-success/20' 
                : 'bg-surface-2 text-text-tertiary border border-transparent'
              }
            `}
            title={preferences.showInArena ? 'You are visible' : 'You are hidden'}
          >
            {preferences.showInArena ? (
              <>
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Visible</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                <span className="hidden sm:inline">Hidden</span>
              </>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-surface-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <ArenaSettings 
          preferences={preferences}
          updatePreferences={updatePreferences}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard 
          icon={Users}
          label="Online"
          value={stats.online}
          color="text-success"
        />
        <StatCard 
          icon={Zap}
          label="Active"
          value={stats.active}
          color="text-brand"
        />
        <StatCard 
          icon={Target}
          label="In Focus"
          value={stats.focused}
          color="text-warning"
        />
        <StatCard 
          icon={RefreshCw}
          label="Idle"
          value={stats.idle}
          color="text-text-tertiary"
        />
      </div>

      {/* My Status */}
      <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">Your status:</span>
            <PresenceBadge status={myPresence.status} />
          </div>
          {myPresence.currentTask && (
            <span className="text-sm text-text-secondary">
              Working on: <span className="text-text-primary font-medium">{myPresence.currentTask}</span>
            </span>
          )}
        </div>
      </div>

      {/* Team Grid */}
      {members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(member => (
            <TeamMemberCard
              key={member.userId}
              member={member}
              onCowork={handleCowork}
              onMessage={handleMessage}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

/**
 * Stat Card
 */
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-text-tertiary">{label}</span>
      </div>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
  );
}

/**
 * Arena Settings Panel
 */
function ArenaSettings({ preferences, updatePreferences, onClose }) {
  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Arena Settings</h3>
        <button 
          onClick={onClose}
          className="text-text-tertiary hover:text-text-primary"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-3">
        <SettingToggle
          label="Share what I'm working on"
          description="Others can see your current task"
          checked={preferences.shareActivity}
          onChange={(v) => updatePreferences({ shareActivity: v })}
        />
        <SettingToggle
          label="Show my online status"
          description="Others can see when you're active"
          checked={preferences.shareStatus}
          onChange={(v) => updatePreferences({ shareStatus: v })}
        />
        <SettingToggle
          label="Allow co-work requests"
          description="Others can invite you to co-work"
          checked={preferences.allowCoworkRequests}
          onChange={(v) => updatePreferences({ allowCoworkRequests: v })}
        />
      </div>
    </div>
  );
}

/**
 * Setting Toggle
 */
function SettingToggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <div>
        <span className="text-sm text-text-primary">{label}</span>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative w-11 h-6 rounded-full transition-colors
          ${checked ? 'bg-brand' : 'bg-surface-3'}
        `}
      >
        <span className={`
          absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
          ${checked ? 'left-6' : 'left-1'}
        `} />
      </button>
    </label>
  );
}

/**
 * Empty State
 */
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-lg font-medium text-text-primary mb-2">
        No one's here yet
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mx-auto">
        Invite your team to ShareSync to see them in the Live Arena.
      </p>
    </div>
  );
}
