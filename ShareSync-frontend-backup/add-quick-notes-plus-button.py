from pathlib import Path
from datetime import datetime
import shutil
import re

drawer_path = Path("src/components/global/QuickNotesDrawer.jsx")
css_path = Path("src/index.css")

if not drawer_path.exists():
    raise FileNotFoundError("Could not find src/components/global/QuickNotesDrawer.jsx")

if not css_path.exists():
    raise FileNotFoundError("Could not find src/index.css")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
drawer_backup = drawer_path.with_suffix(drawer_path.suffix + f".backup-quick-notes-plus-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-quick-notes-plus-{stamp}")

shutil.copy2(drawer_path, drawer_backup)
shutil.copy2(css_path, css_backup)

drawer = drawer_path.read_text()
css = css_path.read_text()

if "createNote" not in drawer or "handleNew" not in drawer:
    raise RuntimeError("Could not verify QuickNotesDrawer createNote/handleNew logic. No changes written.")

# 1) Make the existing top-right plus button more intentional.
# Adds a scoped class to the first button that calls handleNew.
drawer = re.sub(
    r'(<button\s+onClick=\{handleNew\}\s+className=")([^"]*)(")',
    lambda m: (
        m.group(1)
        + ("quick-notes-add-button " if "quick-notes-add-button" not in m.group(2) else "")
        + m.group(2)
        + m.group(3)
    ),
    drawer,
    count=1,
)

# 2) Add a visible list-column toolbar with a + button.
toolbar_marker = "quick-notes-list-toolbar"

if toolbar_marker not in drawer:
    nav_match = re.search(
        r'(<nav\s+className="quick-notes-list[^"]*">\s*)',
        drawer,
        flags=re.MULTILINE,
    )

    if not nav_match:
        shutil.copy2(drawer_backup, drawer_path)
        shutil.copy2(css_backup, css_path)
        raise RuntimeError("Could not find Quick Notes nav/list area. Original restored.")

    toolbar = '''$1
            <div className="quick-notes-list-toolbar">
              <span className="quick-notes-list-label">Notes</span>

              <button
                type="button"
                onClick={handleNew}
                className="quick-notes-mini-add-button"
                title="Create new note"
                aria-label="Create new note"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
'''

    drawer = drawer[:nav_match.start()] + re.sub(
        r'(<nav\s+className="quick-notes-list[^"]*">\s*)',
        toolbar,
        drawer[nav_match.start():],
        count=1,
    )

# 3) Improve empty-state create button styling.
drawer = re.sub(
    r'(className=")(mt-3 rounded-lg bg-violet-600 px-3 py-1\.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700)(")',
    r'\1quick-notes-empty-create-button \2\3',
    drawer,
    count=1,
)

# 4) Remove older version of this exact CSS block if rerunning.
css = re.sub(
    r"/\* =========================================================\n"
    r"   QUICK NOTES ADD BUTTON POLISH\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* END QUICK NOTES ADD BUTTON POLISH \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

css_patch = r'''
/* =========================================================
   QUICK NOTES ADD BUTTON POLISH
   Adds a clearer + action and dark-mode styling for Quick Notes.
   ========================================================= */

.quick-notes-list-toolbar {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.75rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9));
  backdrop-filter: blur(14px);
}

.quick-notes-list-label {
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(71, 85, 105, 0.88);
}

.quick-notes-add-button,
.quick-notes-mini-add-button,
.quick-notes-empty-create-button {
  position: relative;
  isolation: isolate;
}

.quick-notes-add-button,
.quick-notes-mini-add-button {
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.38), transparent 34%),
    linear-gradient(135deg, #a855f7 0%, #7c3aed 55%, #6d28d9 100%) !important;
  color: #ffffff !important;
  border: 1px solid rgba(196, 181, 253, 0.75) !important;
  box-shadow:
    0 12px 26px rgba(124, 58, 237, 0.24),
    0 0 18px rgba(139, 92, 246, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
}

.quick-notes-mini-add-button {
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    filter 180ms ease;
}

.quick-notes-add-button:hover,
.quick-notes-mini-add-button:hover,
.quick-notes-empty-create-button:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

.quick-notes-mini-add-button:active,
.quick-notes-add-button:active,
.quick-notes-empty-create-button:active {
  transform: translateY(0);
}

.quick-notes-mini-add-button svg,
.quick-notes-add-button svg {
  color: #ffffff !important;
  stroke: currentColor !important;
}

.quick-notes-empty-create-button {
  border-radius: 999px !important;
  background:
    linear-gradient(135deg, #a855f7 0%, #7c3aed 55%, #6d28d9 100%) !important;
  box-shadow:
    0 12px 26px rgba(124, 58, 237, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.18) !important;
}

/* Dark mode */
html.dark .quick-notes-list-toolbar,
html[data-theme="dark"] .quick-notes-list-toolbar,
.dark .quick-notes-list-toolbar,
[data-theme="dark"] .quick-notes-list-toolbar {
  border-bottom-color: rgba(148, 163, 184, 0.16);
  background:
    radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.18), transparent 42%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94));
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

html.dark .quick-notes-list-label,
html[data-theme="dark"] .quick-notes-list-label,
.dark .quick-notes-list-label,
[data-theme="dark"] .quick-notes-list-label {
  color: rgba(226, 232, 240, 0.86);
  text-shadow: 0 0 18px rgba(139, 92, 246, 0.20);
}

html.dark .quick-notes-add-button,
html.dark .quick-notes-mini-add-button,
html.dark .quick-notes-empty-create-button,
html[data-theme="dark"] .quick-notes-add-button,
html[data-theme="dark"] .quick-notes-mini-add-button,
html[data-theme="dark"] .quick-notes-empty-create-button,
.dark .quick-notes-add-button,
.dark .quick-notes-mini-add-button,
.dark .quick-notes-empty-create-button,
[data-theme="dark"] .quick-notes-add-button,
[data-theme="dark"] .quick-notes-mini-add-button,
[data-theme="dark"] .quick-notes-empty-create-button {
  background:
    radial-gradient(circle at 28% 18%, rgba(255, 255, 255, 0.28), transparent 30%),
    linear-gradient(135deg, #c084fc 0%, #8b5cf6 48%, #06b6d4 100%) !important;
  color: #ffffff !important;
  border-color: rgba(216, 180, 254, 0.68) !important;
  box-shadow:
    0 16px 34px rgba(139, 92, 246, 0.30),
    0 0 26px rgba(34, 211, 238, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.18) !important;
}

html.dark .quick-notes-add-button:focus-visible,
html.dark .quick-notes-mini-add-button:focus-visible,
html.dark .quick-notes-empty-create-button:focus-visible,
.dark .quick-notes-add-button:focus-visible,
.dark .quick-notes-mini-add-button:focus-visible,
.dark .quick-notes-empty-create-button:focus-visible {
  outline: none !important;
  box-shadow:
    0 0 0 4px rgba(196, 181, 253, 0.32),
    0 16px 34px rgba(139, 92, 246, 0.30),
    0 0 26px rgba(34, 211, 238, 0.14) !important;
}

/* END QUICK NOTES ADD BUTTON POLISH */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

unsafe_patterns = [
    ("onClick={() =", "malformed onClick arrow"),
    ("className={className={", "double className corruption"),
]

for pattern, label in unsafe_patterns:
    if pattern in drawer:
        shutil.copy2(drawer_backup, drawer_path)
        shutil.copy2(css_backup, css_path)
        raise RuntimeError(f"Unsafe pattern detected: {label}. Original restored.")

if "quick-notes-list-toolbar" not in drawer:
    shutil.copy2(drawer_backup, drawer_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing quick-notes-list-toolbar. Original restored.")

if "QUICK NOTES ADD BUTTON POLISH" not in css:
    shutil.copy2(drawer_backup, drawer_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing CSS marker. Original restored.")

drawer_path.write_text(drawer)
css_path.write_text(css)

print("Quick Notes plus button polish applied successfully.")
print(f"Updated file: {drawer_path}")
print(f"Backup file:  {drawer_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added a visible + button to the Quick Notes list column")
print("- Made the existing top + button more visually intentional")
print("- Styled the Quick Notes add buttons for dark mode")
print("")
print("No backend files touched.")
print("No NotesContext data/storage logic changed.")
print("No note saving/deleting/pinning logic changed.")
