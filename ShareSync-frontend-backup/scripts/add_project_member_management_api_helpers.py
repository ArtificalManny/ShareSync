#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/api/projects.js"
BACKUP = ROOT / "src/api/projects.js.bak.before-member-management-api"


def fail(message: str) -> None:
    print(f"\n[add_project_member_management_api_helpers] ERROR: {message}")
    sys.exit(1)


def main() -> None:
    print("[add_project_member_management_api_helpers] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "updateProjectMemberDisplayRole" in source or "removeProjectMember" in source:
        fail("Member management API helpers already appear to exist. Refusing to patch twice.")

    old = '''export const deleteProject = async (projectId) => {
  try {
    const response = await api.delete(`/projects/${projectId}`);
    return unwrap(response);
  } catch (err) {
    throw normalizeError(err, "Failed to delete project");
  }
};

// ============================================
// PROJECT LIFECYCLE / COMPLETION ENGINE
// ============================================'''

    new = '''export const deleteProject = async (projectId) => {
  try {
    const response = await api.delete(`/projects/${projectId}`);
    return unwrap(response);
  } catch (err) {
    throw normalizeError(err, "Failed to delete project");
  }
};

// ============================================
// PROJECT MEMBER MANAGEMENT
// ============================================

function normalizeMemberDisplayRole(displayRole) {
  const normalized = String(displayRole || '').replace(/\\s+/g, ' ').trim();

  if (!normalized) {
    const err = new Error("Display role is required.");
    err.normalizedMessage = "Display role is required.";
    throw err;
  }

  if (normalized.length > 40) {
    const err = new Error("Display role must be 40 characters or fewer.");
    err.normalizedMessage = "Display role must be 40 characters or fewer.";
    throw err;
  }

  return normalized;
}

export const updateProjectMemberDisplayRole = async (projectId, memberUserId, displayRole) => {
  try {
    const body = {
      displayRole: normalizeMemberDisplayRole(displayRole),
    };

    const response = await api.patch(
      `/projects/${projectId}/members/${memberUserId}/display-role`,
      body
    );

    const data = unwrap(response);
    return normalizeProjectId(data);
  } catch (err) {
    throw normalizeError(err, "Failed to update member role label");
  }
};

export const removeProjectMember = async (projectId, memberUserId) => {
  try {
    const response = await api.delete(`/projects/${projectId}/members/${memberUserId}`);
    const data = unwrap(response);
    return normalizeProjectId(data);
  } catch (err) {
    throw normalizeError(err, "Failed to remove project member");
  }
};

// ============================================
// PROJECT LIFECYCLE / COMPLETION ENGINE
// ============================================'''

    count = source.count(old)
    if count != 1:
        fail(f"Expected deleteProject/lifecycle anchor once, found {count}")

    edited = source.replace(old, new, 1)

    required_markers = [
        "PROJECT MEMBER MANAGEMENT",
        "function normalizeMemberDisplayRole(displayRole)",
        "updateProjectMemberDisplayRole",
        "`/projects/${projectId}/members/${memberUserId}/display-role`",
        "removeProjectMember",
        "`/projects/${projectId}/members/${memberUserId}`",
        "Display role must be 40 characters or fewer.",
    ]

    for marker in required_markers:
        if marker not in edited:
            fail(f"Prewrite verification failed. Missing marker: {marker}")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[add_project_member_management_api_helpers] backup created: {BACKUP}")
    else:
        print(f"[add_project_member_management_api_helpers] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for marker in required_markers:
        if marker not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {marker}")

    print("\n[add_project_member_management_api_helpers] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"PROJECT MEMBER MANAGEMENT|normalizeMemberDisplayRole|updateProjectMemberDisplayRole|removeProjectMember|display-role|Failed to remove project member\" src/api/projects.js -C 6")
    print("  git diff -- src/api/projects.js")


if __name__ == "__main__":
    main()
