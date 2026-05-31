from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".backup-before-share-icon-invite-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
shutil.copy2(path, backup)

old = '''          <button
            type="button"
            className="p-2.5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>'''

new = '''          <button
            type="button"
            onClick={onMembersClick}
            aria-label="Share invite link"
            title="Share invite link"
            className="p-2.5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>'''

count = text.count(old)

if count != 1:
    raise RuntimeError(
        f"Expected exactly 1 matching Share2 button block, found {count}. No changes written.\\n"
        f"Backup kept at: {backup}\\n\\n"
        "Run this and paste the output:\\n"
        "grep -n -B 10 -A 15 \"<Share2\" src/pages/ProjectHome.jsx"
    )

path.write_text(text.replace(old, new, 1))

print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- Share icon beside Members now opens the existing Members/Invite modal")
print("- Added aria-label/title: Share invite link")
print("")
print("Kept intact:")
print("- Files section")
print("- Announcements section")
print("- Existing MembersPanel")
print("- Existing backend/API logic")
print("- Existing routes")
