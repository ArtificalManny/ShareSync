from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/home/MissionCard.jsx")
text = path.read_text()
backup = path.with_suffix(path.suffix + f".bak-before-project-avatar-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

if "ProjectAvatar" not in text:
    # Insert import after React import block or after existing imports.
    lines = text.splitlines()
    insert_index = 0
    for i, line in enumerate(lines):
      if line.startswith("import ") and ";" in line:
        insert_index = i + 1
    lines.insert(insert_index, "import ProjectAvatar from '../project/ProjectAvatar';")
    text = "\n".join(lines) + "\n"

# Add helper if missing.
if "function getMissionProjectForAvatar" not in text:
    helper = """
function getMissionProjectForAvatar(mission) {
  return {
    ...mission,
    _id: mission?._id || mission?.id || mission?.projectId,
    id: mission?.id || mission?._id || mission?.projectId,
    name: mission?.name || mission?.title || mission?.projectName,
    title: mission?.title || mission?.name || mission?.projectName,
    logoUrl:
      mission?.logoUrl ||
      mission?.logo ||
      mission?.picture ||
      mission?.avatarUrl ||
      mission?.imageUrl ||
      "",
    logo:
      mission?.logo ||
      mission?.logoUrl ||
      mission?.picture ||
      mission?.avatarUrl ||
      mission?.imageUrl ||
      "",
    picture:
      mission?.picture ||
      mission?.logoUrl ||
      mission?.logo ||
      mission?.avatarUrl ||
      mission?.imageUrl ||
      "",
    avatarUrl:
      mission?.avatarUrl ||
      mission?.logoUrl ||
      mission?.logo ||
      mission?.picture ||
      mission?.imageUrl ||
      "",
    imageUrl:
      mission?.imageUrl ||
      mission?.logoUrl ||
      mission?.logo ||
      mission?.picture ||
      mission?.avatarUrl ||
      "",
  };
}

"""
    # Place helper before export default/function component.
    match = re.search(r"(export default function|function MissionCard|const MissionCard)", text)
    if not match:
        raise SystemExit("❌ Could not find MissionCard component start. No changes written.")
    text = text[:match.start()] + helper + text[match.start():]

# Replace a common icon shell pattern if present.
patterns = [
    r"""<div className="[^"]*(?:w-10|h-10|rounded)[^"]*">\s*<[^>]*(?:Hammer|Wrench|Rocket|Zap|Sparkles)[^>]*/>\s*</div>""",
    r"""<div className=\{`[^`]*(?:w-10|h-10|rounded)[^`]*`\}>\s*<[^>]*(?:Hammer|Wrench|Rocket|Zap|Sparkles)[^>]*/>\s*</div>""",
]

replacement = """<ProjectAvatar
                project={getMissionProjectForAvatar(mission)}
                size="md"
                className="shrink-0"
                title={`${mission?.title || mission?.name || 'Project'} logo`}
              />"""

changed_icon = False
for pattern in patterns:
    new_text, count = re.subn(pattern, replacement, text, count=1, flags=re.DOTALL)
    if count:
        text = new_text
        changed_icon = True
        break

if not changed_icon:
    print("⚠️ Could not auto-replace the old icon shell.")
    print("✅ Import/helper were added. Manually replace the icon beside the mission title with:")
    print(replacement)
else:
    print("✅ MissionCard icon shell replaced with ProjectAvatar.")

path.write_text(text)

print("✅ MissionCard.jsx prepared to render real project logos.")
print("")
print("Inspect with:")
print("rg -n \"ProjectAvatar|getMissionProjectForAvatar|Hammer|Wrench|Rocket|Ship\" src/components/home/MissionCard.jsx -C 6")
