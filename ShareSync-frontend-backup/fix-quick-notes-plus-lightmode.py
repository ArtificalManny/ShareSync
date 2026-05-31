from pathlib import Path
from datetime import datetime
import shutil
import re

css_path = Path("src/index.css")

if not css_path.exists():
    raise FileNotFoundError("Could not find src/index.css")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = css_path.with_suffix(css_path.suffix + f".backup-quick-notes-plus-light-{stamp}")
shutil.copy2(css_path, backup)

css = css_path.read_text()

css = re.sub(
    r"/\* =========================================================\n"
    r"   QUICK NOTES PLUS LIGHT MODE VISIBILITY FIX\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* END QUICK NOTES PLUS LIGHT MODE VISIBILITY FIX \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

patch = r'''
/* =========================================================
   QUICK NOTES PLUS LIGHT MODE VISIBILITY FIX
   Makes the + button obvious in light mode without touching note logic.
   ========================================================= */

.quick-notes-list-toolbar .quick-notes-list-add-button,
.quick-notes-list-toolbar button[aria-label="Create new note"] {
  position: relative !important;
  display: inline-flex !important;
  width: 2.15rem !important;
  height: 2.15rem !important;
  min-width: 2.15rem !important;
  min-height: 2.15rem !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 999px !important;
  border: 1px solid rgba(124, 58, 237, 0.85) !important;
  background:
    radial-gradient(circle at 32% 20%, rgba(255, 255, 255, 0.48), transparent 32%),
    linear-gradient(135deg, #a855f7 0%, #7c3aed 58%, #06b6d4 100%) !important;
  color: #ffffff !important;
  opacity: 1 !important;
  box-shadow:
    0 12px 26px rgba(124, 58, 237, 0.25),
    0 0 0 4px rgba(124, 58, 237, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
}

/* Use a CSS-rendered plus so it stays visible even if the SVG inherits a bad color. */
.quick-notes-list-toolbar .quick-notes-list-add-button svg,
.quick-notes-list-toolbar button[aria-label="Create new note"] svg {
  display: none !important;
}

.quick-notes-list-toolbar .quick-notes-list-add-button::before,
.quick-notes-list-toolbar button[aria-label="Create new note"]::before {
  content: "+" !important;
  display: block !important;
  color: #ffffff !important;
  font-size: 1.45rem !important;
  font-weight: 900 !important;
  line-height: 1 !important;
  transform: translateY(-1px);
  text-shadow: 0 1px 8px rgba(15, 23, 42, 0.28);
}

.quick-notes-list-toolbar .quick-notes-list-add-button:hover,
.quick-notes-list-toolbar button[aria-label="Create new note"]:hover {
  transform: translateY(-1px) scale(1.04) !important;
  filter: brightness(1.05) !important;
  box-shadow:
    0 16px 32px rgba(124, 58, 237, 0.32),
    0 0 0 5px rgba(124, 58, 237, 0.10),
    0 0 24px rgba(34, 211, 238, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
}

.quick-notes-list-toolbar .quick-notes-list-add-button:active,
.quick-notes-list-toolbar button[aria-label="Create new note"]:active {
  transform: translateY(0) scale(0.98) !important;
}

/* Dark mode keeps the same visible + but with stronger glow. */
html.dark .quick-notes-list-toolbar .quick-notes-list-add-button,
html.dark .quick-notes-list-toolbar button[aria-label="Create new note"],
html[data-theme="dark"] .quick-notes-list-toolbar .quick-notes-list-add-button,
html[data-theme="dark"] .quick-notes-list-toolbar button[aria-label="Create new note"],
.dark .quick-notes-list-toolbar .quick-notes-list-add-button,
.dark .quick-notes-list-toolbar button[aria-label="Create new note"],
[data-theme="dark"] .quick-notes-list-toolbar .quick-notes-list-add-button,
[data-theme="dark"] .quick-notes-list-toolbar button[aria-label="Create new note"] {
  border-color: rgba(216, 180, 254, 0.78) !important;
  background:
    radial-gradient(circle at 32% 20%, rgba(255, 255, 255, 0.34), transparent 32%),
    linear-gradient(135deg, #c084fc 0%, #8b5cf6 48%, #22d3ee 100%) !important;
  box-shadow:
    0 16px 34px rgba(139, 92, 246, 0.36),
    0 0 0 4px rgba(168, 85, 247, 0.14),
    0 0 26px rgba(34, 211, 238, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.20) !important;
}

/* END QUICK NOTES PLUS LIGHT MODE VISIBILITY FIX */
'''

css = css.rstrip() + "\n\n" + patch.strip() + "\n"
css_path.write_text(css)

print("Quick Notes plus light-mode visibility fix applied successfully.")
print(f"Updated file: {css_path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Made the Quick Notes + button clearly visible in light mode")
print("- Used a CSS-rendered + so the symbol cannot disappear")
print("- Preserved the dark-mode glow")
print("")
print("No backend files touched.")
print("No NotesContext.jsx changes.")
print("No QuickNotesDrawer.jsx logic changes.")
