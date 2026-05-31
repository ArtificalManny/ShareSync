from pathlib import Path
from datetime import datetime
import shutil
import re

ROOT = Path("src")
CSS_PATH = Path("src/index.css")

if not ROOT.exists():
    raise FileNotFoundError("Missing src directory.")

if not CSS_PATH.exists():
    raise FileNotFoundError(f"Missing file: {CSS_PATH}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

# Find the actual Board component file.
candidate_files = []
for path in ROOT.rglob("*"):
    if path.suffix not in [".jsx", ".tsx", ".js", ".ts"]:
        continue
    if ".bak" in path.name or "backup" in path.name.lower():
        continue

    text = path.read_text(errors="ignore")
    lower = text.lower()

    score = 0
    for needle in ["flow map", "live board", "in motion", "review", "blocked", "done"]:
        if needle in lower:
            score += 1

    if score >= 4:
        candidate_files.append((score, path))

if not candidate_files:
    raise RuntimeError(
        "Could not find the Board component file.\n"
        "Run this and paste the output:\n"
        "grep -Rni \"flow map\\|live board\\|in motion\\|blocked\\|done\" src | head -n 80"
    )

candidate_files.sort(reverse=True, key=lambda item: item[0])
BOARD_PATH = candidate_files[0][1]

board_original = BOARD_PATH.read_text()
css_original = CSS_PATH.read_text()

board_backup = BOARD_PATH.with_suffix(BOARD_PATH.suffix + f".backup-board-dark-signals-{stamp}")
css_backup = CSS_PATH.with_suffix(CSS_PATH.suffix + f".backup-board-dark-signals-{stamp}")

shutil.copy2(BOARD_PATH, board_backup)
shutil.copy2(CSS_PATH, css_backup)

board = board_original
css = css_original

labels = {
    "In Motion": "motion",
    "Review": "review",
    "Blocked": "blocked",
    "Done": "done",
}

changed = []

def add_classes_to_nearest_card(label, tone):
    global board

    if f"board-signal-{tone}" in board:
        changed.append(label)
        return True

    # Find visible label occurrence.
    label_patterns = [
        f">{label}<",
        f"{label}",
    ]

    label_idx = -1
    for pattern in label_patterns:
        label_idx = board.find(pattern)
        if label_idx != -1:
            break

    if label_idx == -1:
        return False

    # Look backward from the label for the nearest likely stat-card wrapper.
    search_start = max(0, label_idx - 2500)
    window = board[search_start:label_idx]

    matches = list(re.finditer(r'<div\s+className="([^"]*)"', window, re.DOTALL))
    if not matches:
        return False

    scored = []
    for m in matches:
        classes = m.group(1)

        score = 0
        if "rounded" in classes:
            score += 4
        if "border" in classes:
            score += 4
        if "bg-" in classes or "dark:" in classes:
            score += 3
        if "p-" in classes or "px-" in classes or "py-" in classes:
            score += 2
        if "grid" in classes:
            score -= 5
        if "gap-" in classes and "rounded" not in classes:
            score -= 4

        # Prefer cards close to the label.
        absolute_start = search_start + m.start()
        distance = label_idx - absolute_start
        if distance < 900:
            score += 3

        if score >= 8:
            scored.append((score, absolute_start, search_start + m.end(), classes))

    if not scored:
        return False

    scored.sort(key=lambda x: (x[0], x[1]), reverse=True)
    score, class_start_abs, class_end_abs, classes = scored[0]

    class_value_start = board.find('className="', class_start_abs) + len('className="')
    class_value_end = board.find('"', class_value_start)

    add = f" board-signal-card board-signal-{tone}"
    if add.strip() not in classes:
        board = board[:class_value_end] + add + board[class_value_end:]

    changed.append(label)
    return True

for label, tone in labels.items():
    ok = add_classes_to_nearest_card(label, tone)
    if not ok:
        BOARD_PATH.write_text(board_original)
        CSS_PATH.write_text(css_original)
        raise RuntimeError(
            f"Could not safely patch the Board stat card for '{label}'. Original restored.\n"
            f"Detected Board file: {BOARD_PATH}\n"
            "Run this and paste the output:\n"
            f"grep -n \"In Motion\\|Review\\|Blocked\\|Done\\|Flow Map\\|Live Board\" {BOARD_PATH}"
        )

CSS_MARKER = "BOARD DARK FLOW SIGNAL CARDS v1"

# Remove older version of this block if present.
marker_idx = css.find(CSS_MARKER)
if marker_idx != -1:
    block_start = css.rfind("/*", 0, marker_idx)
    block_end = css.find("/* END BOARD DARK FLOW SIGNAL CARDS v1 */", marker_idx)
    if block_start != -1 and block_end != -1:
        block_end += len("/* END BOARD DARK FLOW SIGNAL CARDS v1 */")
        css = css[:block_start].rstrip() + "\n\n" + css[block_end:].lstrip()

css_patch = r'''
/* =========================================================
   BOARD DARK FLOW SIGNAL CARDS v1
   Improves ProjectHome > Board stat cards:
   In Motion / Review / Blocked / Done.
   ========================================================= */

.board-signal-card {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.board-signal-card > * {
  position: relative;
  z-index: 1;
}

html.dark .board-signal-card,
html[data-theme="dark"] .board-signal-card,
body.dark .board-signal-card {
  color: #f8fafc !important;
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

/* In Motion */
html.dark .board-signal-motion,
html[data-theme="dark"] .board-signal-motion,
body.dark .board-signal-motion {
  background:
    radial-gradient(circle at 15% 0%, rgba(139, 92, 246, 0.38), transparent 44%),
    linear-gradient(135deg, rgba(30, 27, 75, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(167, 139, 250, 0.82) !important;
}

/* Review */
html.dark .board-signal-review,
html[data-theme="dark"] .board-signal-review,
body.dark .board-signal-review {
  background:
    radial-gradient(circle at 15% 0%, rgba(251, 191, 36, 0.40), transparent 44%),
    linear-gradient(135deg, rgba(69, 46, 5, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(251, 191, 36, 0.90) !important;
}

/* Blocked */
html.dark .board-signal-blocked,
html[data-theme="dark"] .board-signal-blocked,
body.dark .board-signal-blocked {
  background:
    radial-gradient(circle at 15% 0%, rgba(244, 63, 94, 0.40), transparent 44%),
    linear-gradient(135deg, rgba(76, 5, 25, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(251, 113, 133, 0.92) !important;
}

/* Done */
html.dark .board-signal-done,
html[data-theme="dark"] .board-signal-done,
body.dark .board-signal-done {
  background:
    radial-gradient(circle at 15% 0%, rgba(16, 185, 129, 0.36), transparent 44%),
    linear-gradient(135deg, rgba(6, 78, 59, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(52, 211, 153, 0.90) !important;
}

html.dark .board-signal-card div:first-child,
html[data-theme="dark"] .board-signal-card div:first-child,
body.dark .board-signal-card div:first-child {
  opacity: 1 !important;
  text-shadow: 0 0 16px rgba(255, 255, 255, 0.12);
}

html.dark .board-signal-card div:last-child,
html[data-theme="dark"] .board-signal-card div:last-child,
body.dark .board-signal-card div:last-child {
  color: #ffffff !important;
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.14);
}

/* END BOARD DARK FLOW SIGNAL CARDS v1 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

for bad in ["onClick={() =", "className={}"]:
    if bad in board and bad not in board_original:
        BOARD_PATH.write_text(board_original)
        CSS_PATH.write_text(css_original)
        raise RuntimeError(f"Unsafe new JSX pattern detected: {bad}. Original restored.")

required_board = [
    "board-signal-card board-signal-motion",
    "board-signal-card board-signal-review",
    "board-signal-card board-signal-blocked",
    "board-signal-card board-signal-done",
]

missing = [item for item in required_board if item not in board]

if missing or CSS_MARKER not in css:
    BOARD_PATH.write_text(board_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError(f"Patch incomplete. Missing: {missing}. Original restored.")

BOARD_PATH.write_text(board)
CSS_PATH.write_text(css)

print("Board dark signal card patch applied successfully.")
print(f"Detected Board file: {BOARD_PATH}")
print(f"Updated file: {BOARD_PATH}")
print(f"Backup file:  {board_backup}")
print(f"Updated file: {CSS_PATH}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed cards:")
for label in changed:
    print(f"- {label}")
print("")
print("Changed only:")
print("- Added scoped visual classes to Board stat cards")
print("- Added dark-mode-only CSS for Board signal card readability")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No board task movement, fetching, filtering, or status logic changed.")
