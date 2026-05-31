from pathlib import Path
from datetime import datetime

path = Path("src/pages/project/ProjectSettings.jsx")
text = path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".bak-before-text-visibility-{stamp}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

old_classes = [
    'className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500 transition-colors disabled:bg-slate-800 disabled:text-slate-500"',
    'className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors disabled:bg-slate-800 disabled:text-slate-500"',
    'className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 resize-none transition-colors disabled:bg-slate-800 disabled:text-slate-500"',
]

new_classes = [
    'className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500"',
    'className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500"',
    'className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 resize-none transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500"',
]

for old, new in zip(old_classes, new_classes):
    if old not in text:
        raise SystemExit(f"❌ Could not find expected class:\n{old}")
    text = text.replace(old, new, 1)

path.write_text(text)

print("✅ ProjectSettings input/textarea text visibility fixed.")
print("")
print("Inspect with:")
print('rg -n "text-slate-900 dark:text-white|Description|Project Name|Project Logo" src/pages/project/ProjectSettings.jsx -C 4')
