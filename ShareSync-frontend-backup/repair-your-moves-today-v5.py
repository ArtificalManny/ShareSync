from pathlib import Path
from datetime import datetime
import shutil
import re

jsx_path = Path("src/components/focus/YourMovesToday.jsx")
css_path = Path("src/index.css")

if not jsx_path.exists():
    raise FileNotFoundError("Could not find src/components/focus/YourMovesToday.jsx")

if not css_path.exists():
    raise FileNotFoundError("Could not find src/index.css")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-your-moves-v5-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-your-moves-v5-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_path.read_text()
css = css_path.read_text()

# ---------------------------------------------------------
# 1) Fix missing closing brace for EmptyState()
# ---------------------------------------------------------
empty_marker = "function EmptyState"
widget_marker = "export function YourMovesWidget"

empty_index = jsx.find(empty_marker)
widget_index = jsx.find(widget_marker)

if empty_index == -1:
    raise RuntimeError("Could not find function EmptyState.")

if widget_index == -1:
    raise RuntimeError("Could not find export function YourMovesWidget.")

between = jsx[empty_index:widget_index]

# Original broken file ends EmptyState return with `);` but never closes the function.
if not between.rstrip().endswith("}"):
    jsx = jsx[:widget_index] + "}\n\n" + jsx[widget_index:]

# ---------------------------------------------------------
# 2) Add scoped root class to the YourMovesToday panel
# ---------------------------------------------------------
if "your-moves-today-panel" not in jsx:
    jsx = jsx.replace(
        "        card-action\n",
        "        your-moves-today-panel\n        card-action\n",
        1,
    )

# ---------------------------------------------------------
# 3) Add scoped class to the recommendation strip if exact class exists.
#    This is non-fatal; CSS also targets it structurally.
# ---------------------------------------------------------
if "your-moves-focus-brief" not in jsx:
    jsx = jsx.replace(
        'className="rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 px-4 py-3"',
        'className="your-moves-focus-brief rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 px-4 py-3"',
        1,
    )

# ---------------------------------------------------------
# 4) Add scoped class to the list wrapper if exact class exists.
#    This avoids needing to wrap MoveCard manually.
# ---------------------------------------------------------
if "your-moves-list" not in jsx:
    jsx = jsx.replace(
        '<div className="space-y-3">',
        '<div className="your-moves-list space-y-3">',
        1,
    )

# ---------------------------------------------------------
# 5) Replace old CSS block if rerunning
# ---------------------------------------------------------
css = re.sub(
    r"/\* =========================================================\n"
    r"   YOUR MOVES TODAY VISUAL STRIKE V5\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* END YOUR MOVES TODAY VISUAL STRIKE V5 \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

css_patch = r'''
/* =========================================================
   YOUR MOVES TODAY VISUAL STRIKE V5
   Scoped polish for src/components/focus/YourMovesToday.jsx.
   ========================================================= */

.your-moves-today-panel {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 1.75rem !important;
  border: 1px solid rgba(139, 92, 246, 0.26) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.12), transparent 36%),
    radial-gradient(circle at 100% 100%, rgba(45, 212, 191, 0.10), transparent 42%),
    rgba(255, 255, 255, 0.96) !important;
  box-shadow:
    0 24px 76px rgba(15, 23, 42, 0.10),
    0 0 34px rgba(139, 92, 246, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
}

.your-moves-today-panel::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  z-index: 1;
  height: 3px;
  background: linear-gradient(90deg, #8b5cf6 0%, #22d3ee 48%, #34d399 100%);
}

.your-moves-today-panel::after {
  content: "";
  position: absolute;
  right: -7rem;
  bottom: -8rem;
  z-index: 0;
  width: 22rem;
  height: 22rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.18), transparent 68%);
  filter: blur(12px);
  pointer-events: none;
}

.your-moves-today-panel > * {
  position: relative;
  z-index: 2;
}

.your-moves-focus-brief,
.your-moves-today-panel .space-y-4 > div:first-child:not(.your-moves-list) {
  background:
    linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(34, 211, 238, 0.06)) !important;
  border-color: rgba(139, 92, 246, 0.22) !important;
  box-shadow:
    0 12px 34px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
}

/* Existing MoveCard rows without wrapping them */
.your-moves-list > *,
.your-moves-today-panel .space-y-3 > * {
  border-radius: 999px !important;
  border: 1px solid rgba(139, 92, 246, 0.20) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.08), transparent 38%),
    rgba(255, 255, 255, 0.97) !important;
  box-shadow:
    0 16px 44px rgba(15, 23, 42, 0.08),
    0 0 24px rgba(139, 92, 246, 0.08) !important;
}

/* Dark mode command-card shell */
html.dark .your-moves-today-panel,
html[data-theme="dark"] .your-moves-today-panel,
.dark .your-moves-today-panel,
[data-theme="dark"] .your-moves-today-panel {
  border-color: rgba(139, 92, 246, 0.44) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.22), transparent 38%),
    radial-gradient(circle at 100% 100%, rgba(34, 211, 238, 0.16), transparent 42%),
    linear-gradient(135deg, rgba(24, 24, 27, 0.98), rgba(2, 6, 23, 0.98)) !important;
  box-shadow:
    0 30px 96px rgba(0, 0, 0, 0.50),
    0 0 58px rgba(139, 92, 246, 0.16),
    0 0 58px rgba(34, 211, 238, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

html.dark .your-moves-focus-brief,
html.dark .your-moves-today-panel .space-y-4 > div:first-child:not(.your-moves-list),
html[data-theme="dark"] .your-moves-focus-brief,
html[data-theme="dark"] .your-moves-today-panel .space-y-4 > div:first-child:not(.your-moves-list),
.dark .your-moves-focus-brief,
.dark .your-moves-today-panel .space-y-4 > div:first-child:not(.your-moves-list) {
  background:
    linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(34, 211, 238, 0.12)) !important;
  border-color: rgba(139, 92, 246, 0.34) !important;
  box-shadow:
    0 16px 44px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
}

/* Dark mode MoveCard rows */
html.dark .your-moves-list > *,
html.dark .your-moves-today-panel .space-y-3 > *,
html[data-theme="dark"] .your-moves-list > *,
html[data-theme="dark"] .your-moves-today-panel .space-y-3 > *,
.dark .your-moves-list > *,
.dark .your-moves-today-panel .space-y-3 > * {
  border-color: rgba(167, 139, 250, 0.46) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.24), transparent 42%),
    radial-gradient(circle at 100% 100%, rgba(34, 211, 238, 0.16), transparent 42%),
    linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.98)) !important;
  box-shadow:
    0 22px 64px rgba(0, 0, 0, 0.38),
    0 0 40px rgba(139, 92, 246, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
}

/* Force text clarity inside dark move rows */
html.dark .your-moves-today-panel h1,
html.dark .your-moves-today-panel h2,
html.dark .your-moves-today-panel h3,
html.dark .your-moves-today-panel h4,
html.dark .your-moves-today-panel p,
html.dark .your-moves-today-panel span,
html.dark .your-moves-today-panel button,
html[data-theme="dark"] .your-moves-today-panel h1,
html[data-theme="dark"] .your-moves-today-panel h2,
html[data-theme="dark"] .your-moves-today-panel h3,
html[data-theme="dark"] .your-moves-today-panel h4,
html[data-theme="dark"] .your-moves-today-panel p,
html[data-theme="dark"] .your-moves-today-panel span,
html[data-theme="dark"] .your-moves-today-panel button,
.dark .your-moves-today-panel h1,
.dark .your-moves-today-panel h2,
.dark .your-moves-today-panel h3,
.dark .your-moves-today-panel h4,
.dark .your-moves-today-panel p,
.dark .your-moves-today-panel span,
.dark .your-moves-today-panel button {
  color: rgba(248, 250, 252, 0.92) !important;
}

html.dark .your-moves-today-panel strong,
html[data-theme="dark"] .your-moves-today-panel strong,
.dark .your-moves-today-panel strong {
  color: #ffffff !important;
}

/* Keep purple accent text glowing */
html.dark .your-moves-today-panel [class*="violet"],
html.dark .your-moves-today-panel [class*="purple"],
html.dark .your-moves-today-panel [class*="theme-accent"],
html[data-theme="dark"] .your-moves-today-panel [class*="violet"],
html[data-theme="dark"] .your-moves-today-panel [class*="purple"],
html[data-theme="dark"] .your-moves-today-panel [class*="theme-accent"],
.dark .your-moves-today-panel [class*="violet"],
.dark .your-moves-today-panel [class*="purple"],
.dark .your-moves-today-panel [class*="theme-accent"] {
  color: #c4b5fd !important;
  text-shadow: 0 0 20px rgba(167, 139, 250, 0.26);
}

.your-moves-today-panel,
.your-moves-list > *,
.your-moves-today-panel .space-y-3 > * {
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease,
    filter 180ms ease;
}

.your-moves-today-panel:hover {
  transform: translateY(-2px);
  filter: saturate(1.05);
}

.your-moves-list > *:hover,
.your-moves-today-panel .space-y-3 > *:hover {
  transform: translateY(-1px);
  border-color: rgba(167, 139, 250, 0.62) !important;
}

html.dark .your-moves-list > *:hover,
html.dark .your-moves-today-panel .space-y-3 > *:hover,
html[data-theme="dark"] .your-moves-list > *:hover,
html[data-theme="dark"] .your-moves-today-panel .space-y-3 > *:hover,
.dark .your-moves-list > *:hover,
.dark .your-moves-today-panel .space-y-3 > *:hover {
  box-shadow:
    0 26px 76px rgba(0, 0, 0, 0.46),
    0 0 52px rgba(139, 92, 246, 0.24),
    0 0 44px rgba(34, 211, 238, 0.14) !important;
}

/* END YOUR MOVES TODAY VISUAL STRIKE V5 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

# ---------------------------------------------------------
# Safety checks
# ---------------------------------------------------------
unsafe_patterns = [
    ("onClick={() =", "malformed onClick arrow"),
    ("className={className={", "double className corruption"),
]

for pattern, label in unsafe_patterns:
    if pattern in jsx:
        shutil.copy2(jsx_backup, jsx_path)
        shutil.copy2(css_backup, css_path)
        raise RuntimeError(f"Unsafe pattern detected: {label}. Original restored.")

# Make sure EmptyState is closed before YourMovesWidget.
empty_index = jsx.find(empty_marker)
widget_index = jsx.find(widget_marker)
between = jsx[empty_index:widget_index]

if not between.rstrip().endswith("}"):
    shutil.copy2(jsx_backup, jsx_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("EmptyState still appears unclosed. Original restored.")

if "your-moves-today-panel" not in jsx:
    shutil.copy2(jsx_backup, jsx_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing your-moves-today-panel. Original restored.")

if "YOUR MOVES TODAY VISUAL STRIKE V5" not in css:
    shutil.copy2(jsx_backup, jsx_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing CSS marker. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("YourMovesToday v5 repair and visual polish applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Fixed the missing closing brace in EmptyState")
print("- Added your-moves-today-panel to the root panel")
print("- Added optional your-moves-focus-brief class when possible")
print("- Added optional your-moves-list class when possible")
print("- Styled existing MoveCard rows without exact-matching or wrapping the MoveCard block")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No focus engine logic changed.")
print("No move completion/snooze logic changed.")
