from pathlib import Path
from datetime import datetime
import shutil

FILE_PATH = Path("src/pages/ProjectHome.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Missing file: {FILE_PATH}")

text_original = FILE_PATH.read_text()
text = text_original

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = FILE_PATH.with_suffix(FILE_PATH.suffix + f".backup-owner-avatar-{stamp}")
shutil.copy2(FILE_PATH, backup)

HELPER_MARKER = "PROJECTHOME OWNER AVATAR HELPERS"

helper_code = r'''

// ═══════════════════════════════════════════════════════════════════════
// PROJECTHOME OWNER AVATAR HELPERS
// Keeps initials as fallback, but shows the real project owner's picture
// whenever ProjectHome's project payload includes profilePicture/avatarUrl.
// ═══════════════════════════════════════════════════════════════════════

function getProjectHomeOwnerRecord(project) {
  if (!project) return null;

  const directCandidates = [
    project.owner,
    project.ownerId,
    project.createdBy,
    project.createdById,
    project.user,
    project.userId,
  ];

  const memberCandidates = Array.isArray(project.members)
    ? project.members.flatMap((member) => {
        const role = String(member?.role || member?.projectRole || "").toLowerCase();
        const isOwner =
          role === "owner" ||
          role === "admin" ||
          member?.isOwner === true ||
          member?.owner === true;

        if (!isOwner) return [];

        return [
          member?.user,
          member?.userId,
          member?.member,
          member,
        ];
      })
    : [];

  const candidates = [...directCandidates, ...memberCandidates];

  return (
    candidates.find((candidate) => candidate && typeof candidate === "object") ||
    null
  );
}

function getProjectHomeUserAvatarUrl(user) {
  if (!user || typeof user !== "object") return "";

  return (
    user.profilePicture ||
    user.profilePictureUrl ||
    user.avatarUrl ||
    user.avatar ||
    user.photoUrl ||
    user.imageUrl ||
    user.picture ||
    ""
  );
}

function getProjectHomeUserDisplayName(user, fallback = "Owner") {
  if (!user || typeof user !== "object") return fallback;

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  return (
    fullName ||
    user.name ||
    user.displayName ||
    user.username ||
    user.email ||
    fallback
  );
}

function getProjectHomeInitials(name = "Owner") {
  return String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "O";
}

function ProjectHomeOwnerAvatar({ project }) {
  const ownerRecord = getProjectHomeOwnerRecord(project);
  const ownerName = getProjectHomeUserDisplayName(ownerRecord, "Owner");
  const ownerAvatarUrl = getProjectHomeUserAvatarUrl(ownerRecord);
  const ownerInitials = getProjectHomeInitials(ownerName);

  return (
    <div
      className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/80 bg-white/80 shadow-sm flex items-center justify-center text-sm font-black text-emerald-700"
      title={ownerName}
      aria-label={`${ownerName} profile picture`}
    >
      {ownerAvatarUrl ? (
        <img
          src={ownerAvatarUrl}
          alt={`${ownerName} profile`}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span>{ownerInitials}</span>
      )}
    </div>
  );
}
'''

# 1) Insert helper after imports if missing.
if HELPER_MARKER not in text:
    lines = text.splitlines()
    last_import_idx = None

    for i, line in enumerate(lines):
        if line.startswith("import "):
            last_import_idx = i

    if last_import_idx is None:
        FILE_PATH.write_text(text_original)
        raise RuntimeError("Could not find import section. Original restored.")

    lines.insert(last_import_idx + 1, helper_code)
    text = "\n".join(lines) + "\n"

# 2) Locate the Who Owns It card.
lower = text.lower()
section_start = lower.find("who owns it")

if section_start == -1:
    FILE_PATH.write_text(text_original)
    raise RuntimeError('Could not find "WHO OWNS IT" / "Who owns it" section. Original restored.')

# Use the next nearby ownership/card section as a boundary.
section_end_candidates = [
    lower.find("ownership signal", section_start),
    lower.find("finish line", section_start),
    lower.find("what's blocked", section_start + 1),
    lower.find("what’s blocked", section_start + 1),
]

section_end_candidates = [x for x in section_end_candidates if x != -1]
section_end = min(section_end_candidates) if section_end_candidates else min(len(text), section_start + 3500)

section = text[section_start:section_end]

# 3) Find the existing initials/avatar block.
needle_options = [
    ">MR<",
    "{ownerInitials}",
    "{ownerInitial}",
    "{getInitials(ownerName)}",
    "{getInitials(owner?.name)}",
    "{getInitials(ownerName ||",
]

hit_relative = -1
needle_used = None

for needle in needle_options:
    hit_relative = section.find(needle)
    if hit_relative != -1:
        needle_used = needle
        break

if hit_relative == -1:
    FILE_PATH.write_text(text_original)
    raise RuntimeError(
        "Could not confidently find the current owner initials/avatar block. Original restored.\n"
        "Run this and paste the output:\n"
        "grep -n \"WHO OWNS IT\\|Who owns it\\|ownerInitial\\|ownerName\\|MR\\|getInitials\" src/pages/ProjectHome.jsx"
    )

hit_absolute = section_start + hit_relative

# Replace the nearest wrapping <div>...</div> around the initials.
block_start = text.rfind("<div", section_start, hit_absolute)
block_end = text.find("</div>", hit_absolute)

if block_start == -1 or block_end == -1:
    FILE_PATH.write_text(text_original)
    raise RuntimeError("Could not isolate the owner initials wrapper div. Original restored.")

block_end += len("</div>")
old_block = text[block_start:block_end]

if len(old_block) > 1200:
    FILE_PATH.write_text(text_original)
    raise RuntimeError("Owner initials block looked too large to safely replace. Original restored.")

new_block = "<ProjectHomeOwnerAvatar project={project} />"

text = text[:block_start] + new_block + text[block_end:]

# 4) Safety checks.
if HELPER_MARKER not in text:
    FILE_PATH.write_text(text_original)
    raise RuntimeError("Helper code was not inserted. Original restored.")

if "<ProjectHomeOwnerAvatar project={project} />" not in text:
    FILE_PATH.write_text(text_original)
    raise RuntimeError("Owner avatar component was not inserted. Original restored.")

bad_patterns = [
    "onClick={() =",
    "className={}",
]

for bad in bad_patterns:
    if bad in text and bad not in text_original:
        FILE_PATH.write_text(text_original)
        raise RuntimeError(f"Unsafe new JSX pattern detected: {bad}. Original restored.")

FILE_PATH.write_text(text)

print("ProjectHome owner avatar patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup}")
print("")
print("Matched existing initials pattern:", needle_used)
print("")
print("Changed only:")
print("- Added ProjectHome owner avatar helper/component")
print("- Replaced the Who Owns It initials bubble with ProjectHomeOwnerAvatar")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No project loading, overview logic, tabs, metrics, or ownership logic changed.")
