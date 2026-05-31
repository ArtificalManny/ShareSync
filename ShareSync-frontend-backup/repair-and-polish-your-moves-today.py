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
jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-your-moves-repair-polish-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-your-moves-repair-polish-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_path.read_text()
css = css_path.read_text()

# 1) Fix the actual parser error:
# EmptyState currently ends with `);` but is missing the closing function brace.
missing_brace_pattern = "  );\n\nexport function YourMovesWidget"
if missing_brace_pattern in jsx:
    jsx = jsx.replace(
        missing_brace_pattern,
        "  );\n}\n\nexport function YourMovesWidget",
        1,
    )

# 2) Add a scoped root class to YourMovesToday.
if "your-moves-today-panel" not in jsx:
    jsx = jsx.replace(
        "        card-action\n",
        "        your-moves-today-panel\n        card-action\n",
        1,
    )

# 3) Add a scoped class to the recommendation banner.
if "your-moves-focus-brief" not in jsx:
    jsx = jsx.replace(
        '<div className="rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 px-4 py-3">',
        '<div className="your-moves-focus-brief rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 px-4 py-3">',
        1,
    )

# 4) Wrap each MoveCard in a scoped frame so the actual row can be styled reliably.
old_move_block = '''            {displayMoves.map((move, index) => (
              <MoveCard
                key={move.id || move._id || move.taskId || `move-${index}`}
                move={move}
                rank={index + 1}
                onClick={onMoveClick}
                onComplete={handleComplete}
                onSnooze={handleSnooze}
                showProject={true}
                showActions={!isCompact}
                variant={isCompact ? 'compact' : 'default'}
              />
            ))}'''

new_move_block = '''            {displayMoves.map((move, index) => (
              <div
                key={move.id || move._id || move.taskId || `move-${index}`}
                className="your-move-card-frame"
              >
                <MoveCard
                  move={move}
                  rank={index + 1}
                  onClick={onMoveClick}
                  onComplete={handleComplete}
                  onSnooze={handleSnooze}
                  showProject={true}
                  showActions={!isCompact}
                  variant={isCompact ? 'compact' : 'default'}
                />
              </div>
            ))}'''

if "your-move-card-frame" not in jsx:
    if old_move_block not in jsx:
        shutil.copy2(jsx_backup, jsx_path)
        shutil.copy2(css_backup, css_path)
        raise RuntimeError(
            "Could not find the exact MoveCard map block. No changes written.\n"
            "Run this and paste the output:\n"
            "grep -n -B 8 -A 22 \"displayMoves.map\\|<MoveCard\" src/components/focus/YourMovesToday.jsx"
        )

    jsx = jsx.replace(old_move_block, new_move_block, 1)

# 5) Remove old polish block if rerunning.
css = re.sub(
    r"/\* =========================================================\n"
    r"   YOUR MOVES TODAY VISUAL STRIKE\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* END YOUR MOVES TODAY VISUAL STRIKE \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

css_patch = r'''
/* =========================================================
   YOUR MOVES TODAY VISUAL STRIKE
   Scoped polish for src/components/focus/YourMovesToday.jsx.
   ========================================================= */

.your-moves-today-panel {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 1.65rem !important;
  border: 1px solid rgba(139, 92, 246, 0.24) !important;
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
  opacity: 0.98;
}

.your-moves-today-panel::after {
  content: "";
  position: absolute;
  right: -6rem;
  bottom: -8rem;
  z-index: 0;
  width: 20rem;
  height: 20rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.18), transparent 68%);
  filter: blur(12px);
  pointer-events: none;
}

.your-moves-today-panel > * {
  position: relative;
  z-index: 2;
}

.your-moves-focus-brief {
  background:
    linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(34, 211, 238, 0.06)) !important;
  border-color: rgba(139, 92, 246, 0.20) !important;
  box-shadow:
    0 12px 34px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.your-move-card-frame {
  position: relative;
  border-radius: 999px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.34), rgba(34, 211, 238, 0.22));
  box-shadow:
    0 14px 38px rgba(15, 23, 42, 0.08),
    0 0 24px rgba(139, 92, 246, 0.06);
}

.your-move-card-frame > * {
  border-radius: inherit !important;
  border-color: rgba(139, 92, 246, 0.16) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.06), transparent 38%),
    rgba(255, 255, 255, 0.96) !important;
}

/* Dark mode command-card styling */
html.dark .your-moves-today-panel,
html[data-theme="dark"] .your-moves-today-panel,
.dark .your-moves-today-panel,
[data-theme="dark"] .your-moves-today-panel {
  border-color: rgba(139, 92, 246, 0.42) !important;
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
html[data-theme="dark"] .your-moves-focus-brief,
.dark .your-moves-focus-brief,
[data-theme="dark"] .your-moves-focus-brief {
  background:
    linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(34, 211, 238, 0.12)) !important;
  border-color: rgba(139, 92, 246, 0.34) !important;
  box-shadow:
    0 16px 44px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.07);
}

html.dark .your-move-card-frame,
html[data-theme="dark"] .your-move-card-frame,
.dark .your-move-card-frame,
[data-theme="dark"] .your-move-card-frame {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.70), rgba(34, 211, 238, 0.42));
  box-shadow:
    0 18px 52px rgba(0, 0, 0, 0.34),
    0 0 34px rgba(139, 92, 246, 0.18);
}

html.dark .your-move-card-frame > *,
html[data-theme="dark"] .your-move-card-frame > *,
.dark .your-move-card-frame > *,
[data-theme="dark"] .your-move-card-frame > * {
  background:
    radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.22), transparent 42%),
    radial-gradient(circle at 100% 100%, rgba(34, 211, 238, 0.16), transparent 42%),
    linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.98)) !important;
  border-color: rgba(148, 163, 184, 0.22) !important;
  color: rgba(248, 250, 252, 0.96) !important;
}

/* Dark mode text clarity inside the move cards */
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
  color: rgba(248, 250, 252, 0.90);
}

html.dark .your-moves-today-panel strong,
html[data-theme="dark"] .your-moves-today-panel strong,
.dark .your-moves-today-panel strong {
  color: rgba(255, 255, 255, 0.98) !important;
}

html.dark .your-moves-today-panel [class*="text-\\[var\\(--theme-accent-primary\\)\\]"],
html[data-theme="dark"] .your-moves-today-panel [class*="text-\\[var\\(--theme-accent-primary\\)\\]"],
.dark .your-moves-today-panel [class*="text-\\[var\\(--theme-accent-primary\\)\\]"] {
  color: #a78bfa !important;
  text-shadow: 0 0 20px rgba(167, 139, 250, 0.24);
}

.your-moves-today-panel,
.your-move-card-frame {
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

.your-move-card-frame:hover {
  transform: translateY(-1px);
  box-shadow:
    0 20px 60px rgba(15, 23, 42, 0.12),
    0 0 38px rgba(139, 92, 246, 0.14);
}

html.dark .your-move-card-frame:hover,
html[data-theme="dark"] .your-move-card-frame:hover,
.dark .your-move-card-frame:hover {
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.42),
    0 0 46px rgba(139, 92, 246, 0.22),
    0 0 42px rgba(34, 211, 238, 0.12);
}

/* END YOUR MOVES TODAY VISUAL STRIKE */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

# Safety checks.
unsafe_patterns = [
    ("onClick={() =", "malformed onClick arrow"),
    ("className={className={", "double className corruption"),
]

for pattern, label in unsafe_patterns:
    if pattern in jsx:
        shutil.copy2(jsx_backup, jsx_path)
        shutil.copy2(css_backup, css_path)
        raise RuntimeError(f"Unsafe pattern detected: {label}. Original restored.")

if "function EmptyState" in jsx and "export function YourMovesWidget" in jsx:
    empty_start = jsx.find("function EmptyState")
    widget_start = jsx.find("export function YourMovesWidget")
    between = jsx[empty_start:widget_start]
    if not between.rstrip().endswith("}"):
        shutil.copy2(jsx_backup, jsx_path)
        shutil.copy2(css_backup, css_path)
        raise RuntimeError("EmptyState still appears unclosed. Original restored.")

if "your-moves-today-panel" not in jsx:
    shutil.copy2(jsx_backup, jsx_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing your-moves-today-panel. Original restored.")

if "YOUR MOVES TODAY VISUAL STRIKE" not in css:
    shutil.copy2(jsx_backup, jsx_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing CSS marker. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("YourMovesToday repair and visual polish applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Fixed the missing closing brace in EmptyState")
print("- Added your-moves-today-panel to the root panel")
print("- Added your-moves-focus-brief to the recommendation banner")
print("- Wrapped each MoveCard in your-move-card-frame")
print("- Added scoped CSS for stronger light/dark visual design")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No focus engine logic changed.")
print("No move completion/snooze logic changed.")
