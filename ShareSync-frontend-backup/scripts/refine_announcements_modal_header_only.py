from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()
original = text

backup = path.with_suffix(
    path.suffix + f".bak-before-modal-header-only-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# -----------------------------------------------------------------------------
# We are ONLY refining the Post Announcement modal header.
# No backend touched.
# No data flow touched.
# -----------------------------------------------------------------------------

# This replacement targets the small header zone that contains:
# - TEAM BROADCAST
# - Post Announcement
# - the close button
#
# It swaps that header with a tighter, more balanced structure.
#
# IMPORTANT:
# This pattern is intentionally narrow and only fires if it finds the
# "TEAM BROADCAST" + "Post Announcement" header cluster.
pattern = re.compile(
    r"""
(?P<header>
<div\s+className=\{?["'][^"']*border-b[^"']*["']\}?[^>]*>\s*
(?:.|\n)*?
TEAM\s+BROADCAST
(?:.|\n)*?
Post\s+Announcement
(?:.|\n)*?
(?:X|Close|onClick=\{\(\)\s*=>\s*setShowCreateModal\(false\)\}|setShowCreateModal\(false\))
(?:.|\n)*?
</div>
)
""",
    re.VERBOSE,
)

replacement = """<div className="flex items-start justify-between gap-6 px-10 pt-8 pb-6 border-b border-[rgba(124,92,255,0.10)] bg-[linear-gradient(180deg,rgba(124,92,255,0.05)_0%,rgba(255,255,255,0.92)_100%)]">
  <div className="min-w-0 flex-1">
    <div className="mb-3">
      <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.26em] text-[var(--theme-accent-primary)] bg-[rgba(124,92,255,0.08)] border border-[rgba(124,92,255,0.12)]">
        Team Broadcast
      </span>
    </div>

    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--theme-accent-primary),#8b5cf6)] text-white shadow-[0_10px_28px_rgba(124,92,255,0.22)] shrink-0">
        <Megaphone className="w-6 h-6" />
      </div>

      <div className="min-w-0">
        <h2 className="text-[clamp(1.85rem,2vw,2.3rem)] leading-[1.02] font-black tracking-tight text-slate-950 dark:text-white">
          Post Announcement
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-zinc-400">
          Visible to all project members
        </p>
      </div>
    </div>
  </div>

  <button
    type="button"
    onClick={() => setShowCreateModal(false)}
    className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/70 text-slate-500 dark:text-zinc-400 transition-all hover:border-[var(--theme-accent-primary)] hover:text-[var(--theme-accent-primary)] hover:shadow-[0_8px_22px_rgba(124,92,255,0.12)]"
    aria-label="Close post announcement modal"
  >
    <X className="w-6 h-6" />
  </button>
</div>"""

new_text, count = pattern.subn(replacement, text, count=1)

if count != 1:
    print("⚠️ Automatic header replacement did not find exactly one matching header block.")
    print("⚠️ No changes written beyond backup.")
    print("")
    print("Search manually for these strings inside AnnouncementsView.jsx:")
    print('  - "TEAM BROADCAST"')
    print('  - "Post Announcement"')
    print('  - "Visible to all project members"')
    raise SystemExit("❌ Header block not replaced automatically.")

# Safety checks
required = [
    "Team Broadcast",
    "Post Announcement",
    "Visible to all project members",
    "aria-label=\"Close post announcement modal\"",
]

for item in required:
    if item not in new_text:
        raise SystemExit(f"❌ Safety check failed: missing `{item}`. No changes written.")

if new_text.count("export default function AnnouncementsView") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementsView export count changed. No changes written.")

path.write_text(new_text)

print("✅ Post Announcement modal header refined.")
print("✅ Only the modal header was changed.")
print("✅ Backend untouched.")
print("✅ Existing announcement visuals preserved.")
