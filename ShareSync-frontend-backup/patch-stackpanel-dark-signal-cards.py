from pathlib import Path
from datetime import datetime
import shutil

STACK_PATH = Path("src/features/stack/StackPanel.jsx")
CSS_PATH = Path("src/index.css")

if not STACK_PATH.exists():
    raise FileNotFoundError(f"Missing file: {STACK_PATH}")

if not CSS_PATH.exists():
    raise FileNotFoundError(f"Missing file: {CSS_PATH}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

stack_original = STACK_PATH.read_text()
css_original = CSS_PATH.read_text()

stack_backup = STACK_PATH.with_suffix(STACK_PATH.suffix + f".backup-dark-task-signals-{stamp}")
css_backup = CSS_PATH.with_suffix(CSS_PATH.suffix + f".backup-dark-task-signals-{stamp}")

shutil.copy2(STACK_PATH, stack_backup)
shutil.copy2(CSS_PATH, css_backup)

stack = stack_original
css = css_original

grid_marker = '<div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">'
grid_start = stack.find(grid_marker)

if grid_start == -1:
    raise RuntimeError(
        "Could not find the StackPanel task signal grid. No changes were written.\n"
        "Run: grep -n \"mt-5 grid\\|taskSignals.ready\\|Blocking\\|Critical\\|Assigned\" src/features/stack/StackPanel.jsx"
    )

targets = {
    "Ready": "ready",
    "Blocking": "blocking",
    "Critical": "critical",
    "Assigned": "assigned",
}

changed = []

for label, key in targets.items():
    label_pattern = f"\n              {label}\n"
    label_idx = stack.find(label_pattern, grid_start)

    if label_idx == -1:
        raise RuntimeError(
            f"Could not find the visible label '{label}' inside StackPanel task signal grid. No changes were written."
        )

    card_start = stack.rfind('<div className="rounded-2xl', grid_start, label_idx)

    if card_start == -1:
        raise RuntimeError(
            f"Could not find the outer card div for '{label}'. No changes were written."
        )

    class_start = stack.find('className="', card_start)
    if class_start == -1:
        raise RuntimeError(f"Could not find className for '{label}' card. No changes were written.")

    class_start += len('className="')
    class_end = stack.find('"', class_start)

    if class_end == -1:
        raise RuntimeError(f"Could not isolate className closing quote for '{label}'. No changes were written.")

    existing_classes = stack[class_start:class_end]
    class_to_add = f"stack-signal-card stack-signal-{key}"

    if class_to_add not in existing_classes:
        new_classes = f"{existing_classes} {class_to_add}"
        stack = stack[:class_start] + new_classes + stack[class_end:]
        changed.append(label)

if len(changed) != 4:
    STACK_PATH.write_text(stack_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError(f"Expected 4 changed cards, but changed {len(changed)}: {changed}. Original restored.")

CSS_MARKER = "STACKPANEL DARK TASK SIGNAL CARDS v1"

# Remove older copy of this exact block if it exists.
marker_idx = css.find(CSS_MARKER)
if marker_idx != -1:
    block_start = css.rfind("/*", 0, marker_idx)
    block_end = css.find("/* END STACKPANEL DARK TASK SIGNAL CARDS v1 */", marker_idx)
    if block_start != -1 and block_end != -1:
        block_end += len("/* END STACKPANEL DARK TASK SIGNAL CARDS v1 */")
        css = css[:block_start].rstrip() + "\n\n" + css[block_end:].lstrip()

css_patch = r'''
/* =========================================================
   STACKPANEL DARK TASK SIGNAL CARDS v1
   Improves Ready / Blocking / Critical / Assigned cards
   inside ProjectHome > Tasks without changing task logic.
   ========================================================= */

.stack-signal-card {
  position: relative;
  overflow: hidden;
}

.stack-signal-card > * {
  position: relative;
  z-index: 1;
}

.stack-signal-card::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;
}

html.dark .stack-signal-card,
html[data-theme="dark"] .stack-signal-card,
body.dark .stack-signal-card {
  color: #f8fafc !important;
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

html.dark .stack-signal-card::before,
html[data-theme="dark"] .stack-signal-card::before,
body.dark .stack-signal-card::before {
  opacity: 1;
}

/* Ready */
html.dark .stack-signal-ready,
html[data-theme="dark"] .stack-signal-ready,
body.dark .stack-signal-ready {
  background:
    radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.32), transparent 42%),
    linear-gradient(135deg, rgba(30, 27, 75, 0.96), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(167, 139, 250, 0.75) !important;
}

html.dark .stack-signal-ready > div:first-child,
html[data-theme="dark"] .stack-signal-ready > div:first-child,
body.dark .stack-signal-ready > div:first-child,
html.dark .stack-signal-ready svg,
html[data-theme="dark"] .stack-signal-ready svg,
body.dark .stack-signal-ready svg {
  color: #c4b5fd !important;
}

/* Blocking */
html.dark .stack-signal-blocking,
html[data-theme="dark"] .stack-signal-blocking,
body.dark .stack-signal-blocking {
  background:
    radial-gradient(circle at 12% 0%, rgba(251, 191, 36, 0.34), transparent 42%),
    linear-gradient(135deg, rgba(69, 46, 5, 0.96), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(251, 191, 36, 0.86) !important;
}

html.dark .stack-signal-blocking > div:first-child,
html[data-theme="dark"] .stack-signal-blocking > div:first-child,
body.dark .stack-signal-blocking > div:first-child,
html.dark .stack-signal-blocking svg,
html[data-theme="dark"] .stack-signal-blocking svg,
body.dark .stack-signal-blocking svg {
  color: #fbbf24 !important;
}

/* Critical */
html.dark .stack-signal-critical,
html[data-theme="dark"] .stack-signal-critical,
body.dark .stack-signal-critical {
  background:
    radial-gradient(circle at 12% 0%, rgba(244, 63, 94, 0.34), transparent 42%),
    linear-gradient(135deg, rgba(76, 5, 25, 0.96), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(251, 113, 133, 0.88) !important;
}

html.dark .stack-signal-critical > div:first-child,
html[data-theme="dark"] .stack-signal-critical > div:first-child,
body.dark .stack-signal-critical > div:first-child,
html.dark .stack-signal-critical svg,
html[data-theme="dark"] .stack-signal-critical svg,
body.dark .stack-signal-critical svg {
  color: #fb7185 !important;
}

/* Assigned */
html.dark .stack-signal-assigned,
html[data-theme="dark"] .stack-signal-assigned,
body.dark .stack-signal-assigned {
  background:
    radial-gradient(circle at 12% 0%, rgba(34, 211, 238, 0.30), transparent 42%),
    linear-gradient(135deg, rgba(8, 51, 68, 0.96), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(103, 232, 249, 0.86) !important;
}

html.dark .stack-signal-assigned > div:first-child,
html[data-theme="dark"] .stack-signal-assigned > div:first-child,
body.dark .stack-signal-assigned > div:first-child,
html.dark .stack-signal-assigned svg,
html[data-theme="dark"] .stack-signal-assigned svg,
body.dark .stack-signal-assigned svg {
  color: #67e8f9 !important;
}

/* Make the numbers punch through in dark mode */
html.dark .stack-signal-card > div:last-child,
html[data-theme="dark"] .stack-signal-card > div:last-child,
body.dark .stack-signal-card > div:last-child {
  color: #ffffff !important;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.12);
}

/* END STACKPANEL DARK TASK SIGNAL CARDS v1 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

for bad in ["onClick={() =", "className={}"]:
    if bad in stack and bad not in stack_original:
        STACK_PATH.write_text(stack_original)
        CSS_PATH.write_text(css_original)
        raise RuntimeError(f"Unsafe new JSX pattern detected: {bad}. Original restored.")

required = [
    "stack-signal-card stack-signal-ready",
    "stack-signal-card stack-signal-blocking",
    "stack-signal-card stack-signal-critical",
    "stack-signal-card stack-signal-assigned",
]

missing = [item for item in required if item not in stack]
if missing:
    STACK_PATH.write_text(stack_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError(f"Missing required classes: {missing}. Original restored.")

if CSS_MARKER not in css:
    STACK_PATH.write_text(stack_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError("CSS marker missing. Original restored.")

STACK_PATH.write_text(stack)
CSS_PATH.write_text(css)

print("StackPanel dark task signal card patch applied successfully.")
print(f"Updated file: {STACK_PATH}")
print(f"Backup file:  {stack_backup}")
print(f"Updated file: {CSS_PATH}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed cards:")
for label in changed:
    print(f"- {label}")
print("")
print("Changed only:")
print("- Added scoped classes to the four StackPanel signal cards")
print("- Added dark-mode-only readability CSS")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No task creation, fetching, filtering, or status logic changed.")
