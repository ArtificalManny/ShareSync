from pathlib import Path
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()
lines = text.splitlines()

backup = path.with_suffix(
    path.suffix + f".bak-before-fix-post-announcement-header-bg-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# ---------------------------------------------------------------------
# Goal:
# Replace only the Post Announcement modal header.
# This removes the tinted/gradient title-band behind "Post Announcement".
# Backend untouched.
# ---------------------------------------------------------------------

title_hits = [i for i, line in enumerate(lines) if "Post Announcement" in line]

if len(title_hits) != 1:
    raise SystemExit(f"❌ Expected exactly one 'Post Announcement'. Found {len(title_hits)}. No changes written.")

title_idx = title_hits[0]

# Find the header wrapper start.
# We scan upward until we find the div that begins the modal header.
start = None
for i in range(title_idx, max(-1, title_idx - 80), -1):
    line = lines[i]
    if "<div" in line and "className" in line:
        # Prefer a wrapper with border-b / sticky / gradient / header-like classes
        local = "\n".join(lines[i:min(len(lines), i + 8)])
        if (
            "border-b" in local
            or "TEAM BROADCAST" in local
            or "Team Broadcast" in local
            or "bg-" in local
            or "gradient" in local
        ):
            start = i
            break

if start is None:
    raise SystemExit("❌ Could not find the header wrapper start. No changes written.")

# Find close button handler.
close_handler = None
for i in range(title_idx, min(len(lines), title_idx + 120)):
    if "setShowCreateModal(false)" in lines[i]:
        close_handler = i
        break

if close_handler is None:
    raise SystemExit("❌ Could not find setShowCreateModal(false) in modal header. No changes written.")

# Find the close button's ending tag.
button_end = None
for i in range(close_handler, min(len(lines), close_handler + 60)):
    if "</button>" in lines[i]:
        button_end = i
        break

if button_end is None:
    raise SystemExit("❌ Could not find close button end. No changes written.")

# Find the header wrapper closing div after the close button.
end = None
for i in range(button_end + 1, min(len(lines), button_end + 40)):
    if lines[i].strip() == "</div>":
        end = i
        break

if end is None:
    raise SystemExit("❌ Could not find header wrapper closing div. No changes written.")

new_header = """        <div className="flex items-center justify-between gap-5 px-9 py-5 border-b border-slate-200/70 dark:border-white/10 bg-white dark:bg-zinc-950">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--theme-accent-primary)] text-white shadow-[0_10px_26px_rgba(124,92,255,0.22)]">
              <Megaphone className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--theme-accent-primary)]">
                Team Broadcast
              </p>
              <h2 className="mt-1 text-2xl sm:text-[2rem] leading-none font-black tracking-tight text-slate-950 dark:text-white">
                Post Announcement
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(false)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 transition-all hover:border-[var(--theme-accent-primary)] hover:text-[var(--theme-accent-primary)] hover:shadow-[0_8px_22px_rgba(124,92,255,0.12)]"
            aria-label="Close post announcement modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>""".splitlines()

fixed_lines = lines[:start] + new_header + lines[end + 1:]
fixed = "\n".join(fixed_lines) + "\n"

# Safety checks
if fixed.count("export default function AnnouncementsView") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementsView export count changed. No changes written.")

if fixed.count("Post Announcement") != 1:
    raise SystemExit("❌ Safety check failed: Post Announcement count changed. No changes written.")

if fixed.count("Team Broadcast") != 1:
    raise SystemExit("❌ Safety check failed: Team Broadcast count changed. No changes written.")

if "\n}) {\n" in fixed:
    raise SystemExit("❌ Safety check failed: malformed `}) {` exists. No changes written.")

path.write_text(fixed)

print("✅ Post Announcement modal header background fixed.")
print("✅ Header is now clean white instead of tinted/gradient.")
print("✅ Icon/title/close button alignment tightened.")
print("✅ Backend untouched.")
print("")
print("Run this to inspect the changed area:")
print("rg -n \"Team Broadcast|Post Announcement|Close post announcement\" src/components/views/AnnouncementsView.jsx -C 8")
