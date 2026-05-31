from pathlib import Path
from datetime import datetime
import shutil
import re

jsx_path = Path("src/pages/ProjectHome.jsx")
css_path = Path("src/index.css")

if not jsx_path.exists():
    raise FileNotFoundError(f"Missing file: {jsx_path}")

if not css_path.exists():
    raise FileNotFoundError(f"Missing file: {css_path}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-overview-pulse-signalcards-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-overview-pulse-signalcards-{stamp}")

jsx_original = jsx_path.read_text()
css_original = css_path.read_text()

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_original
css = css_original

required = [
    "const signalCards = [",
    'label: "Today"',
    'label: "In motion"',
    'label: "Ready"',
    "card.glow",
]

missing = [item for item in required if item not in jsx]
if missing:
    raise RuntimeError(
        f"Could not verify current Overview Pulse signalCards structure. Missing: {missing}. No changes written.\n"
        "Run this and paste the output:\n"
        "grep -n \"signalCards\\|card.glow\\|Today\\|In motion\\|Ready\" src/pages/ProjectHome.jsx"
    )

def patch_single_line_glow(text, label, css_class):
    pattern = re.compile(
        rf'(label:\s*"{re.escape(label)}"[\s\S]*?glow:\s*)"([^"]*)"',
        re.MULTILINE
    )

    match = pattern.search(text)
    if not match:
        raise RuntimeError(f"Could not find glow string for {label}. No changes written.")

    current = match.group(2)

    if css_class in current:
        return text

    updated = f"{css_class} overview-pulse-signal-card {current}"
    return text[:match.start(2)] + updated + text[match.end(2):]

try:
    jsx = patch_single_line_glow(jsx, "Today", "overview-pulse-today")
    jsx = patch_single_line_glow(jsx, "In motion", "overview-pulse-in-motion")
    jsx = patch_single_line_glow(jsx, "Ready", "overview-pulse-ready")
except Exception as e:
    jsx_path.write_text(jsx_original)
    css_path.write_text(css_original)
    raise e

marker = "OVERVIEW PULSE SIGNALCARDS DARKMODE v1"

if marker in css:
    start = css.find("/* =========================================================\n   OVERVIEW PULSE SIGNALCARDS DARKMODE v1")
    end = css.find("/* END OVERVIEW PULSE SIGNALCARDS DARKMODE v1 */", start)
    if start != -1 and end != -1:
        end += len("/* END OVERVIEW PULSE SIGNALCARDS DARKMODE v1 */")
        css = css[:start].rstrip() + "\n\n" + css[end:].lstrip()

css_patch = r'''
/* =========================================================
   OVERVIEW PULSE SIGNALCARDS DARKMODE v1
   ProjectHome > Overview > Pulse:
   Today / In motion / Ready dark-mode readability.
   ========================================================= */

html.dark .overview-pulse-signal-card,
html[data-theme="dark"] .overview-pulse-signal-card,
body.dark .overview-pulse-signal-card {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  color: #f8fafc !important;
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

html.dark .overview-pulse-today,
html[data-theme="dark"] .overview-pulse-today,
body.dark .overview-pulse-today {
  background:
    radial-gradient(circle at 15% 0%, rgba(251, 146, 60, 0.42), transparent 44%),
    linear-gradient(135deg, rgba(67, 20, 7, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(251, 146, 60, 0.88) !important;
}

html.dark .overview-pulse-in-motion,
html[data-theme="dark"] .overview-pulse-in-motion,
body.dark .overview-pulse-in-motion {
  background:
    radial-gradient(circle at 15% 0%, rgba(139, 92, 246, 0.42), transparent 44%),
    linear-gradient(135deg, rgba(30, 27, 75, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(167, 139, 250, 0.88) !important;
}

html.dark .overview-pulse-ready,
html[data-theme="dark"] .overview-pulse-ready,
body.dark .overview-pulse-ready {
  background:
    radial-gradient(circle at 15% 0%, rgba(16, 185, 129, 0.40), transparent 44%),
    linear-gradient(135deg, rgba(6, 78, 59, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(52, 211, 153, 0.90) !important;
}

html.dark .overview-pulse-today svg,
html.dark .overview-pulse-today span {
  color: #fb923c !important;
}

html.dark .overview-pulse-in-motion svg,
html.dark .overview-pulse-in-motion span {
  color: #c4b5fd !important;
}

html.dark .overview-pulse-ready svg,
html.dark .overview-pulse-ready span {
  color: #34d399 !important;
}

html.dark .overview-pulse-signal-card p,
html.dark .overview-pulse-signal-card div,
html.dark .overview-pulse-signal-card span {
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.10);
}

html.dark .overview-pulse-signal-card .text-3xl,
html[data-theme="dark"] .overview-pulse-signal-card .text-3xl,
body.dark .overview-pulse-signal-card .text-3xl {
  color: #ffffff !important;
}

/* END OVERVIEW PULSE SIGNALCARDS DARKMODE v1 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

for bad in ["onClick={() =", "className={}"]:
    if bad in jsx and bad not in jsx_original:
        jsx_path.write_text(jsx_original)
        css_path.write_text(css_original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

for required_class in ["overview-pulse-today", "overview-pulse-in-motion", "overview-pulse-ready"]:
    if required_class not in jsx:
        jsx_path.write_text(jsx_original)
        css_path.write_text(css_original)
        raise RuntimeError(f"Patch incomplete. Missing {required_class}. Original restored.")

if marker not in css:
    jsx_path.write_text(jsx_original)
    css_path.write_text(css_original)
    raise RuntimeError("CSS marker was not added. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Overview Pulse signalCards dark-mode patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added scoped dark-mode classes to the existing Pulse signalCards glow strings")
print("- Added dark-mode CSS for Today / In motion / Ready")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No pulse counts, project logic, routing, or overview loading changed.")
