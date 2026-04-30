#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/components/members/MembersPanel.jsx"
BACKUP = ROOT / "src/components/members/MembersPanel.jsx.bak.before-member-refresh-fix"


def fail(message: str) -> None:
    print(f"\n[fix_member_modal_refresh_after_role_change] ERROR: {message}")
    sys.exit(1)


def require_count(text: str, needle: str, expected: int, label: str) -> None:
    actual = text.count(needle)
    if actual != expected:
        fail(f"{label}: expected {expected} occurrence(s), found {actual}")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    require_count(text, old, 1, label)
    return text.replace(old, new, 1)


def main() -> None:
    print("[fix_member_modal_refresh_after_role_change] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "refreshProjectSnapshot" in source:
        fail("MembersPanel.jsx already appears to contain the refresh-after-member-action fix. Refusing to patch twice.")

    edited = source

    edited = replace_once(
        edited,
        "import { removeProjectMember, updateProjectMemberDisplayRole } from '../../api/projects';",
        "import { getProject, removeProjectMember, updateProjectMemberDisplayRole } from '../../api/projects';",
        "projects API import",
    )

    edited = replace_once(
        edited,
        """  const commitProjectUpdate = (updatedProject) => {
    if (updatedProject) {
      setProjectSnapshot(updatedProject);
      onProjectUpdated?.(updatedProject);
    }
  };""",
        """  const commitProjectUpdate = (updatedProject) => {
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
  };""",
        "commitProjectUpdate helper",
    )

    edited = replace_once(
        edited,
        """      const updatedProject = await updateProjectMemberDisplayRole(projectId, memberId, displayRole);
      commitProjectUpdate(updatedProject);""",
        """      const updatedProject = await updateProjectMemberDisplayRole(projectId, memberId, displayRole);
      await refreshProjectSnapshot(updatedProject);""",
        "display role refresh after mutation",
    )

    edited = replace_once(
        edited,
        """      const updatedProject = await removeProjectMember(projectId, memberId);
      commitProjectUpdate(updatedProject);""",
        """      const updatedProject = await removeProjectMember(projectId, memberId);
      await refreshProjectSnapshot(updatedProject);""",
        "remove member refresh after mutation",
    )

    required_markers = [
        "getProject, removeProjectMember, updateProjectMemberDisplayRole",
        "refreshProjectSnapshot",
        "await refreshProjectSnapshot(updatedProject);",
        "If the refetch fails, keep the mutation response",
    ]

    for marker in required_markers:
        if marker not in edited:
            fail(f"Prewrite verification failed. Missing marker: {marker}")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[fix_member_modal_refresh_after_role_change] backup created: {BACKUP}")
    else:
        print(f"[fix_member_modal_refresh_after_role_change] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for marker in required_markers:
        if marker not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {marker}")

    print("\n[fix_member_modal_refresh_after_role_change] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"getProject|refreshProjectSnapshot|commitProjectUpdate|await refreshProjectSnapshot|updateProjectMemberDisplayRole|removeProjectMember\" src/components/members/MembersPanel.jsx -C 6")
    print("  git diff -- src/components/members/MembersPanel.jsx")


if __name__ == "__main__":
    main()
