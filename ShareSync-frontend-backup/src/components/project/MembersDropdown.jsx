// src/components/project/MembersDropdown.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MEMBERS DROPDOWN — Lightweight team roster that lives in the project header
// ─────────────────────────────────────────────────────────────────────────────
// BEHAVIORAL SCIENCE:
//   • Social proof: visible member count + avatars = "others are invested here"
//   • Accountability: online dots + roles make work visible
//   • Belonging: crown icon for owner + warm invite CTA = identity formation
// DESIGN PRINCIPLES:
//   • Same elevation as other header dropdowns (shadow-xl, rounded-2xl)
//   • Violet accent for invite CTA, neutral for everything else (hierarchy)
//   • Stacked mini-avatars on the trigger button (social density cue)
//   • Max 400px height with scroll, never occludes more than 1/3 of viewport
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import {
  Users, UserPlus, Crown, Shield, Eye, ChevronDown, X,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(member, fallback = '?') {
  if (member?.firstName) {
    return `${member.firstName[0]}${(member.lastName || '')[0] || ''}`.toUpperCase();
  }
  if (member?.username) return member.username[0].toUpperCase();
  if (member?.email) return member.email[0].toUpperCase();
  return fallback;
}

function getDisplayName(member) {
  if (member?.firstName) {
    return `${member.firstName} ${member.lastName || ''}`.trim();
  }
  if (member?.username) return member.username;
  if (member?.email) return member.email;
  return 'Team Member';
}

function getRoleBadge(role) {
  switch (role) {
    case 'admin':
      return { label: 'Admin', icon: Shield, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' };
    case 'viewer':
      return { label: 'Viewer', icon: Eye, color: 'text-slate-500 dark:text-white/40', bg: 'bg-slate-100 dark:bg-white/[0.06]' };
    default:
      return { label: 'Member', icon: Users, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' };
  }
}

// Color palette for avatar backgrounds (deterministic by index)
const AVATAR_COLORS = [
  { bg: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-700 dark:text-violet-300' },
  { bg: 'bg-cyan-100 dark:bg-cyan-500/20', text: 'text-cyan-700 dark:text-cyan-300' },
  { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300' },
  { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-300' },
  { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300' },
];

function getAvatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// ─── Member Row ─────────────────────────────────────────────────────────────

function MemberRow({ member, isOwner, colorIndex = 0 }) {
  const initials = getInitials(member);
  const name = getDisplayName(member);
  const roleBadge = isOwner ? null : getRoleBadge(member?.role);
  const avatarColor = getAvatarColor(colorIndex);

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors rounded-lg">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className={`w-9 h-9 rounded-full ${avatarColor.bg} flex items-center justify-center`}>
          <span className={`text-xs font-bold ${avatarColor.text}`}>{initials}</span>
        </div>
        {/* Online dot — subtle emerald for "recently active" feel */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#1f1f23] bg-slate-300 dark:bg-zinc-600" />
      </div>

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{name}</p>
          {isOwner && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10">
              <Crown className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Owner</span>
            </div>
          )}
        </div>
        {!isOwner && roleBadge && (
          <p className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">
            {roleBadge.label}
          </p>
        )}
        {member?.email && (
          <p className="text-[11px] text-slate-400 dark:text-white/30 truncate">{member.email}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function MembersDropdown({ project, onInvite }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Build team list: owner first, then members
  const owner = project?.ownerId
    ? {
        _id: typeof project.ownerId === 'string' ? project.ownerId : project.ownerId?._id || project.ownerId,
        firstName: project.ownerName?.split?.(' ')?.[0] || project.ownerId?.firstName || null,
        lastName: project.ownerName?.split?.(' ')?.[1] || project.ownerId?.lastName || null,
        username: project.ownerId?.username || null,
        email: project.ownerId?.email || null,
      }
    : null;

  const members = Array.isArray(project?.members) ? project.members : [];
  const totalCount = 1 + members.length; // owner + members

  // Mini avatar stack for the trigger button (show up to 3)
  const miniAvatars = [owner, ...members].filter(Boolean).slice(0, 3);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ═══════════════════════════════════════════════════════════════════
          TRIGGER BUTTON — matches Activity button styling
          Shows stacked mini avatars + count for social density
      ═══════════════════════════════════════════════════════════════════ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl
          bg-white border shadow-sm text-sm
          transition-all duration-200
          ${isOpen
            ? 'border-violet-300 bg-violet-50 text-violet-700 shadow-violet-500/10'
            : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
          }
        `}
      >
        {/* Stacked mini avatars */}
        <div className="flex items-center -space-x-1.5">
          {miniAvatars.map((m, i) => {
            const color = getAvatarColor(i);
            return (
              <div
                key={i}
                className={`w-5 h-5 rounded-full ${color.bg} flex items-center justify-center border-2 border-white`}
                style={{ zIndex: miniAvatars.length - i }}
              >
                <span className={`text-[8px] font-bold ${color.text}`}>
                  {getInitials(m)}
                </span>
              </div>
            );
          })}
        </div>

        <span className="font-medium">Team</span>

        {/* Count badge */}
        <span className="px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-600 text-xs font-semibold">
          {totalCount}
        </span>
      </button>

      {/* ═══════════════════════════════════════════════════════════════════
          DROPDOWN PANEL
      ═══════════════════════════════════════════════════════════════════ */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-80
            bg-white dark:bg-[#1f1f23]
            border border-slate-200 dark:border-white/[0.10]
            rounded-2xl shadow-xl
            z-50 overflow-hidden
            animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                Team
              </h3>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/40">
                {totalCount}
              </span>
            </div>

            {/* Invite button */}
            <button
              onClick={() => {
                setIsOpen(false);
                onInvite?.();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                bg-violet-600 hover:bg-violet-700 text-white
                transition-colors shadow-sm"
            >
              <UserPlus className="w-3 h-3" />
              Invite
            </button>
          </div>

          {/* Member list */}
          <div className="py-1.5 max-h-[340px] overflow-y-auto">
            {/* Owner */}
            {owner && (
              <MemberRow member={owner} isOwner colorIndex={0} />
            )}

            {/* Members */}
            {members.map((m, i) => {
              // Members might have nested userId object or flat fields
              const memberData = {
                _id: m?.userId?._id || m?.userId || m?._id,
                firstName: m?.userId?.firstName || m?.firstName || null,
                lastName: m?.userId?.lastName || m?.lastName || null,
                username: m?.userId?.username || m?.username || null,
                email: m?.userId?.email || m?.email || null,
                role: m?.role || 'member',
              };
              return (
                <MemberRow
                  key={memberData._id?.toString?.() || i}
                  member={memberData}
                  isOwner={false}
                  colorIndex={i + 1}
                />
              );
            })}

            {/* Empty state (only owner, no members) */}
            {members.length === 0 && (
              <div className="px-4 py-6 text-center">
                <div className="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-500/10 mx-auto mb-3 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-violet-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-white/50 mb-1">
                  Just you for now
                </p>
                <p className="text-xs text-slate-400 dark:text-white/30">
                  Invite teammates to build momentum together.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
