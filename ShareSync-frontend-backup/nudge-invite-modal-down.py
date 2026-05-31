from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/components/members/InviteMember.jsx")

if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".backup-before-invite-modal-nudge-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
shutil.copy2(path, backup)

old = 'className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-10 backdrop-blur-sm sm:pt-12"'
new = 'className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-14 backdrop-blur-sm sm:pt-16"'

if old not in text:
    shutil.copy2(backup, path)
    raise RuntimeError(
        "Could not find the expected modal wrapper class.\n"
        f"Original restored. Backup kept at: {backup}"
    )

text = text.replace(old, new, 1)
path.write_text(text)

print(f"Updated: {path}")
print(f"Backup:  {backup}")
print("")
print("Changed:")
print("- Modal overlay top padding from pt-10 sm:pt-12")
print("- To pt-14 sm:pt-16")
print("")
print("Result:")
print("- Invite Members modal should sit slightly lower")
print("- Top of the title should no longer be cut off")
