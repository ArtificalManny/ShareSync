from pathlib import Path
from datetime import datetime
import shutil

FILE_PATH = Path("src/pages/ProjectHome.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Missing file: {FILE_PATH}")

original = FILE_PATH.read_text()
text = original

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = FILE_PATH.with_suffix(FILE_PATH.suffix + f".backup-owner-avatar-v2-{stamp}")
shutil.copy2(FILE_PATH, backup)

HELPER_MARKER = "PROJECTHOME OWNER AVATAR URL HELPER v2"

helper_code = r'''
// ═══════════════════════════════════════════════════════════════════════
// PROJECTHOME OWNER AVATAR URL HELPER v2
// Finds the owner's real profile image from the project/summary payload.
// Keeps initials as fallback when the backend does not provide an image.
// ═══════════════════════════════════════════════════════════════════════

function getProjectOwnerAvatarUrl(projectLike, summary = null) {
  const avatarKeys = [
    "profilePicture",
    "profilePictureUrl",
    "avatarUrl",
    "avatar",
    "photoUrl",
    "imageUrl",
    "picture",
    "profileImage",
  ];

  const readAvatar = (value) => {
    if (!value || typeof value !== "object") return "";

    for (const key of avatarKeys) {
      const candidate = value?.[key];
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }

    return "";
  };

  const candidates = [
    summary?.owner,
    summary?.ownerSummary,
    summary?.ownerSummary?.owner,
    summary?.ownerSummary?.user,
    summary?.ownerSummary?.userId,

    projectLike?.owner,
    projectLike?.ownerId,
    projectLike?.createdBy,
    projectLike?.createdById,
    projectLike?.user,
    projectLike?.userId,
  ];

  if (Array.isArray(projectLike?.members)) {
    for (const member of projectLike.members) {
      const role = String(member?.role || member?.projectRole || "").toLowerCase();
      const isOwner =
        role === "owner" ||
        role === "admin" ||
        member?.isOwner === true ||
        member?.owner === true;

      if (!isOwner) continue;

      candidates.push(
        member?.user,
        member?.userId,
        member?.member,
        member
      );
    }
  }

  for (const candidate of candidates) {
    const avatar = readAvatar(candidate);
    if (avatar) return avatar;
  }

  return "";
}
'''

# 1. Add helper immediately before OwnerSignalCard.
if HELPER_MARKER not in text:
    owner_fn = "function OwnerSignalCard({ ownerName, caption }) {"
    idx = text.find(owner_fn)
    if idx == -1:
        raise RuntimeError("Could not find OwnerSignalCard signature. No changes written.")
    text = text[:idx] + helper_code + "\n\n" + text[idx:]

# 2. Update OwnerSignalCard signature.
text = text.replace(
    "function OwnerSignalCard({ ownerName, caption }) {",
    "function OwnerSignalCard({ ownerName, ownerAvatarUrl, caption }) {",
    1
)

# 3. Add safeOwnerAvatarUrl inside OwnerSignalCard.
old_safe_name = '  const safeOwnerName = String(ownerName || "").trim() || "Project owner";\n'
new_safe_name = (
    '  const safeOwnerName = String(ownerName || "").trim() || "Project owner";\n'
    '  const safeOwnerAvatarUrl = String(ownerAvatarUrl || "").trim();\n'
)

if "const safeOwnerAvatarUrl = String(ownerAvatarUrl || \"\").trim();" not in text:
    if old_safe_name not in text:
        raise RuntimeError("Could not find safeOwnerName line. No changes written.")
    text = text.replace(old_safe_name, new_safe_name, 1)

# 4. Replace the right-side initials bubble with image-first avatar fallback.
old_initials_block = '''          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-emerald-700 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-emerald-300 sm:flex">
            {initials}
          </div>'''

new_avatar_block = '''          <div
            className="hidden h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm font-black text-emerald-700 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-emerald-300 sm:flex"
            title={safeOwnerName}
            aria-label={`${safeOwnerName} profile picture`}
          >
            {safeOwnerAvatarUrl ? (
              <>
                <img
                  src={safeOwnerAvatarUrl}
                  alt={`${safeOwnerName} profile`}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    event.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <span className="hidden">{initials}</span>
              </>
            ) : (
              <span>{initials}</span>
            )}
          </div>'''

if new_avatar_block not in text:
    if old_initials_block not in text:
        raise RuntimeError("Could not find the exact right-side initials bubble block. No changes written.")
    text = text.replace(old_initials_block, new_avatar_block, 1)

# 5. Add ownerAvatarUrl calculation after ownerName calculation.
old_owner_name_block = '''  const ownerName = getProjectOwnerDisplayName(
    (typeof project !== "undefined" && project) ||
      (typeof activeProject !== "undefined" && activeProject) ||
      (typeof currentProject !== "undefined" && currentProject) ||
      overview?.project ||
      overview?.rawProject ||
      null,
    summary
  );'''

owner_avatar_block = '''  const ownerName = getProjectOwnerDisplayName(
    (typeof project !== "undefined" && project) ||
      (typeof activeProject !== "undefined" && activeProject) ||
      (typeof currentProject !== "undefined" && currentProject) ||
      overview?.project ||
      overview?.rawProject ||
      null,
    summary
  );

  const ownerAvatarUrl = getProjectOwnerAvatarUrl(
    (typeof project !== "undefined" && project) ||
      (typeof activeProject !== "undefined" && activeProject) ||
      (typeof currentProject !== "undefined" && currentProject) ||
      overview?.project ||
      overview?.rawProject ||
      null,
    summary
  );'''

if "const ownerAvatarUrl = getProjectOwnerAvatarUrl(" not in text:
    if old_owner_name_block not in text:
        raise RuntimeError("Could not find ownerName calculation block. No changes written.")
    text = text.replace(old_owner_name_block, owner_avatar_block, 1)

# 6. Pass ownerAvatarUrl into OwnerSignalCard.
old_owner_card_call = '''          <OwnerSignalCard
            ownerName={ownerName}
            caption={`${memberCount} member${memberCount === 1 ? "" : "s"} · ${onlineCount} online now`}
          />'''

new_owner_card_call = '''          <OwnerSignalCard
            ownerName={ownerName}
            ownerAvatarUrl={ownerAvatarUrl}
            caption={`${memberCount} member${memberCount === 1 ? "" : "s"} · ${onlineCount} online now`}
          />'''

if "ownerAvatarUrl={ownerAvatarUrl}" not in text:
    if old_owner_card_call not in text:
        raise RuntimeError("Could not find OwnerSignalCard invocation. No changes written.")
    text = text.replace(old_owner_card_call, new_owner_card_call, 1)

# 7. Safety checks.
required = [
    HELPER_MARKER,
    "function OwnerSignalCard({ ownerName, ownerAvatarUrl, caption })",
    "const safeOwnerAvatarUrl = String(ownerAvatarUrl || \"\").trim();",
    "const ownerAvatarUrl = getProjectOwnerAvatarUrl(",
    "ownerAvatarUrl={ownerAvatarUrl}",
    "src={safeOwnerAvatarUrl}",
]

missing = [item for item in required if item not in text]
if missing:
    FILE_PATH.write_text(original)
    raise RuntimeError(f"Patch incomplete. Missing: {missing}. Original restored.")

# Only reject newly introduced obvious JSX corruption.
for bad in ["onClick={() =", "className={}"]:
    if bad in text and bad not in original:
        FILE_PATH.write_text(original)
        raise RuntimeError(f"Unsafe new JSX pattern detected: {bad}. Original restored.")

FILE_PATH.write_text(text)

print("ProjectHome owner avatar v2 patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Added getProjectOwnerAvatarUrl helper")
print("- Updated OwnerSignalCard to accept ownerAvatarUrl")
print("- Replaced the right-side initials bubble with image-first avatar fallback")
print("- Passed ownerAvatarUrl into OwnerSignalCard")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No project loading, tabs, metrics, overview logic, or ownership logic changed.")
