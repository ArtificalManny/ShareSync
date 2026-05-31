from pathlib import Path
import re
import shutil
from datetime import datetime

path = Path("src/features/stack/StackTaskRow.jsx")

if not path.exists():
    raise RuntimeError(f"Missing file: {path}")

text = path.read_text()
original = text

backup = path.with_suffix(
    path.suffix + f".backup-before-start-button-contrast-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
shutil.copy2(path, backup)

def replace_one(pattern, repl, label):
    global text
    text, count = re.subn(pattern, repl, text, count=1, flags=re.DOTALL)
    if count != 1:
        raise RuntimeError(
            f"Could not patch: {label}\n"
            f"Original restored. Backup kept at: {backup}"
        )

# 1) Stronger Review button visual treatment
replace_one(
    r'(title:\s*"Move to review",\s*icon:\s*Send,\s*onClick:\s*\(\)\s*=>\s*onMoveToReview\?\.\(task\),\s*classes:\s*)\n\s*"[^"]*",',
    r'''\1
          "bg-sky-600 hover:bg-sky-700 text-white border border-sky-500/70 shadow-[0_12px_28px_rgba(2,132,199,0.30)] dark:bg-blue-500 dark:hover:bg-blue-400 dark:border-blue-300/30",''',
    "Review primaryAction classes"
)

# 2) Stronger Start button visual treatment
replace_one(
    r'(title:\s*"Start working on this task",\s*icon:\s*Play,\s*onClick:\s*\(\)\s*=>\s*onStart\?\.\(task\),\s*classes:\s*)\n\s*"[^"]*",',
    r'''\1
          "bg-violet-700 hover:bg-violet-800 text-white border border-violet-500/70 shadow-[0_14px_32px_rgba(124,58,237,0.36)] ring-1 ring-white/70 dark:bg-violet-500 dark:hover:bg-violet-400 dark:border-violet-300/30 dark:shadow-[0_14px_34px_rgba(139,92,246,0.28)]",''',
    "Start primaryAction classes"
)

# 3) Replace the weak button base class so disabled state stays readable
replace_one(
    r'className=\{`inline-flex\s+items-center\s+justify-center\s+gap-1\.5\s+text-\[11px\]\s+font-semibold\s+px-3\s+py-2\s+rounded-lg\s+disabled:opacity-50\s+transition-colors\s+flex-shrink-0\s+\$\{primaryAction\.classes\}`\}',
    '''className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.08em]
                    transition-all duration-200 flex-shrink-0
                    hover:-translate-y-0.5 active:translate-y-0
                    disabled:!opacity-100 disabled:!cursor-not-allowed disabled:hover:translate-y-0
                    disabled:!bg-slate-200 disabled:!text-slate-700 disabled:!border-slate-300 disabled:!shadow-none
                    dark:disabled:!bg-white/[0.10] dark:disabled:!text-white/70 dark:disabled:!border-white/[0.14]
                    ${primaryAction.classes}`}''',
    "primary action button base class"
)

path.write_text(text)

print("✅ Updated Moves Start button contrast.")
print(f"Backup saved at: {backup}")
print("")
print("Changed:")
print("- Start button is now a stronger violet CTA in light mode")
print("- Review button also has stronger contrast")
print("- Disabled Start button no longer fades into the white background")
print("- Logic preserved: onStart, onMoveToReview, onComplete untouched")
