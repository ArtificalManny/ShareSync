// src/components/members/MembersPanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MEMBERS PANEL — Real project data, sorted role hierarchy, invite wiring
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { Users, UserPlus } from 'lucide-react';
import MembersList from './MembersList';
import InviteMember from './InviteMember';
import { useAuth } from '../../context/AuthContext';
import { sendInvite } from '../../api/invites';
import { toast } from '../ui/toast';

const MembersPanel = ({ projectId, project, onClose }) => {
  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);

  const currentUserId = user?.id || user?._id || user?.userId || '';

  // ─── Extract real members from project data ──────────────────────────

  const { sortedMembers, isOwner, isModerator } = useMemo(() => {
    if (!project) return { sortedMembers: [], isOwner: false, isModerator: false };

    const owner = project.ownerId;
    const ownerId = owner?._id || owner?.id || owner;
    const members = project.members || [];

    // Build normalized member list
    const memberList = [];

    // 1) Owner first
    if (owner && typeof owner === 'object' && (owner.firstName || owner.username)) {
      memberList.push({
        id: String(owner._id || owner.id),
        firstName: owner.firstName || '',
        lastName: owner.lastName || '',
        username: owner.username || '',
        avatar: owner.avatar || owner.profilePicture || null,
        bio: owner.bio || owner.headline || '',
        email: owner.email || '',
        role: 'owner',
      });
    } else if (ownerId) {
      memberList.push({
        id: String(ownerId),
        firstName: 'Project',
        lastName: 'Owner',
        username: '',
        avatar: null,
        bio: '',
        email: '',
        role: 'owner',
      });
    }

    // 2) Other members (admins then members)
    members.forEach((m) => {
      const u = m.userId || m;
      const uid = String(u?._id || u?.id || u);

      // Skip if this is the owner (already added)
      if (uid === String(ownerId)) return;

      memberList.push({
        id: uid,
        firstName: u?.firstName || '',
        lastName: u?.lastName || '',
        username: u?.username || '',
        avatar: u?.avatar || u?.profilePicture || null,
        bio: u?.bio || u?.headline || '',
        email: u?.email || '',
        role: m.role || 'member',
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
  }, [project, currentUserId]);

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
          />
        </div>

        {/* Invite Modal */}
        {showInvite && (
          <InviteMember
            projectId={projectId}
            projectName={project?.name || project?.title || 'Project'}
            onInvite={handleInvite}
            onClose={() => setShowInvite(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MembersPanel;
