from pathlib import Path
from datetime import datetime
import shutil
import re

paths = [
    Path("src/components/suggestions/SuggestionsPanel.jsx"),
    Path("src/components/suggestions/SuggestionPanel.jsx"),
]

existing_paths = [p for p in paths if p.exists()]

if not existing_paths:
    raise RuntimeError("Could not find SuggestionsPanel.jsx or SuggestionPanel.jsx. No changes written.")

timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

for path in existing_paths:
    original = path.read_text()
    backup = Path(f"{path}.backup-before-next-moves-rename-{timestamp}")
    shutil.copy2(path, backup)

    updated = original

    # 1) Update lucide-react import:
    #    remove Lightbulb, add Sparkles, preserve everything else.
    lucide_match = re.search(
        r"import\s+\{([^}]+)\}\s+from\s+['\"]lucide-react['\"];",
        updated
    )

    if not lucide_match:
        print(f"Skipping {path}: no lucide-react import found.")
        continue

    icons_raw = lucide_match.group(1)
    icons = [icon.strip() for icon in icons_raw.split(",") if icon.strip()]

    icons = [icon for icon in icons if icon != "Lightbulb"]

    if "Sparkles" not in icons:
        icons.insert(0, "Sparkles")

    new_import = "import { " + ", ".join(icons) + " } from 'lucide-react';"

    updated = (
        updated[:lucide_match.start()]
        + new_import
        + updated[lucide_match.end():]
    )

    # 2) Replace Lightbulb icon usages with Sparkles.
    updated = updated.replace("<Lightbulb", "<Sparkles")
    updated = updated.replace("</Lightbulb>", "</Sparkles>")

    # 3) Rename visible title only. Do NOT rename component/API names.
    updated = re.sub(
        r">Suggestions<",
        r">Next Moves<",
        updated
    )

    # 4) Update user-facing copy only.
    updated = updated.replace(
        "Community feedback for this project",
        "Community ideas and next actions for this project"
    )
    updated = updated.replace(
        "Internal ideas & requests",
        "Internal ideas and next actions"
    )
    updated = updated.replace(
        "Ideas from spectators",
        "Ideas and next actions from the community"
    )
    updated = updated.replace(
        "No suggestions found.",
        "No next moves found."
    )
    updated = updated.replace(
        "No suggestions yet",
        "No next moves yet"
    )
    updated = updated.replace(
        "Follow project to suggest",
        "Follow project to suggest a next move"
    )

    # 5) Safety checks.
    if "Lightbulb" in updated:
        path.write_text(original)
        raise RuntimeError(
            f"Safety check failed in {path}: Lightbulb still exists. Original restored. Backup kept at: {backup}"
        )

    if "Next Moves" not in updated:
        path.write_text(original)
        raise RuntimeError(
            f"Safety check failed in {path}: Next Moves title missing. Original restored. Backup kept at: {backup}"
        )

    if "Sparkles" not in updated:
        path.write_text(original)
        raise RuntimeError(
            f"Safety check failed in {path}: Sparkles icon missing. Original restored. Backup kept at: {backup}"
        )

    # Make sure we did not accidentally rename the component name.
    if "const NextMovesPanel" in updated or "export default NextMovesPanel" in updated:
        path.write_text(original)
        raise RuntimeError(
            f"Unsafe component rename detected in {path}. Original restored. Backup kept at: {backup}"
        )

    path.write_text(updated)

    print(f"Updated file: {path}")
    print(f"Backup file:  {backup}")
    print("Changed only:")
    print("- Visible heading: Suggestions → Next Moves")
    print("- Header/empty-state icon: Lightbulb → Sparkles")
    print("- Small user-facing copy around next moves")
    print("Kept intact:")
    print("- Component names")
    print("- API calls")
    print("- Suggestion creation/voting/deleting/converting logic")
    print("- Files and Announcements")
    print("")

print("Done.")
