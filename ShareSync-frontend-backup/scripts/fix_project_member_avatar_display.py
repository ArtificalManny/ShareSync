from pathlib import Path
from datetime import datetime

PROJECT_CARD = Path("src/components/projects/ProjectCardV2.jsx")
MEMBERS_PANEL = Path("src/components/members/MembersPanel.jsx")

def fail(message):
    raise SystemExit(f"[fix_project_member_avatar_display] ERROR: {message}")

def backup_file(path):
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = path.with_suffix(path.suffix + f".bak.before-member-avatar-display-{timestamp}")
    backup.write_text(path.read_text())
    return backup

def patch_project_card():
    print("[patch] ProjectCardV2.jsx")

    if not PROJECT_CARD.exists():
        fail(f"missing file: {PROJECT_CARD}")

    text = PROJECT_CARD.read_text()
    original = text

    old_helpers = """function getMemberName(member) {
  return (
    member?.name ||
    member?.fullName ||
    [member?.firstName, member?.lastName].filter(Boolean).join(' ').trim() ||
    member?.username ||
    member?.email ||
    'Member'
  );
}

function getMemberAvatar(member) {
  return (
    member?.avatarUrl ||
    member?.profilePicture ||
    member?.avatar ||
    member?.photoUrl ||
    null
  );
}"""

    new_helpers = """const RAW_API_BASE =
  import.meta?.env?.VITE_API_URL ||
  import.meta?.env?.VITE_BACKEND_URL ||
  'http://localhost:3000';

const API_ASSET_ORIGIN = String(RAW_API_BASE).replace(/\\/api\\/?$/, '').replace(/\\/$/, '');

function normalizeAvatarSrc(value) {
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    return `${API_ASSET_ORIGIN}/${trimmed.replace(/^\\/+/, '')}`;
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
}"""

    if old_helpers not in text:
        fail("ProjectCardV2 member helper block not found")

    text = text.replace(old_helpers, new_helpers, 1)

    old_members_block = """  const members = useMemo(() => {
    if (Array.isArray(project?.members)) return project.members;
    if (Array.isArray(project?.team)) return project.team;
    return [];
  }, [project?.members, project?.team]);

  const memberCount = safeNumber(
    project?.memberCount,
    members.length
  );"""

    new_members_block = """  const members = useMemo(() => buildProjectMemberStack(project), [project]);

  const memberCount = Math.max(
    safeNumber(
      project?.memberCount ??
        project?.membersCount ??
        project?.metrics?.memberCount?.value ??
        project?.metrics?.memberCount,
      0
    ),
    members.length
  );"""

    if old_members_block not in text:
        fail("ProjectCardV2 members useMemo block not found")

    text = text.replace(old_members_block, new_members_block, 1)

    old_key = "key={member?._id || member?.id || member?.email || `${memberName}-${idx}`}"
    new_key = "key={getMemberId(member) || `${memberName}-${idx}`}"

    if old_key not in text:
        fail("ProjectCardV2 mini avatar key pattern not found")

    text = text.replace(old_key, new_key, 1)

    if text == original:
        fail("ProjectCardV2 produced no changes")

    backup = backup_file(PROJECT_CARD)
    PROJECT_CARD.write_text(text)
    print(f"[patched] ProjectCardV2.jsx backup created: {backup}")

def patch_members_panel():
    print("[patch] MembersPanel.jsx")

    if not MEMBERS_PANEL.exists():
        fail(f"missing file: {MEMBERS_PANEL}")

    text = MEMBERS_PANEL.read_text()
    original = text

    anchor = "  const currentUserId = user?.id || user?._id || user?.userId || '';"

    helper = """
  const rawApiBase =
    import.meta?.env?.VITE_API_URL ||
    import.meta?.env?.VITE_BACKEND_URL ||
    'http://localhost:3000';

  const apiAssetOrigin = String(rawApiBase).replace(/\\/api\\/?$/, '').replace(/\\/$/, '');

  const normalizeAvatarSrc = (value) => {
    if (!value || typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^(https?:|data:|blob:)/i.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
      return `${apiAssetOrigin}/${trimmed.replace(/^\\/+/, '')}`;
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
  };"""

    if "const getAvatarFromUserLike" not in text:
        if anchor not in text:
            fail("MembersPanel currentUserId anchor not found")
        text = text.replace(anchor, anchor + helper, 1)

    replacements = {
        "avatar: owner.avatar || owner.profilePicture || null,": "avatar: getAvatarFromUserLike(owner),",
        "avatar: u?.avatar || u?.profilePicture || null,": "avatar: getAvatarFromUserLike(u) || getAvatarFromUserLike(m),",
    }

    changed = False
    for old, new in replacements.items():
        if old in text:
            text = text.replace(old, new, 1)
            changed = True

    if not changed and text == original:
        fail("MembersPanel avatar lines were not found and no helper was added")

    backup = backup_file(MEMBERS_PANEL)
    MEMBERS_PANEL.write_text(text)
    print(f"[patched] MembersPanel.jsx backup created: {backup}")

def main():
    print("[fix_project_member_avatar_display] starting")
    patch_project_card()
    patch_members_panel()
    print()
    print("[fix_project_member_avatar_display] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "buildProjectMemberStack|unwrapMemberUser|normalizeAvatarSrc|getAvatarFromUserLike|profileImage|avatarUrl" src/components/projects/ProjectCardV2.jsx src/components/members/MembersPanel.jsx -C 6')
    print("  git diff -- src/components/projects/ProjectCardV2.jsx src/components/members/MembersPanel.jsx")

if __name__ == "__main__":
    main()
