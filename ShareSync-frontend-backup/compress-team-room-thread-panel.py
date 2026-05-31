from pathlib import Path
from datetime import datetime

path = Path("src/components/views/ThreadsView.jsx")

if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

original = path.read_text()

timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-before-team-room-scroll-{timestamp}")
backup.write_text(original)

text = original
changes = []

def replace_once(old, new, label):
    global text
    if old not in text:
        raise RuntimeError(
            f"Could not find expected block: {label}\n"
            f"No changes written. Backup kept at: {backup}"
        )
    text = text.replace(old, new, 1)
    changes.append(label)

def replace_all(old, new, label):
    global text
    count = text.count(old)
    if count == 0:
        raise RuntimeError(
            f"Could not find expected block: {label}\n"
            f"No changes written. Backup kept at: {backup}"
        )
    text = text.replace(old, new)
    changes.append(f"{label} ({count}x)")

# 1) Make the conversation panel obey the parent height instead of stretching the page
replace_once(
    'className="flex flex-col h-full"',
    'className="flex h-full min-h-0 flex-col"',
    "Constrain ConversationPanel root"
)

replace_once(
    'className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-3"',
    'className="shrink-0 px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-3"',
    "Make conversation header fixed"
)

replace_once(
    'className="flex-1 overflow-y-auto px-5 py-4 space-y-4"',
    'className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4 [scrollbar-gutter:stable]"',
    "Make messages scroll inside panel"
)

replace_once(
    'className="px-5 py-3 border-t border-slate-100 dark:border-white/[0.06]"',
    'className="shrink-0 px-5 py-3 border-t border-slate-100 dark:border-white/[0.06]"',
    "Make message composer fixed"
)

# 2) Compress outer spacing
replace_once(
    'className="team room-visual-scope relative mx-auto max-w-[1600px] px-4 py-7 pb-32 sm:px-6 lg:px-10"',
    'className="team room-visual-scope relative mx-auto max-w-[1600px] px-4 py-5 pb-10 sm:px-6 lg:px-10"',
    "Reduce Team Room page padding"
)

replace_once(
    'className="relative p-5 sm:p-7 lg:p-8"',
    'className="relative p-4 sm:p-5 lg:p-6"',
    "Reduce shell padding"
)

replace_once(
    'className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"',
    'className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"',
    "Compress Team Room header spacing"
)

replace_once(
    'className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"',
    'className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"',
    "Compress stats grid spacing"
)

replace_all(
    'room-stat-card rounded-3xl border border-violet-200 bg-violet-50/80 p-4 shadow-sm',
    'room-stat-card rounded-3xl border border-violet-200 bg-violet-50/80 p-3 shadow-sm',
    "Compress Threads stat card"
)

replace_all(
    'room-stat-card rounded-3xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm',
    'room-stat-card rounded-3xl border border-amber-200 bg-amber-50/80 p-3 shadow-sm',
    "Compress Pinned stat card"
)

replace_all(
    'room-stat-card rounded-3xl border border-cyan-200 bg-cyan-50/80 p-4 shadow-sm',
    'room-stat-card rounded-3xl border border-cyan-200 bg-cyan-50/80 p-3 shadow-sm',
    "Compress Visible stat card"
)

replace_all(
    'room-stat-card rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm',
    'room-stat-card rounded-3xl border border-emerald-200 bg-emerald-50/80 p-3 shadow-sm',
    "Compress Members stat card"
)

replace_all(
    'className="mt-2 text-3xl font-black text-slate-950 dark:text-white"',
    'className="mt-1.5 text-2xl font-black text-slate-950 dark:text-white"',
    "Reduce stat number size"
)

# 3) Give the split-panel a real height and internal scroll
replace_once(
    'className="team room-thread-stage grid min-h-[620px] overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-black/30 lg:grid-cols-[380px_1fr]"',
    'className="team room-thread-stage grid h-[68vh] min-h-[520px] max-h-[720px] overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-black/30 lg:grid-cols-[340px_1fr]"',
    "Bound Team Room split-panel height"
)

replace_once(
    "'team room-thread-rail border-r border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#101014]/80 ' +",
    "'team room-thread-rail min-h-0 border-r border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#101014]/80 ' +",
    "Constrain thread rail"
)

replace_once(
    'className="border-b border-slate-200/80 p-4 dark:border-white/[0.08]"',
    'className="shrink-0 border-b border-slate-200/80 p-3 dark:border-white/[0.08]"',
    "Make search/filter rail fixed"
)

replace_once(
    'className="mt-4 flex gap-2 overflow-x-auto pb-1"',
    'className="mt-3 flex gap-2 overflow-x-auto pb-1"',
    "Tighten channel filter spacing"
)

replace_once(
    'className="flex-1 overflow-y-auto p-4"',
    'className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 [scrollbar-gutter:stable]"',
    "Make thread list scroll internally"
)

replace_once(
    'rounded-[1.35rem] p-4 transition-all',
    'rounded-[1.35rem] p-3 transition-all',
    "Compress thread cards"
)

replace_once(
    "'team room-conversation-canvas min-w-0 flex-1 flex-col bg-gradient-to-br from-white via-slate-50/50 to-cyan-50/40 dark:from-[#0f0f13] dark:via-[#111116] dark:to-cyan-950/10 ' +",
    "'team room-conversation-canvas min-h-0 min-w-0 flex-1 flex-col bg-gradient-to-br from-white via-slate-50/50 to-cyan-50/40 dark:from-[#0f0f13] dark:via-[#111116] dark:to-cyan-950/10 ' +",
    "Constrain conversation canvas"
)

replace_once(
    'className="flex h-full min-h-[620px] flex-col"',
    'className="flex h-full min-h-0 flex-col"',
    "Remove active conversation min-height expansion"
)

replace_once(
    'className="flex min-h-[620px] flex-1 items-center justify-center p-8"',
    'className="flex h-full min-h-0 flex-1 items-center justify-center p-6"',
    "Compress empty conversation state"
)

required = [
    'h-[68vh] min-h-[520px] max-h-[720px]',
    'min-h-0 flex-1 overflow-y-auto overscroll-contain',
    'lg:grid-cols-[340px_1fr]',
]

missing = [item for item in required if item not in text]
if missing:
    path.write_text(original)
    raise RuntimeError(
        "Safety check failed. Original restored.\n"
        f"Missing expected markers: {missing}\n"
        f"Backup kept at: {backup}"
    )

path.write_text(text)

print("Team Room scroll compression applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
for change in changes:
    print(f"- {change}")
print("")
print("Kept intact:")
print("- Files section")
print("- Announcements section")
print("- Backend/API logic")
print("- Thread creation logic")
print("- Thread message sending logic")
print("- Current visual system, except spacing/scroll constraints")
