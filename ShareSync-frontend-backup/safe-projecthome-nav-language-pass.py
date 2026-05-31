from pathlib import Path
import re
import shutil
from datetime import datetime

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise RuntimeError(f"Could not find {path}")

original = path.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"{path}.backup-nav-language-{timestamp}")

start = original.find("const PROJECT_VIEWS = [")
if start == -1:
    raise RuntimeError("Could not find const PROJECT_VIEWS = [. No changes written.")

end = original.find("\n];", start)
if end == -1:
    raise RuntimeError("Could not find end of PROJECT_VIEWS array. No changes written.")

end += len("\n];")
block = original[start:end]

required_ids = [
    "overview",
    "tasks",
    "board",
    "roadmap",
    "schedule",
    "discussion",
    "files",
    "announcements",
    "insights",
    "suggestions",
]

missing = [view_id for view_id in required_ids if f'id: "{view_id}"' not in block]
if missing:
    raise RuntimeError(
        "PROJECT_VIEWS is missing expected view ids: "
        + ", ".join(missing)
        + ". No changes written."
    )

updates = {
    # Keep ids unchanged. Only change user-facing language.
    "overview": {
        "label": "Command",
        "description": "Status, blockers, next move",
    },
    "tasks": {
        "label": "Moves",
        "description": "Execution queue",
    },
    "board": {
        "label": "Flow",
        "description": "Workflow lanes",
    },
    "roadmap": {
        "label": "Roadmap",
        "description": "Milestones & timeline",
    },
    "schedule": {
        "label": "Schedule",
        "description": "Cadence & timing",
    },
    "discussion": {
        "label": "Team Room",
        "description": "Threads & team context",
    },
    "files": {
        "label": "Files",
        "description": "Files & assets",
    },
    "announcements": {
        "label": "Announcements",
        "description": "Project broadcasts",
    },
    "insights": {
        "label": "Signals",
        "description": "Velocity & health",
    },
    "suggestions": {
        "label": "Next Moves",
        "description": "AI guidance",
    },
}

def replace_view_object(source_block, view_id, label, description):
    pattern = re.compile(
        r'(\{\s*id:\s*"' + re.escape(view_id) + r'",.*?\n\s*\})',
        re.DOTALL,
    )

    matches = list(pattern.finditer(source_block))
    if len(matches) != 1:
        raise RuntimeError(
            f"Expected exactly one PROJECT_VIEWS object for id '{view_id}', found {len(matches)}."
        )

    match = matches[0]
    old_obj = match.group(1)

    if 'label:' not in old_obj:
        raise RuntimeError(f"Could not find label field for id '{view_id}'.")

    if 'description:' not in old_obj:
        raise RuntimeError(f"Could not find description field for id '{view_id}'.")

    new_obj = re.sub(
        r'label:\s*"[^"]*"',
        f'label: "{label}"',
        old_obj,
        count=1,
    )

    new_obj = re.sub(
        r'description:\s*"[^"]*"',
        f'description: "{description}"',
        new_obj,
        count=1,
    )

    return source_block[:match.start(1)] + new_obj + source_block[match.end(1):]

new_block = block
for view_id, data in updates.items():
    new_block = replace_view_object(
        new_block,
        view_id,
        data["label"],
        data["description"],
    )

# Critical safety checks.
for view_id in required_ids:
    if f'id: "{view_id}"' not in new_block:
        raise RuntimeError(f"Unsafe result: id '{view_id}' disappeared. No changes written.")

for protected_label in ['label: "Files"', 'label: "Announcements"']:
    if protected_label not in new_block:
        raise RuntimeError(f"Unsafe result: {protected_label} missing. No changes written.")

new_text = original[:start] + new_block + original[end:]

# Make sure only the PROJECT_VIEWS block changed.
if original[:start] != new_text[:start]:
    raise RuntimeError("Unsafe result: content before PROJECT_VIEWS changed. No changes written.")

if original[end:] != new_text[start + len(new_block):]:
    raise RuntimeError("Unsafe result: content after PROJECT_VIEWS changed. No changes written.")

shutil.copy2(path, backup)
path.write_text(new_text)

print("ProjectHome nav language pass applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only the PROJECT_VIEWS labels/descriptions:")
print("- Overview -> Command")
print("- Tasks -> Moves")
print("- Board -> Flow")
print("- Discussion -> Team Room")
print("- Insights -> Signals")
print("")
print("Kept intact:")
print("- Files tab")
print("- Announcements tab")
print("- All renderViewContent cases")
print("- All imports")
print("- All backend/API logic")
print("- All routing ids")
