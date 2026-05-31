from pathlib import Path
from datetime import datetime
import shutil
import re

JSX_PATH = Path("src/pages/ProjectHome.jsx")
CSS_PATH = Path("src/index.css")

if not JSX_PATH.exists():
    raise FileNotFoundError(f"Missing file: {JSX_PATH}")

if not CSS_PATH.exists():
    raise FileNotFoundError(f"Missing file: {CSS_PATH}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

jsx_original = JSX_PATH.read_text()
css_original = CSS_PATH.read_text()

jsx_backup = JSX_PATH.with_suffix(JSX_PATH.suffix + f".backup-task-stat-darkmode-{stamp}")
css_backup = CSS_PATH.with_suffix(CSS_PATH.suffix + f".backup-task-stat-darkmode-{stamp}")

shutil.copy2(JSX_PATH, jsx_backup)
shutil.copy2(CSS_PATH, css_backup)

jsx = jsx_original
css = css_original

targets = {
    "READY": "project-home-task-signal-ready",
    "BLOCKING": "project-home-task-signal-blocking",
    "CRITICAL": "project-home-task-signal-critical",
    "ASSIGNED": "project-home-task-signal-assigned",
}

def find_card_opening_before_label(source, label):
    label_idx = source.find(label)
    if label_idx == -1:
        return None

    window_start = max(0, label_idx - 2500)
    window = source[window_start:label_idx]

    # Find literal className divs before the label.
    matches = list(re.finditer(
        r'<div\s+className=(["\'`])([^"\'`]*)\1',
        window,
        flags=re.DOTALL
    ))

    candidates = []

    for m in matches:
        class_text = m.group(2)
        score = 0

        if "rounded" in class_text:
            score += 3
        if "border" in class_text:
            score += 3
        if "bg-white" in class_text or "dark:" in class_text:
            score += 2
        if "p-" in class_text or "px-" in class_text or "py-" in class_text:
            score += 1
        if "border-t" in class_text:
            score += 4

        # Avoid selecting tiny icon/label rows.
        if "gap-" in class_text and "items-center" in class_text and "rounded" not in class_text:
            score -= 4

        if score >= 5:
            candidates.append((score, window_start + m.start(), window_start + m.end(), class_text))

    if not candidates:
        return None

    candidates.sort(key=lambda item: (item[0], item[1]), reverse=True)
    return candidates[0]

changes = []

for label, class_to_add in targets.items():
    hit = find_card_opening_before_label(jsx, label)

    if hit is None:
        print(f"Warning: Could not confidently find card for {label}. Skipping this one.")
        continue

    score, start, end, class_text = hit

    if class_to_add in class_text:
        continue

    new_class_text = class_text + f" project-home-task-signal {class_to_add}"
    old_opening = jsx[start:end]
    new_opening = old_opening.replace(class_text, new_class_text, 1)

    jsx = jsx[:start] + new_opening + jsx[end:]
    changes.append((label, class_to_add, score))

if not changes:
    JSX_PATH.write_text(jsx_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError(
        "No task stat cards were changed. Original restored.\n"
        "Run this and paste the output:\n"
        "grep -n \"READY\\|BLOCKING\\|CRITICAL\\|ASSIGNED\" src/pages/ProjectHome.jsx"
    )

CSS_MARKER = "PROJECTHOME TASK STAT DARK MODE v1"

if CSS_MARKER in css:
    start = css.find(f"/* ═══════════════════════════════════════════════════════════════════════\n   {CSS_MARKER}")
    if start != -1:
        css = css[:start].rstrip()

css_patch = r'''
/* ═══════════════════════════════════════════════════════════════════════
   PROJECTHOME TASK STAT DARK MODE v1
   Makes Ready / Blocking / Critical / Assigned metric cards readable
   and visually stronger in dark mode.
   ═══════════════════════════════════════════════════════════════════════ */

html.dark .project-home-task-signal,
html[data-theme="dark"] .project-home-task-signal,
body.dark .project-home-task-signal {
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.90)) !important;
  color: #f8fafc !important;
  border-color: rgba(148, 163, 184, 0.28) !important;
  box-shadow:
    0 22px 48px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

html.dark .project-home-task-signal *,
html[data-theme="dark"] .project-home-task-signal *,
body.dark .project-home-task-signal * {
  opacity: 1 !important;
}

html.dark .project-home-task-signal-ready,
html[data-theme="dark"] .project-home-task-signal-ready,
body.dark .project-home-task-signal-ready {
  border-color: rgba(139, 92, 246, 0.72) !important;
  background:
    radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.30), transparent 42%),
    linear-gradient(135deg, rgba(30, 27, 75, 0.96), rgba(15, 23, 42, 0.92)) !important;
}

html.dark .project-home-task-signal-blocking,
html[data-theme="dark"] .project-home-task-signal-blocking,
body.dark .project-home-task-signal-blocking {
  border-color: rgba(251, 191, 36, 0.80) !important;
  background:
    radial-gradient(circle at 12% 0%, rgba(251, 191, 36, 0.30), transparent 42%),
    linear-gradient(135deg, rgba(69, 46, 5, 0.94), rgba(15, 23, 42, 0.92)) !important;
}

html.dark .project-home-task-signal-critical,
html[data-theme="dark"] .project-home-task-signal-critical,
body.dark .project-home-task-signal-critical {
  border-color: rgba(244, 63, 94, 0.82) !important;
  background:
    radial-gradient(circle at 12% 0%, rgba(244, 63, 94, 0.30), transparent 42%),
    linear-gradient(135deg, rgba(76, 5, 25, 0.94), rgba(15, 23, 42, 0.92)) !important;
}

html.dark .project-home-task-signal-assigned,
html[data-theme="dark"] .project-home-task-signal-assigned,
body.dark .project-home-task-signal-assigned {
  border-color: rgba(34, 211, 238, 0.82) !important;
  background:
    radial-gradient(circle at 12% 0%, rgba(34, 211, 238, 0.28), transparent 42%),
    linear-gradient(135deg, rgba(8, 51, 68, 0.94), rgba(15, 23, 42, 0.92)) !important;
}

html.dark .project-home-task-signal-ready [class*="tracking"],
html[data-theme="dark"] .project-home-task-signal-ready [class*="tracking"],
body.dark .project-home-task-signal-ready [class*="tracking"] {
  color: #c4b5fd !important;
  text-shadow: 0 0 18px rgba(139, 92, 246, 0.42) !important;
}

html.dark .project-home-task-signal-blocking [class*="tracking"],
html[data-theme="dark"] .project-home-task-signal-blocking [class*="tracking"],
body.dark .project-home-task-signal-blocking [class*="tracking"] {
  color: #fbbf24 !important;
  text-shadow: 0 0 18px rgba(251, 191, 36, 0.42) !important;
}

html.dark .project-home-task-signal-critical [class*="tracking"],
html[data-theme="dark"] .project-home-task-signal-critical [class*="tracking"],
body.dark .project-home-task-signal-critical [class*="tracking"] {
  color: #fb7185 !important;
  text-shadow: 0 0 18px rgba(244, 63, 94, 0.42) !important;
}

html.dark .project-home-task-signal-assigned [class*="tracking"],
html[data-theme="dark"] .project-home-task-signal-assigned [class*="tracking"],
body.dark .project-home-task-signal-assigned [class*="tracking"] {
  color: #67e8f9 !important;
  text-shadow: 0 0 18px rgba(34, 211, 238, 0.42) !important;
}

html.dark .project-home-task-signal-ready svg,
html[data-theme="dark"] .project-home-task-signal-ready svg,
body.dark .project-home-task-signal-ready svg {
  color: #c4b5fd !important;
}

html.dark .project-home-task-signal-blocking svg,
html[data-theme="dark"] .project-home-task-signal-blocking svg,
body.dark .project-home-task-signal-blocking svg {
  color: #fbbf24 !important;
}

html.dark .project-home-task-signal-critical svg,
html[data-theme="dark"] .project-home-task-signal-critical svg,
body.dark .project-home-task-signal-critical svg {
  color: #fb7185 !important;
}

html.dark .project-home-task-signal-assigned svg,
html[data-theme="dark"] .project-home-task-signal-assigned svg,
body.dark .project-home-task-signal-assigned svg {
  color: #67e8f9 !important;
}
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

# Safety checks: only reject newly introduced corruption.
for bad in ["onClick={() =", "className={}"]:
    if bad in jsx and bad not in jsx_original:
        JSX_PATH.write_text(jsx_original)
        CSS_PATH.write_text(css_original)
        raise RuntimeError(f"Unsafe new JSX pattern detected: {bad}. Original restored.")

if "project-home-task-signal" not in jsx:
    JSX_PATH.write_text(jsx_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError("Task signal classes were not added. Original restored.")

if CSS_MARKER not in css:
    JSX_PATH.write_text(jsx_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError("Dark mode CSS block was not added. Original restored.")

JSX_PATH.write_text(jsx)
CSS_PATH.write_text(css)

print("ProjectHome task stat dark-mode readability patch applied successfully.")
print(f"Updated file: {JSX_PATH}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {CSS_PATH}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed cards:")
for label, class_name, score in changes:
    print(f"- {label}: added {class_name} / match score {score}")
print("")
print("Changed only:")
print("- Added precise classes to Ready / Blocking / Critical / Assigned task stat cards")
print("- Added dark-mode-only readability CSS to src/index.css")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No task creation, fetching, filtering, or status logic changed.")
