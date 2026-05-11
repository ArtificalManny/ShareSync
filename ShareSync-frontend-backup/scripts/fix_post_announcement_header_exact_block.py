from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()
lines = text.splitlines()

backup = path.with_suffix(
    path.suffix + f".bak-before-exact-post-announcement-header-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# Find the title.
title_hits = [i for i, line in enumerate(lines) if "Post Announcement" in line]

if len(title_hits) != 1:
    raise SystemExit(f"❌ Expected exactly one Post Announcement title. Found {len(title_hits)}. No changes written.")

title_idx = title_hits[0]

# Find the Type Category section after the header.
category_idx = None
for i in range(title_idx + 1, min(len(lines), title_idx + 160)):
    if "TYPE CATEGORY" in lines[i] or "Type Category" in lines[i]:
        category_idx = i
        break

if category_idx is None:
    raise SystemExit("❌ Could not find TYPE CATEGORY after Post Announcement. No changes written.")

def find_matching_div(start_index):
    depth = 0

    for j in range(start_index, min(len(lines), category_idx + 20)):
        line = lines[j]

        opens = len(re.findall(r"<div\\b", line))
        closes = line.count("</div>")

        depth += opens
        depth -= closes

        if depth == 0 and j > start_index:
            return j

    return None

# Find the modal header wrapper:
# It must contain TEAM BROADCAST + Post Announcement
# and it must end before TYPE CATEGORY.
candidates = []

for i in range(title_idx, max(-1, title_idx - 100), -1):
    if "<div" not in lines[i] or "className" not in lines[i]:
        continue

    end = find_matching_div(i)
    if end is None:
        continue

    if end >= category_idx:
        continue

    block = "\n".join(lines[i:end + 1])

    has_team_broadcast = "TEAM BROADCAST" in block or "Team Broadcast" in block
    has_post_title = "Post Announcement" in block

    if has_team_broadcast and has_post_title:
        candidates.append((i, end, block))

if not candidates:
    print("❌ Could not safely find the exact modal header block.")
    print("")
    print("Nearby code for manual inspection:")
    for i in range(max(0, title_idx - 35), min(len(lines), title_idx + 45)):
        print(f"{i + 1:04d}: {lines[i]}")
    raise SystemExit("No changes written.")

# Use the outermost matching header block.
start, end, old_header = candidates[0]

# Extract the existing close handler from the old header.
onclick_match = re.search(r"onClick=\\{([^\\n{}]+)\\}", old_header)

if not onclick_match:
    print("❌ Could not extract the close button onClick handler.")
    print("")
    print("Header block found:")
    for i in range(start, end + 1):
        print(f"{i + 1:04d}: {lines[i]}")
    raise SystemExit("No changes written.")

close_handler = onclick_match.group(1).strip()

new_header = f"""        <div className="flex items-center justify-between gap-5 px-9 py-5 border-b border-slate-200/70 dark:border-white/10 bg-white dark:bg-zinc-950">
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
            onClick={{{close_handler}}}
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

print("✅ Post Announcement header replaced successfully.")
print("✅ Existing close handler preserved:", close_handler)
print("✅ Header background is now clean white.")
print("✅ Backend untouched.")
print("")
print("Inspect with:")
print("rg -n \"Team Broadcast|Post Announcement|Close post announcement\" src/components/views/AnnouncementsView.jsx -C 10")
