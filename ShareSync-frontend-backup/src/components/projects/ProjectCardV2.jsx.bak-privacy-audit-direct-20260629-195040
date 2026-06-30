// src/components/projects/ProjectCardV2.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT CARD V2.5 - Mission Card Rebalance
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHAT CHANGED IN V2.5:
// - Rebalances the card around decision-grade signals instead of placeholders
// - Promotes state badge and primary action line
// - Replaces "velocity + tasks" as the main story with:
//   Momentum / Risk / Activity
// - Adds a human footer with member stack + activity text
// - Preserves safe fallbacks and careful click behavior
//
// NOTE:
// - This file redesigns the canonical grid card
// - The Projects page must still be wired to render ProjectCardV2
//
// NO BACKEND CHANGES
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Play,
  ShieldAlert,
  Users,
  Zap,
} from 'lucide-react';
import { useLivingCard } from '../../hooks/useLivingCard';
import ProjectAvatar from '../project/ProjectAvatar';

const DEFAULT_COLOR = '#8B5CF6';

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function timeAgo(date) {
  if (!date) return null;
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  if (Number.isNaN(diffMs) || diffMs < 0) return null;

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

const RAW_API_BASE =
  import.meta?.env?.VITE_API_URL ||
  import.meta?.env?.VITE_BACKEND_URL ||
  'http://localhost:3000';

const API_ASSET_ORIGIN = String(RAW_API_BASE).replace(/\/api\/?$/, '').replace(/\/$/, '');

function normalizeAvatarSrc(value) {
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    return `${API_ASSET_ORIGIN}/${trimmed.replace(/^\/+/, '')}`;
  }

  return trimmed;
}

function unwrapMemberUser(member) {
  if (!member || typeof member !== 'object') return member;

  const nested =
    member.user ||
    member.userId ||
    member.member ||
    member.profile ||
    null;

  if (nested && typeof nested === 'object') {
    return {
      ...nested,
      role: member.role ?? nested.role,
      displayRole: member.displayRole ?? nested.displayRole,
    };
  }

  return member;
}

function getMemberId(member) {
  const user = unwrapMemberUser(member);

  return String(
    user?._id ||
      user?.id ||
      member?.userId ||
      member?.user ||
      member?._id ||
      member?.id ||
      member?.email ||
      ''
  );
}

function getMemberName(member) {
  const user = unwrapMemberUser(member);

  return (
    user?.name ||
    user?.fullName ||
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.username ||
    user?.email ||
    'Member'
  );
}

function getMemberAvatar(member) {
  const user = unwrapMemberUser(member);

  return normalizeAvatarSrc(
    user?.avatarUrl ||
      user?.profilePicture ||
      user?.profileImage ||
      user?.avatar ||
      user?.imageUrl ||
      user?.photoUrl ||
      member?.avatarUrl ||
      member?.profilePicture ||
      member?.profileImage ||
      member?.avatar ||
      member?.imageUrl ||
      member?.photoUrl ||
      null
  );
}

function buildProjectMemberStack(project) {
  const seen = new Set();
  const stack = [];

  const addMember = (candidate) => {
    if (!candidate) return;

    const id = getMemberId(candidate);
    const name = getMemberName(candidate);

    const dedupeKey = id || name;
    if (dedupeKey && seen.has(dedupeKey)) return;
    if (dedupeKey) seen.add(dedupeKey);

    stack.push(candidate);
  };

  addMember(project?.owner || project?.ownerId);

  const rawMembers = Array.isArray(project?.members)
    ? project.members
    : Array.isArray(project?.team)
      ? project.team
      : [];

  rawMembers.forEach(addMember);

  return stack;
}

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

function MiniMemberStack({ members, fallbackCount = 0, color = DEFAULT_COLOR }) {
  const visibleMembers = Array.isArray(members) ? members.slice(0, 3) : [];
  const hiddenCount = Math.max((members?.length || fallbackCount || 0) - visibleMembers.length, 0);

  if (visibleMembers.length === 0 && fallbackCount <= 0) {
    return (
      <div
        className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0"
        style={{
          backgroundColor: `${color}12`,
          borderColor: `${color}28`,
          color,
        }}
      >
        <Users className="w-4 h-4" />
      </div>
    );
  }

  return (
    <div className="flex items-center -space-x-2 shrink-0">
      {visibleMembers.map((member, idx) => {
        const memberName = getMemberName(member);
        const avatar = getMemberAvatar(member);

        return (
          <div
            key={getMemberId(member) || `${memberName}-${idx}`}
            className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm flex items-center justify-center text-[10px] font-semibold text-slate-700 bg-slate-100"
            title={memberName}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={memberName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{getInitials(memberName)}</span>
            )}
          </div>
        );
      })}

      {hiddenCount > 0 && (
        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-500 text-[10px] font-semibold flex items-center justify-center shadow-sm">
          +{hiddenCount}
        </div>
      )}
    </div>
  );
}

function SignalChip({ icon: Icon, label, value, tone = 'neutral' }) {
  const toneClasses = {
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <div
      className={`project-card-v2-signal project-card-v2-signal-${tone} flex items-center gap-2 rounded-lg border px-2.5 py-2 min-w-0 ${toneClasses[tone] || toneClasses.neutral}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide opacity-75">{label}</div>
        <div className="text-xs font-semibold truncate">{value}</div>
      </div>
    </div>
  );
}

export default function ProjectCardV2({
  project,
  onProjectClick,
  onStartSprint,
  className = '',
}) {
  if (!project) return null;

  const projectId = project?._id || project?.id;
  const name = project?.name || project?.title || 'Untitled Project';
  const color = project?.color || DEFAULT_COLOR;
  const description = project?.description || project?.subtitle || 'No description provided.';

  const totalTasks = safeNumber(
    project?.taskCount ?? project?.totalTasks ?? project?.tasks?.length,
    0
  );
  const completedTasks = safeNumber(
    project?.completedTasks ?? project?.doneCount,
    0
  );
  const openTasks = safeNumber(
    project?.metrics?.openTasks?.value,
    Math.max(totalTasks - completedTasks, 0)
  );
  const rawProgress = safeNumber(
    project?.progress,
    safeNumber(project?.metrics?.onTimePercent?.value, 0)
  );
  const progress = Math.min(Math.max(rawProgress, 0), 100);

  const streak = safeNumber(project?.streak?.value ?? project?.streak, 0);
  const isImpressiveStreak = streak >= 7;

  const members = useMemo(() => buildProjectMemberStack(project), [project]);

  const memberCount = Math.max(
    safeNumber(
      project?.memberCount ??
        project?.membersCount ??
        project?.metrics?.memberCount?.value ??
        project?.metrics?.memberCount,
      0
    ),
    members.length
  );

  const onlineCount = safeNumber(
    project?.onlineCount ??
      project?.onlineUsers ??
      project?.onlineUsersCount ??
      project?.membersOnline ??
      project?.presence?.online ??
      project?.metrics?.online?.value,
    0
  );

  const blockers = useMemo(() => {
    if (Array.isArray(project?.blockers)) return project.blockers.filter(Boolean);
    return [];
  }, [project?.blockers]);

  const blockerCount = Math.max(
    safeNumber(project?.blockerCount, blockers.length),
    blockers.length
  );

  const lastActivity = project?.lastActivity || project?.lastShipAt || project?.lastShippedAt || project?.updatedAt || null;
  const lastActivityText = useMemo(() => timeAgo(lastActivity), [lastActivity]);

  const status = project?.status || (project?.isAtRisk ? 'at-risk' : 'active');
  const priority = project?.priority || 'normal';
  const dueDate = project?.dueDate || project?.targetDate || null;
  const completedAt = project?.completedAt || null;
  const isBlocked = Boolean(project?.isBlocked) || blockerCount > 0;

  const livingState = useLivingCard({
    progress,
    priority,
    status,
    lastActivity,
    dueDate,
    completedAt,
    isBlocked,
    blockers,
  });

  const isComplete = progress >= 100 || status === 'completed' || Boolean(completedAt);

  const stateMeta = useMemo(() => {
    if (isComplete) {
      return {
        label: 'Completed',
        tone: 'emerald',
      };
    }

    if (livingState?.isBlocked || blockerCount > 0) {
      return {
        label: 'Blocked',
        tone: 'red',
      };
    }

    if (livingState?.state === 'overdue' || project?.isAtRisk) {
      return {
        label: 'Needs Attention',
        tone: 'amber',
      };
    }

    if (livingState?.state === 'stale') {
      return {
        label: 'Quiet',
        tone: 'slate',
      };
    }

    if (livingState?.state === 'completing' || progress >= 80) {
      return {
        label: 'Strong',
        tone: 'emerald',
      };
    }

    if (progress > 0 || openTasks > 0) {
      return {
        label: 'Building',
        tone: 'violet',
      };
    }

    return {
      label: 'Planning',
      tone: 'blue',
    };
  }, [isComplete, livingState, blockerCount, project?.isAtRisk, progress, openTasks]);

  const stateBadgeClasses = {
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const primaryCue = useMemo(() => {
    const firstBlocker =
      blockers[0]?.title ||
      blockers[0]?.message ||
      blockers[0]?.reason ||
      (typeof blockers[0] === 'string' ? blockers[0] : null);

    if (livingState?.isBlocked || blockerCount > 0) {
      return {
        label: 'Blocked',
        value: firstBlocker || project?.blockedReason || 'Resolve blockers to move this project forward.',
        tone: 'red',
      };
    }

    if (project?.nextMicroStep) {
      return {
        label: 'Next Move',
        value: project.nextMicroStep,
        tone: 'violet',
      };
    }

    if (livingState?.state === 'stale') {
      return {
        label: 'Quiet',
        value: 'No recent movement — define the next move to restart momentum.',
        tone: 'slate',
      };
    }

    if (openTasks > 0) {
      return {
        label: 'Ready',
        value: `${pluralize(openTasks, 'active task', 'active tasks')} waiting for a push.`,
        tone: 'blue',
      };
    }

    return {
      label: 'Ready',
      value: 'Set the first meaningful move to activate this project.',
      tone: 'blue',
    };
  }, [livingState, blockerCount, blockers, project?.blockedReason, project?.nextMicroStep, openTasks]);

  const momentumSignal = useMemo(() => {
    if (isComplete) {
      return { label: 'Momentum', value: 'Complete', tone: 'emerald' };
    }
    if (livingState?.isBlocked || blockerCount > 0) {
      return { label: 'Momentum', value: 'Stalled', tone: 'red' };
    }
    if (livingState?.state === 'stale') {
      return { label: 'Momentum', value: 'Quiet', tone: 'slate' };
    }
    if (livingState?.state === 'completing' || progress >= 80) {
      return { label: 'Momentum', value: 'Strong', tone: 'emerald' };
    }
    if (progress > 0) {
      return { label: 'Momentum', value: 'Building', tone: 'violet' };
    }
    if (openTasks > 0) {
      return { label: 'Momentum', value: 'Ready', tone: 'blue' };
    }
    return { label: 'Momentum', value: 'Planning', tone: 'blue' };
  }, [isComplete, livingState, blockerCount, progress, openTasks]);

  const riskSignal = useMemo(() => {
    if (livingState?.isBlocked || blockerCount > 0) {
      return {
        label: 'Risk',
        value: blockerCount > 0 ? pluralize(blockerCount, 'blocker', 'blockers') : 'Blocked',
        tone: 'red',
      };
    }

    if (livingState?.state === 'overdue' || project?.isAtRisk) {
      return {
        label: 'Risk',
        value: 'Needs attention',
        tone: 'amber',
      };
    }

    return {
      label: 'Risk',
      value: 'Clear',
      tone: 'emerald',
    };
  }, [livingState, blockerCount, project?.isAtRisk]);

  const activitySignal = useMemo(() => {
    if (onlineCount > 0) {
      return {
        label: 'Activity',
        value: pluralize(onlineCount, 'online', 'online'),
        tone: 'violet',
        icon: Users,
      };
    }

    if (lastActivityText) {
      return {
        label: 'Activity',
        value: `Updated ${lastActivityText}`,
        tone: 'slate',
        icon: Clock3,
      };
    }

    if (memberCount > 0) {
      return {
        label: 'Activity',
        value: pluralize(memberCount, 'member', 'members'),
        tone: 'blue',
        icon: Users,
      };
    }

    return {
      label: 'Activity',
      value: 'No recent signal',
      tone: 'slate',
      icon: Clock3,
    };
  }, [onlineCount, lastActivityText, memberCount]);

  const handleOpenProject = (e) => {
    e.stopPropagation();
    if (!projectId) {
      console.warn('[ProjectCardV2] No ID found for project:', name);
      return;
    }
    onProjectClick?.(projectId);
  };

  const handleCardClick = () => {
    if (!projectId) {
      console.warn('[ProjectCardV2] No ID found for project:', name);
      return;
    }
    onProjectClick?.(projectId);
  };

  const handleStartSprint = (e) => {
    e.stopPropagation();
    onStartSprint?.(project);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`
        project-card-v2-shell group relative overflow-hidden rounded-2xl cursor-pointer flex flex-col justify-between
        bg-white border border-slate-200/90
        transition-all duration-200 hover:-translate-y-0.5
        ${className}
      `}
      style={{
        boxShadow: '0 6px 24px rgba(139, 92, 246, 0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 14px 36px rgba(139, 92, 246, 0.12)';
        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(139, 92, 246, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)';
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: color }}
      />

      <div className="p-5">
        {/* Top row: identity + state */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <ProjectAvatar
              project={project}
              size="md"
              className="transition-transform duration-200 group-hover:scale-105"
            />

            <div className="min-w-0 pt-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 truncate group-hover:text-violet-700 transition-colors">
                  {name}
                </h3>
                {streak > 0 && (
                  <div
                    className={`
                      hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium shrink-0
                      ${isImpressiveStreak
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-slate-100 text-slate-500'
                      }
                    `}
                  >
                    <Flame className="w-3 h-3" />
                    <span>{streak}d</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-500 truncate mt-1">
                {description}
              </p>
            </div>
          </div>

          <div
            className={`project-card-v2-state-badge project-card-v2-state-${stateMeta.tone} shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stateBadgeClasses[stateMeta.tone]}`}
          >
            {stateMeta.label}
          </div>
        </div>

        {/* Main focus: next move / blocked / ready */}
        <div
          className={`
            project-card-v2-cue project-card-v2-cue-${primaryCue.tone} rounded-xl border p-3.5 mb-4
            ${primaryCue.tone === 'red'
              ? 'bg-red-50 border-red-200'
              : primaryCue.tone === 'violet'
                ? 'bg-violet-50 border-violet-200'
                : primaryCue.tone === 'blue'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-slate-50 border-slate-200'
            }
          `}
        >
          <div
            className={`
              text-[10px] uppercase tracking-[0.14em] mb-1.5 font-semibold
              ${primaryCue.tone === 'red'
                ? 'text-red-600'
                : primaryCue.tone === 'violet'
                  ? 'text-violet-600'
                  : primaryCue.tone === 'blue'
                    ? 'text-blue-600'
                    : 'text-slate-500'
              }
            `}
          >
            {primaryCue.label}
          </div>
          <div className="text-sm font-medium text-slate-800 leading-5">
            {primaryCue.value}
          </div>
        </div>

        {/* Signal row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
          <SignalChip
            icon={Zap}
            label={momentumSignal.label}
            value={momentumSignal.value}
            tone={momentumSignal.tone}
          />
          <SignalChip
            icon={ShieldAlert}
            label={riskSignal.label}
            value={riskSignal.value}
            tone={riskSignal.tone}
          />
          <SignalChip
            icon={activitySignal.icon}
            label={activitySignal.label}
            value={activitySignal.value}
            tone={activitySignal.tone}
          />
        </div>

        {/* Secondary progress strip */}
        <div className="project-card-v2-progress rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500 font-semibold">
              Progress
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background:
                  isComplete
                    ? 'linear-gradient(90deg, #10B981 0%, #34D399 100%)'
                    : livingState?.isBlocked || blockerCount > 0
                      ? 'linear-gradient(90deg, #EF4444 0%, #F87171 100%)'
                      : 'linear-gradient(90deg, #7C3AED 0%, #8B5CF6 55%, #A855F7 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="project-card-v2-footer px-5 py-4 border-t border-slate-100 bg-white/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <MiniMemberStack
              members={members}
              fallbackCount={memberCount}
              color={color}
            />

            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-700 truncate">
                {memberCount > 0 ? pluralize(memberCount, 'member', 'members') : 'No members yet'}
                {onlineCount > 0 ? ` · ${pluralize(onlineCount, 'online', 'online')}` : ''}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {lastActivityText ? `Updated ${lastActivityText}` : 'Waiting for the next signal'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onStartSprint ? (
              <button
                type="button"
                onClick={handleStartSprint}
                className="
                  hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg
                  border border-violet-200 text-violet-700 bg-violet-50
                  hover:bg-violet-100 transition-colors text-xs font-semibold
                "
              >
                <Play className="w-3.5 h-3.5" />
                Sprint
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleOpenProject}
              className="
                inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg
                text-white text-xs font-semibold
                transition-all duration-200
              "
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 55%, #A855F7 100%)',
                boxShadow: '0 10px 20px rgba(124, 58, 237, 0.22)',
              }}
            >
              Open
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
