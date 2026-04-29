#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/components/members/MembersPanel.jsx"
BACKUP = ROOT / "src/components/members/MembersPanel.jsx.bak.before-member-management-wiring"


def fail(message: str) -> None:
    print(f"\n[wire_member_management_into_members_panel] ERROR: {message}")
    sys.exit(1)


def require_count(text: str, needle: str, expected: int, label: str) -> None:
    actual = text.count(needle)
    if actual != expected:
        fail(f"{label}: expected {expected} occurrence(s), found {actual}")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    require_count(text, old, 1, label)
    return text.replace(old, new, 1)


def main() -> None:
    print("[wire_member_management_into_members_panel] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "handleUpdateMemberDisplayRole" in source or "updateProjectMemberDisplayRole" in source:
        fail("MembersPanel.jsx already appears to contain member-management wiring. Refusing to patch twice.")

    edited = source

    edited = replace_once(
        edited,
        "import React, { useState, useMemo } from 'react';",
        "import React, { useEffect, useMemo, useState } from 'react';",
        "React import",
    )

    edited = replace_once(
        edited,
        "import { sendInvite } from '../../api/invites';\nimport { toast } from '../ui/toast';",
        "import { sendInvite } from '../../api/invites';\nimport { removeProjectMember, updateProjectMemberDisplayRole } from '../../api/projects';\nimport { toast } from '../ui/toast';",
        "API helper imports",
    )

    edited = replace_once(
        edited,
        "const MembersPanel = ({ projectId, project, onClose }) => {",
        "const MembersPanel = ({ projectId, project, onClose, onProjectUpdated }) => {",
        "component props",
    )

    edited = replace_once(
        edited,
        """  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);

  const currentUserId = user?.id || user?._id || user?.userId || '';""",
        """  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);
  const [projectSnapshot, setProjectSnapshot] = useState(project || null);

  const currentUserId = user?.id || user?._id || user?.userId || '';

  useEffect(() => {
    setProjectSnapshot(project || null);
  }, [project]);

  const activeProject = projectSnapshot || project;""",
        "local project snapshot state",
    )

    edited = replace_once(
        edited,
        """  const { sortedMembers, isOwner, isModerator } = useMemo(() => {
    if (!project) return { sortedMembers: [], isOwner: false, isModerator: false };

    const owner = project.owner || project.ownerId;
    const ownerId = owner?._id || owner?.id || owner;
    const members = project.members || [];""",
        """  const { sortedMembers, isOwner, isModerator } = useMemo(() => {
    if (!activeProject) return { sortedMembers: [], isOwner: false, isModerator: false };

    const owner = activeProject.owner || activeProject.ownerId;
    const ownerId = owner?._id || owner?.id || owner;
    const members = activeProject.members || [];""",
        "active project in useMemo",
    )

    edited = replace_once(
        edited,
        """        email: owner.email || '',
        role: 'owner',
      });""",
        """        email: owner.email || '',
        role: 'owner',
        permissionRole: 'owner',
        displayRole: 'Owner',
      });""",
        "owner object display role",
    )

    edited = replace_once(
        edited,
        """        email: '',
        role: 'owner',
      });""",
        """        email: '',
        role: 'owner',
        permissionRole: 'owner',
        displayRole: 'Owner',
      });""",
        "fallback owner object display role",
    )

    edited = replace_once(
        edited,
        """        email: u?.email || '',
        role: m.role || 'member',
      });""",
        """        email: u?.email || '',
        role: m.role || 'member',
        permissionRole: m.role || 'member',
        displayRole: m.displayRole || '',
      });""",
        "member object display role",
    )

    edited = replace_once(
        edited,
        "  }, [project, currentUserId]);",
        "  }, [activeProject, currentUserId]);",
        "useMemo dependency",
    )

    edited = replace_once(
        edited,
        """  const handleInvite = async (inviteData) => {
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
  };""",
        """  const handleInvite = async (inviteData) => {
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

  const handleUpdateMemberDisplayRole = async (memberId, displayRole) => {
    try {
      const updatedProject = await updateProjectMemberDisplayRole(projectId, memberId, displayRole);
      commitProjectUpdate(updatedProject);
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
      commitProjectUpdate(updatedProject);
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
  };""",
        "invite handler plus member management handlers",
    )

    edited = replace_once(
        edited,
        """          <MembersList
            members={sortedMembers}
            currentUserId={currentUserId}
            isModerator={isModerator}
          />""",
        """          <MembersList
            members={sortedMembers}
            currentUserId={currentUserId}
            isModerator={isModerator}
            onUpdateMemberDisplayRole={handleUpdateMemberDisplayRole}
            onRemoveMember={handleRemoveMember}
          />""",
        "MembersList handler props",
    )

    edited = replace_once(
        edited,
        "            projectName={project?.name || project?.title || 'Project'}",
        "            projectName={activeProject?.name || activeProject?.title || 'Project'}",
        "InviteMember project name",
    )

    required_markers = [
        "useEffect, useMemo, useState",
        "removeProjectMember, updateProjectMemberDisplayRole",
        "projectSnapshot",
        "activeProject",
        "displayRole: m.displayRole || ''",
        "handleUpdateMemberDisplayRole",
        "handleRemoveMember",
        "onUpdateMemberDisplayRole={handleUpdateMemberDisplayRole}",
        "onRemoveMember={handleRemoveMember}",
    ]

    for marker in required_markers:
        if marker not in edited:
            fail(f"Prewrite verification failed. Missing marker: {marker}")

    if edited == source:
        fail("No changes were produced")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[wire_member_management_into_members_panel] backup created: {BACKUP}")
    else:
        print(f"[wire_member_management_into_members_panel] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for marker in required_markers:
        if marker not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {marker}")

    print("\n[wire_member_management_into_members_panel] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"useEffect|projectSnapshot|activeProject|updateProjectMemberDisplayRole|removeProjectMember|handleUpdateMemberDisplayRole|handleRemoveMember|onUpdateMemberDisplayRole|displayRole\" src/components/members/MembersPanel.jsx -C 6")
    print("  git diff -- src/components/members/MembersPanel.jsx")


if __name__ == "__main__":
    main()
