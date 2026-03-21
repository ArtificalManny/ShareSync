// src/components/members/MembersList.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MEMBERS LIST — Real data, light theme, avatar + name + bio + role badge
// Owner/moderator at top, clean hierarchy display
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Crown, Shield, User, MoreVertical } from 'lucide-react';

// ─── Avatar colors for initials fallback ────────────────────────────────────

const AVATAR_COLORS = [
  { bg: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-700 dark:text-violet-300' },
  { bg: 'bg-cyan-100 dark:bg-cyan-500/20', text: 'text-cyan-700 dark:text-cyan-300' },
  { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300' },
  { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-300' },
  { bg: 'bg-sky-100 dark:bg-sky-500/20', text: 'text-sky-700 dark:text-sky-300' },
];

function getColorByName(name) {
  const charCode = (name || 'A').charCodeAt(0);
  return AVATAR_COLORS[charCode % AVATAR_COLORS.length];
}

function getDisplayName(member) {
  if (member.firstName) {
    return (member.firstName + ' ' + (member.lastName || '')).trim();
  }
  if (member.username) return member.username;
  return 'Unknown';
}

function getInitials(member) {
  const name = getDisplayName(member);
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ─── Role config ────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  owner: {
    label: 'Owner',
    icon: Crown,
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/20',
    text: 'text-amber-700 dark:text-amber-400',
    iconColor: 'text-amber-500',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    border: 'border-violet-200 dark:border-violet-500/20',
    text: 'text-violet-700 dark:text-violet-400',
    iconColor: 'text-violet-500',
  },
  member: {
    label: 'Member',
    icon: User,
    bg: 'bg-slate-50 dark:bg-white/[0.04]',
    border: 'border-slate-200 dark:border-white/[0.08]',
    text: 'text-slate-600 dark:text-white/50',
    iconColor: 'text-slate-400',
  },
};

// ─── Avatar Component ───────────────────────────────────────────────────────

function MemberAvatar({ member, size = 'md' }) {
  const avatarUrl = member.avatar || member.profilePicture || null;
  const name = getDisplayName(member);
  const color = getColorByName(name);
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0 border-2 border-white dark:border-white/10`}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full ${color.bg} flex items-center justify-center font-semibold ${color.text} flex-shrink-0 border-2 border-white dark:border-white/10`}
    >
      {getInitials(member)}
    </div>
  );
}

// ─── Compact View (just stacked avatars) ────────────────────────────────────

function CompactView({ members }) {
  return (
    <div className="flex items-center -space-x-2">
      {members.slice(0, 5).map((member) => (
        <MemberAvatar key={member.id} member={member} size="sm" />
      ))}
      {members.length > 5 && (
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.08] border-2 border-white dark:border-white/10 flex items-center justify-center text-[10px] font-semibold text-slate-500 dark:text-white/40">
          +{members.length - 5}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const MembersList = ({ members = [], currentUserId, isModerator = false, compact = false, onRemoveMember }) => {
  if (compact) {
    return <CompactView members={members} />;
  }

  if (members.length === 0) {
    return (
      <div className="py-8 text-center">
        <User className="w-8 h-8 text-slate-300 dark:text-white/20 mx-auto mb-2" />
        <p className="text-xs text-slate-400 dark:text-white/30">No members yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {members.map((member) => {
        const role = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
        const RoleIcon = role.icon;
        const isCurrentUser = String(member.id) === String(currentUserId);
        const name = getDisplayName(member);

        return (
          <div
            key={member.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              member.role === 'owner'
                ? 'bg-amber-50/50 dark:bg-amber-500/[0.05] border border-amber-100 dark:border-amber-500/10'
                : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
            }`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <MemberAvatar member={member} size="md" />
              {member.role === 'owner' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                  <Crown className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-800 dark:text-white truncate">
                  {name}
                </span>
                {isCurrentUser && (
                  <span className="text-[10px] text-slate-400 dark:text-white/30 font-normal">(you)</span>
                )}
              </div>

              {/* Bio / headline */}
              {member.bio ? (
                <p className="text-xs text-slate-500 dark:text-white/40 truncate mt-0.5 leading-relaxed">
                  {member.bio}
                </p>
              ) : member.email ? (
                <p className="text-xs text-slate-400 dark:text-white/30 truncate mt-0.5">
                  {member.email}
                </p>
              ) : member.username ? (
                <p className="text-xs text-slate-400 dark:text-white/30 truncate mt-0.5">
                  @{member.username}
                </p>
              ) : null}
            </div>

            {/* Role Badge */}
            <div
              className={`px-2 py-1 ${role.bg} border ${role.border} rounded-lg text-[10px] font-semibold ${role.text} flex items-center gap-1 flex-shrink-0`}
            >
              <RoleIcon className={`w-3 h-3 ${role.iconColor}`} />
              {role.label}
            </div>

            {/* Actions (moderator can manage non-owner members) */}
            {isModerator && !isCurrentUser && member.role !== 'owner' && (
              <button
                className="p-1.5 rounded-lg text-slate-300 dark:text-white/20 hover:text-slate-500 dark:hover:text-white/40 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors flex-shrink-0"
                title="Manage member"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MembersList;
