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

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-movecards-dark-v4-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-movecards-dark-v4-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_original
css = css_original

if "export default function YourMovesToday" not in jsx:
    raise RuntimeError("Could not verify YourMovesToday.jsx. No changes written.")

# 1) Add main scoped class to outer card.
if "your-moves-today-panel" not in jsx:
    if "card-action" not in jsx:
        raise RuntimeError("Could not find card-action. No changes written.")
    jsx = jsx.replace("card-action", "your-moves-today-panel card-action", 1)

# 2) Add recommendation card hook.
old_rec = "rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 px-4 py-3"
new_rec = "your-moves-recommendation-card rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 px-4 py-3"

if "your-moves-recommendation-card" not in jsx and old_rec in jsx:
    jsx = jsx.replace(old_rec, new_rec, 1)

# 3) Wrap the MoveCard using line parsing instead of fragile exact string matching.
if "your-moves-move-card-wrap" not in jsx:
    lines = jsx.splitlines(keepends=True)

    map_line_index = None
    for i, line in enumerate(lines):
        if "displayMoves.map((move, index) => (" in line:
            map_line_index = i
            break

    if map_line_index is None:
        raise RuntimeError(
            "Could not find displayMoves.map block. No changes written.\n"
            "Run: grep -n \"displayMoves.map\\|MoveCard\" src/components/focus/YourMovesToday.jsx"
        )

    move_start = None
    for i in range(map_line_index + 1, min(len(lines), map_line_index + 80)):
        if "<MoveCard" in lines[i]:
            move_start = i
            break

    if move_start is None:
        raise RuntimeError(
            "Could not find MoveCard inside displayMoves.map. No changes written.\n"
            "Run: grep -n \"displayMoves.map\\|MoveCard\" src/components/focus/YourMovesToday.jsx"
        )

    move_end = None
    for i in range(move_start, min(len(lines), move_start + 40)):
        if "/>" in lines[i]:
            move_end = i
            break

    if move_end is None:
        raise RuntimeError("Could not find closing /> for MoveCard. No changes written.")

    indent = lines[move_start].split("<MoveCard")[0]
    child_indent = indent + "  "

    move_block = lines[move_start:move_end + 1]

    # Remove the key prop from MoveCard because the wrapper now needs the React key.
    filtered_move_block = []
    for line in move_block:
        if "key={move.id || move._id || move.taskId || `move-${index}`}" in line:
            continue
        filtered_move_block.append(line)

    wrapped_block = [
        f'{indent}<div\n',
        f'{child_indent}key={{move.id || move._id || move.taskId || `move-${{index}}`}}\n',
        f'{child_indent}className="your-moves-move-card-wrap"\n',
        f'{indent}>\n',
    ] + filtered_move_block + [
        f'{indent}</div>\n',
    ]

    lines = lines[:move_start] + wrapped_block + lines[move_end + 1:]
    jsx = "".join(lines)

# 4) Repair missing EmptyState closing brace if this exact issue exists.
# Your pasted file shows `return (...);` immediately followed by `export function YourMovesWidget`.
if "function EmptyState" in jsx and "  );\n\nexport function YourMovesWidget" in jsx:
    jsx = jsx.replace("  );\n\nexport function YourMovesWidget", "  );\n}\n\nexport function YourMovesWidget", 1)

# 5) Remove older blocks that may fight the final styling.
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

for title in [
    "YOUR MOVES TODAY DARKMODE STRIKE v1",
    "YOUR MOVES TODAY DARKMODE REPAIR v2",
    "YOUR MOVES TODAY MOVE CARDS DARKMODE v3",
    "YOUR MOVES TODAY MOVE CARDS DARKMODE v4",
]:
    css = remove_block(css, title)

css_patch = r'''
/* =========================================================
   YOUR MOVES TODAY MOVE CARDS DARKMODE v4
   Home > Your 3 Moves Today:
   directly targets the real MoveCard wrapper.
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
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.24), transparent 36%),
    radial-gradient(circle at 96% 18%, rgba(45, 212, 191, 0.16), transparent 34%),
    linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(8, 13, 25, 0.96)) !important;
  border-color: rgba(167, 139, 250, 0.28) !important;
  color: #f8fafc !important;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(167, 139, 250, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

html.dark .your-moves-recommendation-card,
html[data-theme="dark"] .your-moves-recommendation-card,
body.dark .your-moves-recommendation-card {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.22), transparent 42%),
    radial-gradient(circle at 94% 0%, rgba(45, 212, 191, 0.12), transparent 38%),
    rgba(255, 255, 255, 0.055) !important;
  border-color: rgba(196, 181, 253, 0.28) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    0 18px 38px rgba(0, 0, 0, 0.24) !important;
}

/* The direct wrapper around each MoveCard */
html.dark .your-moves-move-card-wrap,
html[data-theme="dark"] .your-moves-move-card-wrap,
body.dark .your-moves-move-card-wrap {
  border-radius: 28px !important;
  overflow: hidden !important;
  border: 1px solid rgba(167, 139, 250, 0.30) !important;
  background:
    radial-gradient(circle at 7% 0%, rgba(139, 92, 246, 0.30), transparent 42%),
    radial-gradient(circle at 96% 20%, rgba(45, 212, 191, 0.16), transparent 40%),
    linear-gradient(135deg, rgba(20, 24, 38, 0.98), rgba(9, 14, 26, 0.98)) !important;
  box-shadow:
    0 18px 44px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.11) !important;
}

/* Kill the white pill background from the MoveCard root */
html.dark .your-moves-move-card-wrap > *,
html[data-theme="dark"] .your-moves-move-card-wrap > *,
body.dark .your-moves-move-card-wrap > * {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.20), transparent 42%),
    radial-gradient(circle at 94% 18%, rgba(45, 212, 191, 0.12), transparent 38%),
    rgba(15, 23, 42, 0.92) !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
  color: #f8fafc !important;
  box-shadow: none !important;
}

/* Kill stubborn inner light backgrounds */
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
  background: rgba(255, 255, 255, 0.07) !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
}

/* Make actual titles and numbers pop */
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
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.14);
}

/* General text readability */
html.dark .your-moves-move-card-wrap p,
html.dark .your-moves-move-card-wrap span,
html.dark .your-moves-move-card-wrap div,
html.dark .your-moves-move-card-wrap button,
html.dark .your-moves-move-card-wrap [class*="text-slate-"],
html.dark .your-moves-move-card-wrap [class*="text-zinc-"],
html.dark .your-moves-move-card-wrap [class*="text-gray-"],
html[data-theme="dark"] .your-moves-move-card-wrap p,
html[data-theme="dark"] .your-moves-move-card-wrap span,
html[data-theme="dark"] .your-moves-move-card-wrap div,
html[data-theme="dark"] .your-moves-move-card-wrap button,
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-slate-"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-zinc-"],
html[data-theme="dark"] .your-moves-move-card-wrap [class*="text-gray-"],
body.dark .your-moves-move-card-wrap p,
body.dark .your-moves-move-card-wrap span,
body.dark .your-moves-move-card-wrap div,
body.dark .your-moves-move-card-wrap button,
body.dark .your-moves-move-card-wrap [class*="text-slate-"],
body.dark .your-moves-move-card-wrap [class*="text-zinc-"],
body.dark .your-moves-move-card-wrap [class*="text-gray-"] {
  color: rgba(226, 232, 240, 0.88) !important;
  opacity: 1 !important;
}

/* Keep accent pills alive */
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

/* Move action buttons */
html.dark .your-moves-move-card-wrap button,
html[data-theme="dark"] .your-moves-move-card-wrap button,
body.dark .your-moves-move-card-wrap button {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.16) !important;
}

/* END YOUR MOVES TODAY MOVE CARDS DARKMODE v4 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

for bad in ["onClick={() =", "className={}"]:
    if bad in jsx and bad not in jsx_original:
        jsx_path.write_text(jsx_original)
        css_path.write_text(css_original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

if "your-moves-move-card-wrap" not in jsx or "YOUR MOVES TODAY MOVE CARDS DARKMODE v4" not in css:
    jsx_path.write_text(jsx_original)
    css_path.write_text(css_original)
    raise RuntimeError("Patch incomplete. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("YourMovesToday MoveCard dark-mode v4 patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added your-moves-today-panel scope class")
print("- Added wrapper around each rendered MoveCard row")
print("- Removed older YourMovesToday dark-mode CSS blocks")
print("- Added direct dark-mode styling for the real move rows and text")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No focus engine logic changed.")
print("No move completion/snooze logic changed.")
