from pathlib import Path
from datetime import datetime
import shutil
import re

jsx_candidates = [
    Path("src/features/stack/StackTaskRow.jsx"),
    Path("src/components/views/FlowView.jsx"),
]

css_candidates = [
    Path("src/theme.css"),
    Path("src/index.css"),
    Path("src/App.css"),
]

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
patched_files = []

def add_attribute_to_start_buttons(path: Path):
    if not path.exists():
        return False

    text = path.read_text()
    original = text

    # Find literal Start text, then find the closest opening <button ...> before it.
    positions = [m.start() for m in re.finditer(r'>\s*Start\s*<|{\s*[\'"]Start[\'"]\s*}', text)]
    if not positions:
        positions = [m.start() for m in re.finditer(r'\bStart\b', text)]

    offset = 0
    changed = False

    for raw_pos in positions:
        pos = raw_pos + offset
        button_start = text.rfind("<button", 0, pos)
        if button_start == -1:
            continue

        button_open_end = text.find(">", button_start)
        if button_open_end == -1 or button_open_end > pos:
            continue

        opening = text[button_start:button_open_end]

        # Only patch each button once.
        if "data-openshare-start-force" in opening:
            continue

        patched_opening = opening + ' data-openshare-start-force="true"'

        text = text[:button_start] + patched_opening + text[button_open_end:]
        offset += len(patched_opening) - len(opening)
        changed = True

    if changed and text != original:
        backup = path.with_name(path.name + f".backup-before-start-data-attr-{stamp}")
        shutil.copy2(path, backup)
        path.write_text(text)
        print(f"✅ Tagged Start button in {path}")
        print(f"   Backup: {backup}")
        return True

    return False

for path in jsx_candidates:
    if add_attribute_to_start_buttons(path):
        patched_files.append(str(path))

css = """
/* openshare-force-start-button-visible-by-attribute-v1 */
button[data-openshare-start-force="true"],
button[data-openshare-start-force="true"]:disabled,
button[data-openshare-start-force="true"][disabled] {
  min-width: 92px !important;
  opacity: 1 !important;
  visibility: visible !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  background-color: #7c3aed !important;
  background-image: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 52%, #6d28d9 100%) !important;
  border: 1px solid rgba(124, 58, 237, 0.86) !important;
  box-shadow:
    0 14px 34px rgba(124, 58, 237, 0.34),
    0 0 0 1px rgba(255, 255, 255, 0.42) inset,
    inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.45) !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

button[data-openshare-start-force="true"] *,
button[data-openshare-start-force="true"]:disabled *,
button[data-openshare-start-force="true"][disabled] * {
  opacity: 1 !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  stroke: #ffffff !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

button[data-openshare-start-force="true"]:hover:not(:disabled) {
  background-color: #6d28d9 !important;
  background-image: linear-gradient(135deg, #7c3aed 0%, #6d28d9 52%, #5b21b6 100%) !important;
  box-shadow:
    0 18px 44px rgba(124, 58, 237, 0.46),
    0 0 0 1px rgba(255, 255, 255, 0.46) inset,
    inset 0 1px 0 rgba(255, 255, 255, 0.42) !important;
  transform: translateY(-1px);
}
/* end openshare-force-start-button-visible-by-attribute-v1 */
"""

css_written = False

for path in css_candidates:
    if not path.exists():
        continue

    text = path.read_text()
    if "openshare-force-start-button-visible-by-attribute-v1" in text:
        print(f"ℹ️ CSS override already exists in {path}")
        css_written = True
        continue

    backup = path.with_name(path.name + f".backup-before-start-force-css-{stamp}")
    shutil.copy2(path, backup)
    path.write_text(text.rstrip() + "\n\n" + css + "\n")
    print(f"✅ Added Start button CSS override to {path}")
    print(f"   Backup: {backup}")
    css_written = True
    break

if not patched_files:
    raise RuntimeError(
        "Could not find and tag the Start button in StackTaskRow.jsx or FlowView.jsx. "
        "Run: grep -R -n \"Start\" src/features src/components | head -40"
    )

if not css_written:
    raise RuntimeError("Could not find theme.css, index.css, or App.css to write the CSS override.")

print("")
print("Done.")
print("Tagged files:", ", ".join(patched_files))
print("Now restart Vite and hard refresh.")
