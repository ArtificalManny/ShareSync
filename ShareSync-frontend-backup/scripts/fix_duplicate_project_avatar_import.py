from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/home/MissionCard.jsx")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-fix-duplicate-project-avatar-import-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# Remove every ProjectAvatar import, regardless of quote style.
text = re.sub(
    r'^\s*import\s+ProjectAvatar\s+from\s+[\'"]\.\./project/ProjectAvatar[\'"];\s*\n',
    '',
    text,
    flags=re.MULTILINE,
)

# Re-add exactly one canonical import after FocusBlockBadge.
anchor = 'import FocusBlockBadge from "../focus/FocusBlockBadge";\n'

if anchor not in text:
    raise SystemExit("❌ Could not find FocusBlockBadge import anchor. No changes written.")

text = text.replace(
    anchor,
    anchor + 'import ProjectAvatar from "../project/ProjectAvatar";\n',
    1,
)

count = len(
    re.findall(
        r'import\s+ProjectAvatar\s+from\s+[\'"]\.\./project/ProjectAvatar[\'"];',
        text,
    )
)

if count != 1:
    raise SystemExit(f"❌ Safety check failed: ProjectAvatar import count is {count}. No changes written.")

path.write_text(text)

print("✅ Duplicate ProjectAvatar import fixed.")
print("✅ MissionCard.jsx now has exactly one ProjectAvatar import.")
print("✅ Backend untouched.")
print("")
print("Inspect with:")
print("sed -n '15,32p' src/components/home/MissionCard.jsx")
print("rg -n \"import ProjectAvatar\" src/components/home/MissionCard.jsx")
