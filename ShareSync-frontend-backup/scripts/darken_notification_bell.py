from pathlib import Path
from datetime import datetime

path = Path("src/components/navigation/NotificationCenter.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/navigation/NotificationCenter.jsx")

text = path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".bak-before-darken-notification-bell-{stamp}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

replacements = [
    ("text-slate-400 dark:text-zinc-400", "text-slate-600 dark:text-zinc-300"),
    ("text-slate-400 dark:text-zinc-500", "text-slate-600 dark:text-zinc-300"),
    ("text-slate-500 dark:text-zinc-400", "text-slate-600 dark:text-zinc-300"),
    ("hover:text-violet-600 dark:hover:text-violet-400", "hover:text-violet-700 dark:hover:text-violet-300"),
    ("group-hover:text-violet-600 dark:group-hover:text-violet-400", "group-hover:text-violet-700 dark:group-hover:text-violet-300"),
]

changed = 0

for old, new in replacements:
    count = text.count(old)
    if count:
        text = text.replace(old, new)
        changed += count
        print(f"✅ Replaced {count} occurrence(s): {old} -> {new}")

path.write_text(text)

print("")
print(f"✅ Notification bell darkening complete. Total replacements: {changed}")
print("")
print("Inspect:")
print('rg -n "Bell|bell|text-slate-600|text-zinc-300|text-violet-700|NotificationCenter" src/components/navigation/NotificationCenter.jsx -C 6')
