from pathlib import Path
from datetime import datetime
import shutil
import re

STACK_PATH = Path("src/features/stack/StackPanel.jsx")
CSS_PATH = Path("src/index.css")

if not STACK_PATH.exists():
    raise FileNotFoundError(f"Missing file: {STACK_PATH}")

if not CSS_PATH.exists():
    raise FileNotFoundError(f"Missing file: {CSS_PATH}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

stack_original = STACK_PATH.read_text()
css_original = CSS_PATH.read_text()

stack_backup = STACK_PATH.with_suffix(STACK_PATH.suffix + f".backup-dark-signal-v2-{stamp}")
css_backup = CSS_PATH.with_suffix(CSS_PATH.suffix + f".backup-dark-signal-v2-{stamp}")

shutil.copy2(STACK_PATH, stack_backup)
shutil.copy2(CSS_PATH, css_backup)

stack = stack_original
css = css_original

def add_class_by_exact_classname(label, old_classes, add_classes):
    global stack

    old = f'className="{old_classes}"'
    new = f'className="{old_classes} {add_classes}"'

    if add_classes in stack:
        return True

    if old in stack:
        stack = stack.replace(old, new, 1)
        return True

    return False

def add_class_by_label(label, add_classes):
    global stack

    if add_classes in stack:
        return True

    pattern = re.compile(
        r'(<div\s+className=")([^"]*rounded-2xl[^"]*border[^"]*p-4[^"]*)(">\s*'
        r'<div\s+className="[^"]*">\s*'
        r'(?:<[^>\n]+/>\s*)?'
        + re.escape(label) +
        r'\s*</div>)',
        re.DOTALL,
    )

    match = pattern.search(stack)

    if not match:
        return False

    before, classes, after = match.groups()

    if add_classes not in classes:
        classes = classes + " " + add_classes

    stack = stack[:match.start()] + before + classes + after + stack[match.end():]
    return True

cards = [
    {
        "label": "Ready",
        "old": "rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] p-4",
        "add": "stack-signal-card stack-signal-ready",
    },
    {
        "label": "Blocking",
        "old": "rounded-2xl border border-amber-200/80 dark:border-amber-400/20 bg-amber-50/60 dark:bg-amber-500/10 p-4",
        "add": "stack-signal-card stack-signal-blocking",
    },
    {
        "label": "Critical",
        "old": "rounded-2xl border border-rose-200/80 dark:border-rose-400/20 bg-rose-50/60 dark:bg-rose-500/10 p-4",
        "add": "stack-signal-card stack-signal-critical",
    },
    {
        "label": "Assigned",
        "old": "rounded-2xl border border-cyan-200/80 dark:border-cyan-400/20 bg-cyan-50/60 dark:bg-cyan-500/10 p-4",
        "add": "stack-signal-card stack-signal-assigned",
    },
]

changed = []

for card in cards:
    ok = add_class_by_exact_classname(card["label"], card["old"], card["add"])

    if not ok:
        ok = add_class_by_label(card["label"], card["add"])

    if ok:
        changed.append(card["label"])
    else:
        STACK_PATH.write_text(stack_original)
        CSS_PATH.write_text(css_original)
        raise RuntimeError(
            f"Could not safely patch the {card['label']} signal card. Original restored."
        )

CSS_MARKER = "STACKPANEL DARK TASK SIGNAL CARDS v2"

old_marker = css.find(CSS_MARKER)
if old_marker != -1:
    block_start = css.rfind("/*", 0, old_marker)
    block_end = css.find("/* END STACKPANEL DARK TASK SIGNAL CARDS v2 */", old_marker)
    if block_start != -1 and block_end != -1:
        block_end += len("/* END STACKPANEL DARK TASK SIGNAL CARDS v2 */")
        css = css[:block_start].rstrip() + "\n\n" + css[block_end:].lstrip()

css_patch = r'''
/* =========================================================
   STACKPANEL DARK TASK SIGNAL CARDS v2
   Visual-only readability polish for ProjectHome > Tasks.
   ========================================================= */

.stack-signal-card {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.stack-signal-card > * {
  position: relative;
  z-index: 1;
}

html.dark .stack-signal-card,
html[data-theme="dark"] .stack-signal-card,
body.dark .stack-signal-card {
  color: #f8fafc !important;
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

html.dark .stack-signal-ready,
html[data-theme="dark"] .stack-signal-ready,
body.dark .stack-signal-ready {
  background:
    radial-gradient(circle at 15% 0%, rgba(139, 92, 246, 0.38), transparent 44%),
    linear-gradient(135deg, rgba(30, 27, 75, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(167, 139, 250, 0.78) !important;
}

html.dark .stack-signal-blocking,
html[data-theme="dark"] .stack-signal-blocking,
body.dark .stack-signal-blocking {
  background:
    radial-gradient(circle at 15% 0%, rgba(251, 191, 36, 0.40), transparent 44%),
    linear-gradient(135deg, rgba(69, 46, 5, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(251, 191, 36, 0.90) !important;
}

html.dark .stack-signal-critical,
html[data-theme="dark"] .stack-signal-critical,
body.dark .stack-signal-critical {
  background:
    radial-gradient(circle at 15% 0%, rgba(244, 63, 94, 0.40), transparent 44%),
    linear-gradient(135deg, rgba(76, 5, 25, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(251, 113, 133, 0.92) !important;
}

html.dark .stack-signal-assigned,
html[data-theme="dark"] .stack-signal-assigned,
body.dark .stack-signal-assigned {
  background:
    radial-gradient(circle at 15% 0%, rgba(34, 211, 238, 0.36), transparent 44%),
    linear-gradient(135deg, rgba(8, 51, 68, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(103, 232, 249, 0.90) !important;
}

html.dark .stack-signal-ready div:first-child,
html[data-theme="dark"] .stack-signal-ready div:first-child,
body.dark .stack-signal-ready div:first-child,
html.dark .stack-signal-ready svg,
html[data-theme="dark"] .stack-signal-ready svg,
body.dark .stack-signal-ready svg {
  color: #c4b5fd !important;
}

html.dark .stack-signal-blocking div:first-child,
html[data-theme="dark"] .stack-signal-blocking div:first-child,
body.dark .stack-signal-blocking div:first-child,
html.dark .stack-signal-blocking svg,
html[data-theme="dark"] .stack-signal-blocking svg,
body.dark .stack-signal-blocking svg {
  color: #fbbf24 !important;
}

html.dark .stack-signal-critical div:first-child,
html[data-theme="dark"] .stack-signal-critical div:first-child,
body.dark .stack-signal-critical div:first-child,
html.dark .stack-signal-critical svg,
html[data-theme="dark"] .stack-signal-critical svg,
body.dark .stack-signal-critical svg {
  color: #fb7185 !important;
}

html.dark .stack-signal-assigned div:first-child,
html[data-theme="dark"] .stack-signal-assigned div:first-child,
body.dark .stack-signal-assigned div:first-child,
html.dark .stack-signal-assigned svg,
html[data-theme="dark"] .stack-signal-assigned svg,
body.dark .stack-signal-assigned svg {
  color: #67e8f9 !important;
}

html.dark .stack-signal-card div:last-child,
html[data-theme="dark"] .stack-signal-card div:last-child,
body.dark .stack-signal-card div:last-child {
  color: #ffffff !important;
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.14);
}

/* END STACKPANEL DARK TASK SIGNAL CARDS v2 */
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
    CSS_MARKER,
]

missing = []
for item in required:
    if item not in stack and item not in css:
        missing.append(item)

if missing:
    STACK_PATH.write_text(stack_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError(f"Patch incomplete. Missing: {missing}. Original restored.")

STACK_PATH.write_text(stack)
CSS_PATH.write_text(css)

print("StackPanel dark signal cards v2 patch applied successfully.")
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
print("- Added scoped visual classes to the four StackPanel signal cards")
print("- Added dark-mode-only CSS for better contrast/readability")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No task creation, fetching, filtering, or status logic changed.")
