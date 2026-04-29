// src/components/members/MembersList.jsx - Display project members
import React, { useState } from 'react';
import {
  Check,
  Crown,
  Loader2,
  MoreVertical,
  Star,
  Tag,
  Trash2,
  X,
} from 'lucide-react';

/**
 * MembersList - Display all project members with permission roles and custom display roles.
 *
 * Important distinction:
 * - member.role / member.permissionRole controls permissions: owner/admin/member
 * - member.displayRole is only a human-facing label: Manager/Boss/Developer/etc.
 */
const RECOMMENDED_DISPLAY_ROLES = [
  'Manager',
  'Boss',
  'Developer',
  'Designer',
  'Researcher',
  'Coordinator',
  'Contributor',
  'Observer',
];

const normalizeId = (value) => String(value || '').trim();

const MembersList = ({
  members = [],
  currentUserId,
  isModerator = false,
  onUpdateMemberDisplayRole,
  onRemoveMember,
  compact = false,
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [customEditorId, setCustomEditorId] = useState(null);
  const [customRole, setCustomRole] = useState('');
  const [pendingRoleId, setPendingRoleId] = useState(null);
  const [pendingRemoveId, setPendingRemoveId] = useState(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getRoleBadge = (role) => {
    const badges = {
      owner: {
        icon: <Crown className="w-3 h-3" />,
        label: 'Owner',
        color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-500 dark:text-yellow-400',
      },
      admin: {
        icon: <Star className="w-3 h-3" />,
        label: 'Admin',
        color: 'bg-purple-500/20 border-purple-500/30 text-purple-600 dark:text-purple-400',
      },
      member: {
        icon: null,
        label: 'Member',
        color: 'bg-slate-200/50 border-slate-300 text-slate-600 dark:bg-slate-500/20 dark:border-slate-500/30 dark:text-slate-400',
      },
    };

    return badges[role] || badges.member;
  };

  const getPermissionRole = (member) => member.permissionRole || member.role || 'member';

  const openActionsFor = (member) => {
    const memberId = normalizeId(member.id);
    const nextOpen = openMenuId === memberId ? null : memberId;

    setOpenMenuId(nextOpen);
    setConfirmRemoveId(null);

    if (nextOpen) {
      setCustomEditorId(null);
      setCustomRole(member.displayRole || '');
    }
  };

  const closeActions = () => {
    setOpenMenuId(null);
    setCustomEditorId(null);
    setCustomRole('');
    setConfirmRemoveId(null);
  };

  const handleRoleSelect = async (member, displayRole) => {
    const memberId = normalizeId(member.id);
    const normalizedRole = String(displayRole || '').replace(/\s+/g, ' ').trim();

    if (!memberId || !normalizedRole || typeof onUpdateMemberDisplayRole !== 'function') return;

    setPendingRoleId(memberId);

    try {
      await onUpdateMemberDisplayRole(memberId, normalizedRole);
      closeActions();
    } finally {
      setPendingRoleId(null);
    }
  };

  const handleCustomRoleSave = async (member) => {
    const normalizedRole = String(customRole || '').replace(/\s+/g, ' ').trim();

    if (!normalizedRole) return;
    if (normalizedRole.length > 40) return;

    await handleRoleSelect(member, normalizedRole);
  };

  const handleRemove = async (member) => {
    const memberId = normalizeId(member.id);

    if (!memberId || typeof onRemoveMember !== 'function') return;

    if (confirmRemoveId !== memberId) {
      setConfirmRemoveId(memberId);
      return;
    }

    setPendingRemoveId(memberId);

    try {
      await onRemoveMember(memberId, member.name || 'Member');
      closeActions();
    } finally {
      setPendingRemoveId(null);
      setConfirmRemoveId(null);
    }
  };

  if (compact) {
    // Compact view - just avatars
    return (
      <div className="flex items-center -space-x-2">
        {members.slice(0, 5).map((member, idx) => (
          <div
            key={member.id || idx}
            className="w-8 h-8 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-sm font-bold text-white"
            title={member.name}
          >
            {member.avatar ? (
              <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(member.name)
            )}
          </div>
        ))}
        {members.length > 5 && (
          <div className="w-8 h-8 bg-slate-700 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-300">
            +{members.length - 5}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const memberId = normalizeId(member.id);
        const permissionRole = getPermissionRole(member);
        const badge = getRoleBadge(permissionRole);
        const isCurrentUser = memberId === normalizeId(currentUserId);
        const hasDisplayRole = Boolean(String(member.displayRole || '').trim());
        const canManageMember = Boolean(
          isModerator &&
          !isCurrentUser &&
          permissionRole !== 'owner' &&
          memberId
        );
        const menuOpen = openMenuId === memberId;
        const rolePending = pendingRoleId === memberId;
        const removePending = pendingRemoveId === memberId;
        const customOpen = customEditorId === memberId;

        return (
          <div
            key={memberId || member.email || member.name}
            className="relative flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] rounded-xl transition-all border border-transparent dark:border-white/[0.02]"
          >
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 overflow-hidden">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(member.name)
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                  {member.name}
                  {isCurrentUser && (
                    <span className="text-[11px] font-bold text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-500/20 px-2 py-0.5 rounded-md tracking-wide uppercase">
                      (you)
                    </span>
                  )}
                </span>
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {member.email}
                </p>

                {hasDisplayRole && permissionRole !== 'owner' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
                    <Tag className="h-3 w-3" />
                    {member.displayRole}
                  </span>
                )}
              </div>
            </div>

            {/* Permission Role Badge */}
            <div className={`px-3 py-1 ${badge.color} border rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0`}>
              {badge.icon}
              {badge.label}
            </div>

            {/* Actions */}
            {canManageMember ? (
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => openActionsFor(member)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label={`Manage ${member.name}`}
                >
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-10 z-30 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-white/[0.08] dark:bg-[#18181d] dark:shadow-black/40">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/[0.06]">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Assign display role
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          This label does not change permissions.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeActions}
                        className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                        aria-label="Close member actions"
                      >
                        <X className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>

                    <div className="p-3">
                      <div className="grid grid-cols-2 gap-2">
                        {RECOMMENDED_DISPLAY_ROLES.map((roleName) => {
                          const selected = member.displayRole === roleName;

                          return (
                            <button
                              key={roleName}
                              type="button"
                              disabled={rolePending}
                              onClick={() => handleRoleSelect(member, roleName)}
                              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all ${
                                selected
                                  ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/40 dark:bg-violet-500/15 dark:text-violet-300'
                                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-200 hover:bg-violet-50 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-violet-500/25 dark:hover:bg-violet-500/10'
                              }`}
                            >
                              <span>{roleName}</span>
                              {selected && <Check className="h-3.5 w-3.5" />}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-white/[0.06] dark:bg-white/[0.03]">
                        {!customOpen ? (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomEditorId(memberId);
                              setCustomRole(member.displayRole || '');
                            }}
                            className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-white dark:text-zinc-300 dark:hover:bg-white/[0.06]"
                          >
                            Custom role...
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <input
                              value={customRole}
                              onChange={(event) => setCustomRole(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  handleCustomRoleSave(member);
                                }

                                if (event.key === 'Escape') {
                                  setCustomEditorId(null);
                                }
                              }}
                              maxLength={40}
                              placeholder="Example: Frontend Lead"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-[#111113] dark:text-white dark:focus:border-violet-500/40 dark:focus:ring-violet-500/10"
                              autoFocus
                            />
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] text-slate-400">
                                {customRole.trim().length}/40
                              </span>
                              <button
                                type="button"
                                disabled={rolePending || !customRole.trim()}
                                onClick={() => handleCustomRoleSave(member)}
                                className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
                              >
                                {rolePending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                Save
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
                        <button
                          type="button"
                          disabled={removePending}
                          onClick={() => handleRemove(member)}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                            confirmRemoveId === memberId
                              ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
                              : 'border-transparent text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10'
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            {removePending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            {confirmRemoveId === memberId ? 'Click again to remove' : 'Remove from project'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-8 flex-shrink-0" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MembersList;
