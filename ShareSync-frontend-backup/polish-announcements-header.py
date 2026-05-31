from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise RuntimeError(f"Could not find {path}")

original = path.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"{path}.backup-before-announcements-header-polish-{timestamp}")
shutil.copy2(path, backup)

text = original
changed = []

def replace_once(find, replace, label):
    global text, changed
    if find not in text:
        return False
    text = text.replace(find, replace, 1)
    changed.append(label)
    return True

# Add stronger scoped CSS only once.
if ".announcements-broadcast-hero" not in text:
    css_marker = "        `}\n      </style>"
    if css_marker not in text:
        path.write_text(original)
        raise RuntimeError(
            f"Could not find AnnouncementsView inline style closing marker. No changes written. Backup kept at: {backup}"
        )

    css = r"""
          .announcements-broadcast-hero {
            isolation: isolate;
            transform: translateZ(0);
          }

          .announcements-broadcast-hero::before {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 5px;
            z-index: 2;
            background: linear-gradient(90deg, #8b5cf6 0%, #22d3ee 45%, #10b981 72%, #f59e0b 100%);
            box-shadow:
              0 0 32px rgba(34, 211, 238, 0.42),
              0 0 48px rgba(139, 92, 246, 0.28);
          }

          .announcements-broadcast-hero::after {
            content: "";
            position: absolute;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            background-image:
              linear-gradient(rgba(148, 163, 184, 0.085) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.085) 1px, transparent 1px),
              radial-gradient(circle at 76% 38%, rgba(245, 158, 11, 0.12), transparent 28%);
            background-size: 34px 34px, 34px 34px, auto;
            mask-image: linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%);
            opacity: 0.82;
          }

          .dark .announcements-broadcast-hero::after {
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.055) 1px, transparent 1px),
              radial-gradient(circle at 76% 38%, rgba(245, 158, 11, 0.10), transparent 28%);
            opacity: 0.70;
          }

          .announcements-hero-orbit {
            z-index: 1;
          }

          .announcements-hero-icon {
            position: relative;
            background:
              radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.35), transparent 24%),
              conic-gradient(from 210deg, #0f172a, #7c3aed, #22d3ee, #10b981, #0f172a) !important;
            border: 1px solid rgba(255, 255, 255, 0.52);
            box-shadow:
              0 18px 44px rgba(15, 23, 42, 0.20),
              0 0 42px rgba(124, 58, 237, 0.22),
              inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
          }

          .announcements-hero-icon::before {
            content: "";
            position: absolute;
            inset: -9px;
            border-radius: 1.55rem;
            border: 1px solid rgba(34, 211, 238, 0.24);
            box-shadow: 0 0 28px rgba(34, 211, 238, 0.20);
            animation: announcementPulse 2.9s ease-in-out infinite;
          }

          @keyframes announcementPulse {
            0%, 100% {
              opacity: 0.55;
              transform: scale(0.98);
            }
            50% {
              opacity: 1;
              transform: scale(1.04);
            }
          }

          .announcements-hero-pill {
            background:
              linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(237, 233, 254, 0.78)) !important;
            border-color: rgba(139, 92, 246, 0.28) !important;
            box-shadow:
              0 10px 28px rgba(124, 58, 237, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.86) !important;
          }

          .dark .announcements-hero-pill {
            background:
              linear-gradient(135deg, rgba(124, 58, 237, 0.20), rgba(15, 23, 42, 0.74)) !important;
            border-color: rgba(167, 139, 250, 0.28) !important;
            color: rgba(221, 214, 254, 0.98) !important;
            box-shadow:
              0 14px 34px rgba(0, 0, 0, 0.26),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .announcements-hero-title {
            font-size: clamp(2rem, 3.8vw, 3.6rem) !important;
            line-height: 0.95 !important;
            letter-spacing: -0.055em !important;
            background: linear-gradient(135deg, #0f172a 0%, #111827 34%, #7c3aed 72%, #0891b2 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent !important;
            text-shadow: 0 18px 46px rgba(15, 23, 42, 0.10);
          }

          .dark .announcements-hero-title {
            background: linear-gradient(135deg, #ffffff 0%, #ddd6fe 36%, #a78bfa 70%, #67e8f9 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent !important;
            text-shadow: 0 22px 58px rgba(0, 0, 0, 0.42);
          }

          .announcements-hero-copy {
            color: rgba(51, 65, 85, 0.86) !important;
          }

          .dark .announcements-hero-copy {
            color: rgba(226, 232, 240, 0.72) !important;
          }

          .announcements-stat-pill {
            background:
              linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.74)) !important;
            border-color: rgba(148, 163, 184, 0.28) !important;
            box-shadow:
              0 12px 30px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.82) !important;
            backdrop-filter: blur(14px);
          }

          .dark .announcements-stat-pill {
            background:
              linear-gradient(135deg, rgba(15, 23, 42, 0.68), rgba(30, 41, 59, 0.44)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            color: rgba(226, 232, 240, 0.84) !important;
            box-shadow:
              0 14px 34px rgba(0, 0, 0, 0.30),
              inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          }

          .announcements-refresh-button {
            background:
              linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.80)) !important;
            border-color: rgba(148, 163, 184, 0.30) !important;
            box-shadow:
              0 14px 34px rgba(15, 23, 42, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.82) !important;
          }

          .announcements-refresh-button:hover {
            transform: translateY(-1px);
            border-color: rgba(124, 58, 237, 0.34) !important;
            box-shadow:
              0 18px 42px rgba(124, 58, 237, 0.16),
              inset 0 1px 0 rgba(255, 255, 255, 0.86) !important;
          }

          .dark .announcements-refresh-button {
            background:
              linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(30, 41, 59, 0.52)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            color: rgba(226, 232, 240, 0.78) !important;
            box-shadow:
              0 16px 42px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          }

          .announcements-hero-cta {
            min-height: 3.35rem;
            padding-inline: 1.35rem !important;
            letter-spacing: 0.01em;
          }
"""

    text = text.replace(css_marker, css + "\n" + css_marker, 1)
    changed.append("Added stronger scoped Announcements header CSS")

# Add scoped class names to the existing header markup.
replace_once(
    'className="announcements-hero-panel relative overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-sm"',
    'className="announcements-broadcast-hero announcements-hero-panel relative overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-sm"',
    "Added announcements-broadcast-hero class to header shell",
)

replace_once(
    'className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(124,58,237,0.12),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(20,184,166,0.10),transparent_30%)]"',
    'className="announcements-hero-orbit pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(124,58,237,0.12),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(20,184,166,0.10),transparent_30%)]"',
    "Added announcements-hero-orbit class to decorative field",
)

replace_once(
    'className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 shadow-xl shadow-slate-900/20"',
    'className="announcements-hero-icon flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 shadow-xl shadow-slate-900/20"',
    "Enhanced Megaphone icon wrapper",
)

replace_once(
    'className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"',
    'className="announcements-hero-title text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"',
    "Enhanced Announcements title",
)

replace_once(
    'className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-500"',
    'className="announcements-hero-copy mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-500"',
    "Enhanced Announcements subtitle",
)

# Add pill class to Signal Board and Pinned Active pills.
text = text.replace(
    'className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-700"',
    'className="announcements-hero-pill rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-700"',
    1,
)
text = text.replace(
    'className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700"',
    'className="announcements-hero-pill rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700"',
    1,
)

# Add stat pill class to the three small stats.
old_stat = 'className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm"'
new_stat = 'className="announcements-stat-pill rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm"'
stat_count = text.count(old_stat)
text = text.replace(old_stat, new_stat, 3)
if stat_count:
    changed.append(f"Enhanced {min(stat_count, 3)} stat pills")

replace_once(
    'className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"',
    'className="announcements-refresh-button flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"',
    "Enhanced refresh button",
)

replace_once(
    'className="announcements-primary-button relative isolate inline-flex items-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-violet-500/40"',
    'className="announcements-hero-cta announcements-primary-button relative isolate inline-flex items-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-violet-500/40"',
    "Enhanced Post Update CTA",
)

# Safety checks.
required = [
    "announcements-broadcast-hero",
    "announcements-hero-icon",
    "announcements-hero-title",
    "announcements-stat-pill",
    "Post Update",
    "Announcements",
    "getAnnouncements",
    "createAnnouncement",
]

missing = [item for item in required if item not in text]
if missing:
    path.write_text(original)
    raise RuntimeError(
        f"Safety check failed. Missing: {missing}. Original restored. Backup kept at: {backup}"
    )

# Preserve important functional sections.
for must_keep in [
    "toggleAnnouncementPin",
    "deleteAnnouncement",
    "toggleLike",
    "addComment",
    "AttachmentInput",
    "AnnouncementCard",
]:
    if must_keep not in text:
        path.write_text(original)
        raise RuntimeError(
            f"Safety check failed. Missing functional section: {must_keep}. Original restored. Backup kept at: {backup}"
        )

path.write_text(text)

print("Announcements header polish applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
for item in changed:
    print(f"- {item}")
print("")
print("Kept intact:")
print("- Announcement API calls")
print("- Create / pin / delete / like / comment logic")
print("- Attachments")
print("- Files section")
print("- ProjectHome routes")
