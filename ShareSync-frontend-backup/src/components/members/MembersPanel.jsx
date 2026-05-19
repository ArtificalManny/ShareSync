// src/components/members/MembersPanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MEMBERS PANEL — Real project data, sorted role hierarchy, invite wiring
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import MembersList from './MembersList';
import InviteMember from './InviteMember';
import { useAuth } from '../../context/AuthContext';
import { sendInvite } from '../../api/invites';
import { getProject, removeProjectMember, updateProjectMemberDisplayRole } from '../../api/projects';
import { toast } from '../ui/toast';

const MembersPanel = ({ projectId, project, onClose, onProjectUpdated }) => {
  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);
  const [projectSnapshot, setProjectSnapshot] = useState(project || null);

  const currentUserId = user?.id || user?._id || user?.userId || '';
  const rawApiBase =
    import.meta?.env?.VITE_API_URL ||
    import.meta?.env?.VITE_BACKEND_URL ||
    'http://localhost:3000';

  const apiAssetOrigin = String(rawApiBase).replace(/\/api\/?$/, '').replace(/\/$/, '');

  const normalizeAvatarSrc = (value) => {
    if (!value || typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^(https?:|data:|blob:)/i.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
      return `${apiAssetOrigin}/${trimmed.replace(/^\/+/, '')}`;
    }

    return trimmed;
  };

  const getAvatarFromUserLike = (value) => {
    if (!value || typeof value !== 'object') return null;

    return normalizeAvatarSrc(
      value.avatarUrl ||
        value.profilePicture ||
        value.profileImage ||
        value.avatar ||
        value.imageUrl ||
        value.photoUrl ||
        null
    );
  };

  useEffect(() => {
    setProjectSnapshot(project || null);
  }, [project]);

  const activeProject = projectSnapshot || project;

  // ─── Extract real members from project data ──────────────────────────

  const { sortedMembers, isOwner, isModerator } = useMemo(() => {
    if (!activeProject) return { sortedMembers: [], isOwner: false, isModerator: false };

    const getObject = (value) => {
      return value && typeof value === 'object' ? value : null;
    };

    const getId = (value) => {
      if (!value) return '';
      if (typeof value === 'object') {
        return String(value._id || value.id || value.userId || value.memberId || '').trim();
      }
      return String(value).trim();
    };

    const pick = (...values) => {
      for (const value of values) {
        const text = String(value || '').trim();
        if (text) return text;
      }
      return '';
    };

    const getFullName = (person, fallback = 'Project Owner') => {
      const first = pick(person?.firstName, person?.firstname, person?.givenName);
      const last = pick(person?.lastName, person?.lastname, person?.familyName);
      const fullName = [first, last].filter(Boolean).join(' ').trim();

      return pick(
        person?.name,
        person?.fullName,
        person?.displayName,
        fullName,
        person?.username,
        person?.email,
        fallback
      );
    };

    // Prefer populated owner objects before raw owner string IDs.
    const ownerObject =
      getObject(activeProject.ownerId) ||
      getObject(activeProject.owner) ||
      getObject(activeProject.createdBy) ||
      getObject(activeProject.createdById);

    const ownerId =
      getId(activeProject.ownerId) ||
      getId(activeProject.owner) ||
      getId(activeProject.createdBy) ||
      getId(activeProject.createdById);

    const members = activeProject.members || [];

    // Build normalized member list
    const memberList = [];

    // 1) Owner first
    if (ownerId) {
      memberList.push({
        id: String(ownerId),
        name: getFullName(ownerObject, 'Project Owner'),
        firstName: ownerObject?.firstName || '',
        lastName: ownerObject?.lastName || '',
        username: ownerObject?.username || '',
        avatar: getAvatarFromUserLike(ownerObject),
        bio: ownerObject?.bio || ownerObject?.headline || '',
        email: ownerObject?.email || '',
        role: 'owner',
        permissionRole: 'owner',
        displayRole: 'Owner',
      });
    }

    // 2) Other members (admins then members)
    members.forEach((m) => {
      const u = m.user || m.userId || m;
      const uid = String(u?._id || u?.id || u);

      // Skip if this is the owner (already added)
      if (uid === String(ownerId)) return;

      memberList.push({
        id: uid,
        name: u?.name || `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || u?.username || 'Member',
        firstName: u?.firstName || '',
        lastName: u?.lastName || '',
        username: u?.username || '',
        avatar: getAvatarFromUserLike(u) || getAvatarFromUserLike(m),
        bio: u?.bio || u?.headline || '',
        email: u?.email || '',
        role: m.role || 'member',
        permissionRole: m.role || 'member',
        displayRole: m.displayRole || '',
      });
    });

    // Sort: owner → admin → member
    const roleOrder = { owner: 0, admin: 1, member: 2 };
    memberList.sort((a, b) => (roleOrder[a.role] || 9) - (roleOrder[b.role] || 9));

    const isOwnerFlag = String(ownerId) === String(currentUserId);
    const isModeratorFlag = isOwnerFlag || members.some((m) => {
      const uid = String(m.userId?._id || m.userId?.id || m.userId || m._id || m);
      return uid === String(currentUserId) && m.role === 'admin';
    });

    return {
      sortedMembers: memberList,
      isOwner: isOwnerFlag,
      isModerator: isModeratorFlag,
    };
  }, [activeProject, currentUserId]);

  // ─── Invite handler ──────────────────────────────────────────────────

  const handleInvite = async (inviteData) => {
    try {
      await sendInvite(projectId, {
        email: inviteData.email,
        role: inviteData.role || 'member',
      });
      toast({ title: 'Invitation sent!', description: `${inviteData.email} will receive an email invite`, variant: 'success' });
      setShowInvite(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send invitation';
      toast({ title: msg, variant: 'error' });
      throw err; // Re-throw so InviteMember knows it failed
    }
  };

  const commitProjectUpdate = (updatedProject) => {
    if (updatedProject) {
      setProjectSnapshot(updatedProject);
      onProjectUpdated?.(updatedProject);
    }
  };

  const refreshProjectSnapshot = async (fallbackProject = null) => {
    try {
      const freshProject = await getProject(projectId);
      commitProjectUpdate(freshProject || fallbackProject);
      return freshProject || fallbackProject;
    } catch (err) {
      // If the refetch fails, keep the mutation response instead of leaving the UI stale.
      // This preserves the action result while avoiding a hard failure in the modal.
      commitProjectUpdate(fallbackProject);
      return fallbackProject;
    }
  };

  const handleUpdateMemberDisplayRole = async (memberId, displayRole) => {
    try {
      const updatedProject = await updateProjectMemberDisplayRole(projectId, memberId, displayRole);
      await refreshProjectSnapshot(updatedProject);
      toast({
        title: 'Role label updated',
        description: `Member role changed to ${displayRole}`,
        variant: 'success',
      });
      return updatedProject;
    } catch (err) {
      const msg = err?.normalizedMessage || err?.response?.data?.message || err?.message || 'Failed to update role label';
      toast({ title: msg, variant: 'error' });
      throw err;
    }
  };

  const handleRemoveMember = async (memberId, memberName = 'member') => {
    try {
      const updatedProject = await removeProjectMember(projectId, memberId);
      await refreshProjectSnapshot(updatedProject);
      toast({
        title: 'Member removed',
        description: `${memberName} was removed from the project`,
        variant: 'success',
      });
      return updatedProject;
    } catch (err) {
      const msg = err?.normalizedMessage || err?.response?.data?.message || err?.message || 'Failed to remove member';
      toast({ title: msg, variant: 'error' });
      throw err;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Project Members
              </h2>
              <p className="text-xs text-slate-500 dark:text-white/40">
                {sortedMembers.length} {sortedMembers.length === 1 ? 'member' : 'members'}
              </p>
            </div>
          </div>

          {isModerator && (
            <button
              onClick={() => setShowInvite(true)}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite
            </button>
          )}

          {!isModerator && (
            <button
              onClick={() => setShowInvite(true)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.10] text-slate-600 dark:text-white/60 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Request to Add Member
            </button>
          )}
        </div>

        {/* Members List */}
        <div className="overflow-y-auto flex-1 p-3">
          <MembersList
            members={sortedMembers}
            currentUserId={currentUserId}
            isModerator={isModerator}
            onUpdateMemberDisplayRole={handleUpdateMemberDisplayRole}
            onRemoveMember={handleRemoveMember}
          />
        </div>

        {/* Invite Modal */}
        {showInvite && (
          <InviteMember
            projectId={projectId}
            projectName={activeProject?.name || activeProject?.title || 'Project'}
            onInvite={handleInvite}
            onClose={() => setShowInvite(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MembersPanel;
