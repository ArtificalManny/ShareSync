from pathlib import Path
from datetime import datetime
import shutil

jsx_path = Path("src/components/focus/YourMovesToday.jsx")
css_path = Path("src/index.css")

if not jsx_path.exists():
    raise FileNotFoundError(f"Missing file: {jsx_path}")

if not css_path.exists():
    raise FileNotFoundError(f"Missing file: {css_path}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

jsx_original = jsx_path.read_text()
css_original = css_path.read_text()

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-movecards-dark-v3-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-movecards-dark-v3-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_original
css = css_original

if "export default function YourMovesToday" not in jsx:
    raise RuntimeError("Could not verify YourMovesToday.jsx. No changes written.")

# Ensure main scope class exists.
if "your-moves-today-panel" not in jsx:
    if "card-action" not in jsx:
        raise RuntimeError("Could not find card-action wrapper. No changes written.")
    jsx = jsx.replace("card-action", "your-moves-today-panel card-action", 1)

# Add explicit wrapper around each MoveCard.
old_block = """              <MoveCard
                key={move.id || move._id || move.taskId || `move-${index}`}
                move={move}
                rank={index + 1}
                onClick={onMoveClick}
                onComplete={handleComplete}
                onSnooze={handleSnooze}
                showProject={true}
                showActions={!isCompact}
                variant={isCompact ? 'compact' : 'default'}
              />"""

new_block = """              <div
                key={move.id || move._id || move.taskId || `move-${index}`}
                className="your-moves-move-card-wrap"
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
              </div>"""

if "your-moves-move-card-wrap" not in jsx:
    if old_block not in jsx:
        raise RuntimeError(
            "Could not find the exact MoveCard block to wrap. No changes written.\n"
            "Run this and paste the output:\n"
            "grep -n \"MoveCard\\|key={move.id\\|showActions\\|variant={isCompact\" src/components/focus/YourMovesToday.jsx"
        )
    jsx = jsx.replace(old_block, new_block, 1)

# Remove older YourMovesToday dark-mode CSS blocks.
def remove_block(text, title):
    start_marker = f"/* =========================================================\n   {title}"
    end_marker = f"/* END {title} */"
    start = text.find(start_marker)
    if start == -1:
        return text
    end = text.find(end_marker, start)
    if end == -1:
        return text
    end += len(end_marker)
    return text[:start].rstrip() + "\n\n" + text[end:].lstrip()

css = remove_block(css, "YOUR MOVES TODAY DARKMODE STRIKE v1")
css = remove_block(css, "YOUR MOVES TODAY DARKMODE REPAIR v2")
css = remove_block(css, "YOUR MOVES TODAY MOVE CARDS DARKMODE v3")

css_patch = r'''
/* =========================================================
   YOUR MOVES TODAY MOVE CARDS DARKMODE v3
   Fixes the actual MoveCard rows under Home > Your 3 Moves Today.
   ========================================================= */

.your-moves-today-panel {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

html.dark .your-moves-today-panel,
html[data-theme="dark"] .your-moves-today-panel,
body.dark .your-moves-today-panel {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.22), transparent 36%),
    radial-gradient(circle at 96% 18%, rgba(45, 212, 191, 0.14), transparent 34%),
    linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(8, 13, 25, 0.96)) !important;
  border-color: rgba(167, 139, 250, 0.26) !important;
  color: #f8fafc !important;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(167, 139, 250, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

/* The real MoveCard wrapper */
html.dark .your-moves-move-card-wrap,
html[data-theme="dark"] .your-moves-move-card-wrap,
body.dark .your-moves-move-card-wrap {
  border-radius: 999px;
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.22), transparent 42%),
    radial-gradient(circle at 94% 18%, rgba(45, 212, 191, 0.12), transparent 38%),
    linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(10, 15, 28, 0.96)) !important;
  border: 1px solid rgba(255, 255, 255, 0.13) !important;
  box-shadow:
    0 18px 44px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
  overflow: hidden;
}

/* Force the actual white pill child to become dark */
html.dark .your-moves-move-card-wrap > *,
html[data-theme="dark"] .your-moves-move-card-wrap > *,
body.dark .your-moves-move-card-wrap > * {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 42%),
    radial-gradient(circle at 94% 18%, rgba(45, 212, 191, 0.10), transparent 38%),
    rgba(15, 23, 42, 0.94) !important;
  color: #f8fafc !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}

/* Any stubborn inner light backgrounds */
html.dark .your-moves-move-card-wrap [class*="bg-white"],
html.dark .your-moves-move-card-wrap [class*="bg-slate-50"],
html.dark .your-moves-move-card-wrap [class*="bg-gray-50"],
html.dark .your-moves-move-card-wrap [class*="bg-zinc-50"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="bg-white"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="bg-slate-50"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="bg-gray-50"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="bg-zinc-50"],
body.dark .your-moves-move-card-wrap [class*="bg-white"],
body.dark .your-moves-move-card-wrap [class*="bg-slate-50"],
body.dark .your-moves-move-card-wrap [class*="bg-gray-50"],
body.dark .your-moves-move-card-wrap [class*="bg-zinc-50"] {
  background: rgba(255, 255, 255, 0.055) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}

/* Strong readable text inside each move row */
html.dark .your-moves-move-card-wrap h1,
html.dark .your-moves-move-card-wrap h2,
html.dark .your-moves-move-card-wrap h3,
html.dark .your-moves-move-card-wrap h4,
html.dark .your-moves-move-card-wrap strong,
html.dark .your-moves-move-card-wrap .font-bold,
html.dark .your-moves-move-card-wrap .font-black,
html[data-theme="dark"] .your-moves-move-card-wrap h1,
html[data-theme="dark"] .your-moves-move-card-wrap h2,
html[data-theme="dark"] .your-moves-move-card-wrap h3,
html[data-theme="dark"] .your-moves-move-card-wrap h4,
html[data-theme="dark"] .your-moves-move-card-wrap strong,
html[data-theme="dark"] .your-moves-move-card-wrap .font-bold,
html[data-theme="dark"] .your-moves-move-card-wrap .font-black,
body.dark .your-moves-move-card-wrap h1,
body.dark .your-moves-move-card-wrap h2,
body.dark .your-moves-move-card-wrap h3,
body.dark .your-moves-move-card-wrap h4,
body.dark .your-moves-move-card-wrap strong,
body.dark .your-moves-move-card-wrap .font-bold,
body.dark .your-moves-move-card-wrap .font-black {
  color: #ffffff !important;
  opacity: 1 !important;
  text-shadow: 0 0 16px rgba(255, 255, 255, 0.12);
}

html.dark .your-moves-move-card-wrap p,
html.dark .your-moves-move-card-wrap span,
html.dark .your-moves-move-card-wrap button,
html.dark .your-moves-move-card-wrap [class*="text-slate-"],
html.dark .your-moves-move-card-wrap [class*="text-zinc-"],
html.dark .your-moves-move-card-wrap [class*="text-gray-"],
html[data-theme="dark"] .your-moves-move-card-wrap p,
html[data-theme="dark"] .your-moves-move-card-wrap span,
html[data-theme="dark"] .your-moves-move-card-wrap button,
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-slate-"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-zinc-"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-gray-"],
body.dark .your-moves-move-card-wrap p,
body.dark .your-moves-move-card-wrap span,
body.dark .your-moves-move-card-wrap button,
body.dark .your-moves-move-card-wrap [class*="text-slate-"],
body.dark .your-moves-move-card-wrap [class*="text-zinc-"],
body.dark .your-moves-move-card-wrap [class*="text-gray-"] {
  color: rgba(226, 232, 240, 0.84) !important;
  opacity: 1 !important;
}

/* Keep project pills and momentum chips visually alive */
html.dark .your-moves-move-card-wrap [class*="text-violet-"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-violet-"],
body.dark .your-moves-move-card-wrap [class*="text-violet-"] {
  color: #c4b5fd !important;
}

html.dark .your-moves-move-card-wrap [class*="text-red-"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-red-"],
body.dark .your-moves-move-card-wrap [class*="text-red-"] {
  color: #fb7185 !important;
}

html.dark .your-moves-move-card-wrap [class*="text-teal-"],
html.dark .your-moves-move-card-wrap [class*="text-emerald-"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-teal-"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-emerald-"],
body.dark .your-moves-move-card-wrap [class*="text-teal-"],
body.dark .your-moves-move-card-wrap [class*="text-emerald-"] {
  color: #5eead4 !important;
}

/* Action buttons: Complete / Edit / Dismiss */
html.dark .your-moves-move-card-wrap button,
html[data-theme="dark"] .your-moves-move-card-wrap button,
body.dark .your-moves-move-card-wrap button {
  background: rgba(255, 255, 255, 0.075) !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
}

/* END YOUR MOVES TODAY MOVE CARDS DARKMODE v3 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

for bad in ["onClick={() =", "className={}"]:
    if bad in jsx and bad not in jsx_original:
        jsx_path.write_text(jsx_original)
        css_path.write_text(css_original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

if "your-moves-move-card-wrap" not in jsx or "YOUR MOVES TODAY MOVE CARDS DARKMODE v3" not in css:
    jsx_path.write_text(jsx_original)
    css_path.write_text(css_original)
    raise RuntimeError("Patch incomplete. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("YourMovesToday MoveCard dark-mode v3 patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added wrapper around each MoveCard row")
print("- Removed older YourMovesToday dark-mode CSS blocks")
print("- Added direct dark-mode styling for the real move rows and text")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No focus engine logic changed.")
print("No move completion/snooze logic changed.")
