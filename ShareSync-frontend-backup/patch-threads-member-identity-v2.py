from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/ThreadsView.jsx")

text = FILE_PATH.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = FILE_PATH.with_suffix(FILE_PATH.suffix + f".backup-before-new-discussion-member-identity-v2-{timestamp}")
backup_path.write_text(text)

old_extract_members = """function extractMembers(project) {
  if (!project) return [];
  const members = [];
  const seen = new Set();
  const ownerId = project.ownerId?._id || project.ownerId || project.owner?._id;
  if (ownerId && !seen.has(ownerId)) {
    seen.add(ownerId);
    const owner = project.owner || {};
    members.push({ id: ownerId, name: owner.firstName ? (owner.firstName + ' ' + (owner.lastName || '')).trim() : (owner.username || 'Owner'), role: 'owner' });
  }
  if (Array.isArray(project.members)) {
    for (const m of project.members) {
      const user = m.userId || m;
      const uid = user?._id || user?.id || (typeof user === 'string' ? user : null);
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      members.push({ id: uid, name: user.firstName ? (user.firstName + ' ' + (user.lastName || '')).trim() : (user.username || uid.slice(-6)), role: m.role || 'member' });
    }
  }
  return members;
}
"""

new_extract_members = """function getEntityId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;

  return (
    value._id ||
    value.id ||
    value.userId?._id ||
    value.userId?.id ||
    value.user?._id ||
    value.user?.id ||
    null
  );
}

function getEntityName(user, fallback = 'Team Member') {
  if (!user || typeof user === 'string') return fallback;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  return (
    user.fullName ||
    user.name ||
    fullName ||
    user.displayName ||
    user.username ||
    user.email ||
    fallback
  );
}

function getEntityEmail(user) {
  if (!user || typeof user === 'string') return '';

  return (
    user.email ||
    user.primaryEmail ||
    user.contactEmail ||
    user.user?.email ||
    ''
  );
}

function getEntityAvatar(user) {
  if (!user || typeof user === 'string') return null;

  return (
    user.profilePicture ||
    user.avatarUrl ||
    user.avatar ||
    user.photoUrl ||
    user.imageUrl ||
    user.picture ||
    user.profile?.profilePicture ||
    user.profile?.avatarUrl ||
    user.user?.profilePicture ||
    user.user?.avatarUrl ||
    null
  );
}

function formatRoleLabel(role, isOwner = false) {
  if (isOwner || String(role || '').toLowerCase() === 'owner') return 'Owner';

  const clean = String(role || 'member')
    .replace(/[_-]/g, ' ')
    .trim();

  return clean.replace(/\\b\\w/g, letter => letter.toUpperCase());
}

function getInitials(name) {
  return String(name || 'Team Member')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?';
}

function extractMembers(project) {
  if (!project) return [];

  const members = [];
  const seen = new Set();

  const addMember = ({ user, id, role = 'member', isOwner = false }) => {
    const rawId = getEntityId(user) || id;
    if (!rawId) return;

    const normalizedId = String(rawId);
    if (seen.has(normalizedId)) return;
    seen.add(normalizedId);

    const name = getEntityName(user, isOwner ? 'Owner' : normalizedId.slice(-6));

    members.push({
      id: normalizedId,
      name,
      role: String(role || 'member').toLowerCase(),
      roleLabel: formatRoleLabel(role, isOwner),
      email: getEntityEmail(user),
      avatarUrl: getEntityAvatar(user),
      initials: getInitials(name),
    });
  };

  const ownerUser =
    (project.owner && typeof project.owner === 'object' ? project.owner : null) ||
    (project.ownerId && typeof project.ownerId === 'object' ? project.ownerId : null) ||
    (project.createdBy && typeof project.createdBy === 'object' ? project.createdBy : null) ||
    null;

  const ownerId =
    getEntityId(project.owner) ||
    getEntityId(project.ownerId) ||
    getEntityId(project.createdBy) ||
    project.ownerId ||
    project.owner;

  if (ownerId) {
    addMember({
      user: ownerUser || { _id: ownerId, username: 'Owner' },
      id: ownerId,
      role: 'owner',
      isOwner: true,
    });
  }

  if (Array.isArray(project.members)) {
    for (const memberRecord of project.members) {
      const user =
        memberRecord.userId ||
        memberRecord.user ||
        memberRecord.member ||
        memberRecord;

      const uid = getEntityId(user);
      if (!uid) continue;

      const isOwner = ownerId && String(uid) === String(ownerId);

      addMember({
        user,
        id: uid,
        role:
          isOwner
            ? 'owner'
            : memberRecord.displayRole ||
              memberRecord.role ||
              memberRecord.projectRole ||
              user.displayRole ||
              user.role ||
              'member',
        isOwner,
      });
    }
  }

  return members;
}
"""

old_selected_chip = """                <span key={m.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-medium">
                  {m.name}<button onClick={() => toggleMember(m)}><X className="w-3 h-3" /></button>
                </span>"""

new_selected_chip = """                <span key={m.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-medium">
                  <span className="relative h-4 w-4 overflow-hidden rounded-full bg-white/70 ring-1 ring-violet-200 dark:bg-white/[0.08] dark:ring-violet-400/20">
                    {m.avatarUrl ? (
                      <img
                        src={m.avatarUrl}
                        alt={m.name}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[8px] font-black">
                        {m.initials}
                      </span>
                    )}
                  </span>
                  {m.name}
                  <button onClick={() => toggleMember(m)}><X className="w-3 h-3" /></button>
                </span>"""

old_member_row = """                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/[0.08] flex items-center justify-center text-[11px] font-medium text-slate-600 dark:text-white/50">
                        {m.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{m.name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{m.role}</p>
                      </div>"""

new_member_row = """                      <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm ring-2 ring-white dark:border-white/[0.10] dark:bg-white/[0.08] dark:ring-white/[0.04]">
                        {m.avatarUrl ? (
                          <img
                            src={m.avatarUrl}
                            alt={m.name}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                              const fallback = event.currentTarget.nextElementSibling;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}

                        <span
                          style={{ display: m.avatarUrl ? 'none' : 'flex' }}
                          className="absolute inset-0 items-center justify-center text-[11px] font-black text-slate-600 dark:text-white/70"
                        >
                          {m.initials}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{m.name}</p>

                        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5">
                          <span
                            className={
                              'rounded-full px-2 py-0.5 text-[10px] font-bold ' +
                              (m.roleLabel === 'Owner'
                                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20'
                                : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-white/[0.06] dark:text-white/50 dark:ring-white/[0.08]')
                            }
                          >
                            {m.roleLabel || m.role}
                          </span>

                          {m.email ? (
                            <span className="truncate text-[10px] text-slate-400 dark:text-white/35">
                              {m.email}
                            </span>
                          ) : null}
                        </div>
                      </div>"""

missing = []
for label, block in [
    ("extractMembers block", old_extract_members),
    ("selected member chip", old_selected_chip),
    ("member picker row", old_member_row),
]:
    if block not in text:
        missing.append(label)

if missing:
    raise RuntimeError("Could not find: " + ", ".join(missing) + ". No changes were written.")

new_text = text.replace(old_extract_members, new_extract_members, 1)
new_text = new_text.replace(old_selected_chip, new_selected_chip, 1)
new_text = new_text.replace(old_member_row, new_member_row, 1)

# IMPORTANT:
# Do NOT check for 'onClick={() =' because it falsely matches valid React arrows like onClick={() => ...}.
real_corruption_patterns = [
    "onClick={() = className=",
    "onClick={()= className=",
    "className==",
]

for bad in real_corruption_patterns:
    if bad in new_text:
        FILE_PATH.write_text(text)
        raise RuntimeError(f"Real JSX corruption pattern detected: {bad}. Original restored.")

FILE_PATH.write_text(new_text)

print("ThreadsView New Discussion member identity v2 patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Member extraction now preserves name, avatar, email, role label, and owner identity")
print("- New Discussion selected chips now support profile pictures")
print("- New Discussion member picker rows now support real profile pictures")
print("- Owner/member title now appears below the name")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No thread creation logic was changed.")
print("No modal open/close logic was changed.")
