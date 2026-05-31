from pathlib import Path
from datetime import datetime
import re

FILE_PATH = Path("src/components/roadmap/RoadmapPanel.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = FILE_PATH.with_suffix(FILE_PATH.suffix + f".backup-fix-roadmap-button-jsx-{timestamp}")
backup_path.write_text(original)

MALFORMED_ONCLICK = re.compile(
    r'onClick=\{\(\)\s*=\s*className="(?P<class_name>[^"]+)">\s*(?P<handler>[^}]+?)\}'
)

def find_button_tag_end(text, start_index):
    quote = None
    brace_depth = 0
    i = start_index

    while i < len(text):
        ch = text[i]
        prev = text[i - 1] if i > 0 else ""

        if quote:
            if ch == quote and prev != "\\":
                quote = None
        else:
            if ch in ("'", '"', "`"):
                quote = ch
            elif ch == "{":
                brace_depth += 1
            elif ch == "}":
                brace_depth = max(0, brace_depth - 1)
            elif ch == ">" and brace_depth == 0:
                return i

        i += 1

    raise RuntimeError("Could not find the end of a <button> opening tag.")

def add_class_to_tag(tag, class_name):
    if class_name in tag:
        return tag

    if 'className="' in tag:
        return tag.replace('className="', f'className="{class_name} ', 1)

    if "className='" in tag:
        return tag.replace("className='", f"className='{class_name} ", 1)

    if "className={`" in tag:
        return tag.replace("className={`", f"className={{`{class_name} ", 1)

    # Fallback: add className before the closing >
    return tag[:-1] + f' className="{class_name}">'

updated = original
button_positions = []
search_from = 0

while True:
    index = updated.find("<button", search_from)
    if index == -1:
        break
    button_positions.append(index)
    search_from = index + len("<button")

# Work backwards so replacements do not shift earlier positions.
fixed_count = 0

for button_start in reversed(button_positions):
    button_end = find_button_tag_end(updated, button_start)
    tag = updated[button_start:button_end + 1]

    matches = list(MALFORMED_ONCLICK.finditer(tag))
    if not matches:
        continue

    classes_to_add = []

    def repair_onclick(match):
        class_name = match.group("class_name").strip()
        handler = match.group("handler").strip()
        classes_to_add.append(class_name)
        return f"onClick={{() => {handler}}}"

    repaired_tag = MALFORMED_ONCLICK.sub(repair_onclick, tag)

    for class_name in classes_to_add:
        repaired_tag = add_class_to_tag(repaired_tag, class_name)

    updated = updated[:button_start] + repaired_tag + updated[button_end + 1:]
    fixed_count += len(matches)

if fixed_count == 0:
    raise RuntimeError(
        "No corrupted Roadmap button onClick patterns were found. "
        "No changes were written. Backup was still saved."
    )

if 'onClick={() = className=' in updated:
    raise RuntimeError(
        "A corrupted onClick pattern still exists after repair. "
        "No changes were written."
    )

FILE_PATH.write_text(updated)

print("Roadmap button JSX repair applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print(f"Fixed corrupted onClick attributes: {fixed_count}")
print("")
print("Changed only:")
print("- Repaired malformed button onClick JSX")
print("- Preserved/added the intended visual class on the same button")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No milestone creation, editing, deleting, filtering, sorting, or refresh logic was changed.")
