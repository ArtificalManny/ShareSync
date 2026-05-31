from pathlib import Path
from datetime import datetime
import shutil
import re

css_path = Path("src/index.css")

if not css_path.exists():
    raise FileNotFoundError("Could not find src/index.css")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = css_path.with_suffix(css_path.suffix + f".backup-final-quick-notes-plus-{stamp}")
shutil.copy2(css_path, backup)

css = css_path.read_text()

css = re.sub(
    r"/\* =========================================================\n"
    r"   FINAL QUICK NOTES PLUS VISIBILITY FIX\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* END FINAL QUICK NOTES PLUS VISIBILITY FIX \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

patch = r'''
/* =========================================================
   FINAL QUICK NOTES PLUS VISIBILITY FIX
   Forces the Quick Notes list + button to be readable in light and dark mode.
   ========================================================= */

/* Light mode: make the + unmistakable */
.quick-notes-list-toolbar button,
.quick-notes-list-toolbar .quick-notes-list-add-button,
.quick-notes-list-toolbar .quick-notes-add-button,
.quick-notes-list-toolbar button[aria-label="Create new note"],
.quick-notes-list-toolbar button[title="Create new note"] {
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;

  width: 2.25rem !important;
  height: 2.25rem !important;
  min-width: 2.25rem !important;
  min-height: 2.25rem !important;

  padding: 0 !important;
  border-radius: 999px !important;

  background:
    radial-gradient(circle at 30% 18%, rgba(255, 255, 255, 0.45), transparent 34%),
    linear-gradient(135deg, #9333ea 0%, #7c3aed 52%, #2563eb 100%) !important;

  border: 1px solid rgba(88, 28, 135, 0.72) !important;
  color: #ffffff !important;
  opacity: 1 !important;

  box-shadow:
    0 12px 26px rgba(124, 58, 237, 0.28),
    0 0 0 3px rgba(124, 58, 237, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;

  transform: none;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    filter 160ms ease !important;
}

/* Hide any inherited Lucide/SVG plus if it is too faint */
.quick-notes-list-toolbar button svg,
.quick-notes-list-toolbar .quick-notes-list-add-button svg,
.quick-notes-list-toolbar .quick-notes-add-button svg,
.quick-notes-list-toolbar button[aria-label="Create new note"] svg,
.quick-notes-list-toolbar button[title="Create new note"] svg {
  display: none !important;
}

/* Draw a guaranteed high-contrast plus */
.quick-notes-list-toolbar button::before,
.quick-notes-list-toolbar .quick-notes-list-add-button::before,
.quick-notes-list-toolbar .quick-notes-add-button::before,
.quick-notes-list-toolbar button[aria-label="Create new note"]::before,
.quick-notes-list-toolbar button[title="Create new note"]::before {
  content: "+" !important;
  display: block !important;
  color: #ffffff !important;
  font-size: 1.55rem !important;
  font-weight: 950 !important;
  line-height: 1 !important;
  transform: translateY(-1px) !important;
  text-shadow:
    0 1px 2px rgba(15, 23, 42, 0.45),
    0 0 12px rgba(255, 255, 255, 0.18) !important;
}

.quick-notes-list-toolbar button:hover,
.quick-notes-list-toolbar .quick-notes-list-add-button:hover,
.quick-notes-list-toolbar .quick-notes-add-button:hover,
.quick-notes-list-toolbar button[aria-label="Create new note"]:hover,
.quick-notes-list-toolbar button[title="Create new note"]:hover {
  transform: translateY(-1px) scale(1.04) !important;
  filter: brightness(1.08) saturate(1.08) !important;
  box-shadow:
    0 16px 34px rgba(124, 58, 237, 0.36),
    0 0 0 4px rgba(124, 58, 237, 0.16),
    0 0 24px rgba(37, 99, 235, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
}

.quick-notes-list-toolbar button:active,
.quick-notes-list-toolbar .quick-notes-list-add-button:active,
.quick-notes-list-toolbar .quick-notes-add-button:active,
.quick-notes-list-toolbar button[aria-label="Create new note"]:active,
.quick-notes-list-toolbar button[title="Create new note"]:active {
  transform: translateY(0) scale(0.98) !important;
}

/* Dark mode: keep it premium and visible */
html.dark .quick-notes-list-toolbar button,
html.dark .quick-notes-list-toolbar .quick-notes-list-add-button,
html.dark .quick-notes-list-toolbar .quick-notes-add-button,
html.dark .quick-notes-list-toolbar button[aria-label="Create new note"],
html.dark .quick-notes-list-toolbar button[title="Create new note"],
html[data-theme="dark"] .quick-notes-list-toolbar button,
html[data-theme="dark"] .quick-notes-list-toolbar .quick-notes-list-add-button,
html[data-theme="dark"] .quick-notes-list-toolbar .quick-notes-add-button,
html[data-theme="dark"] .quick-notes-list-toolbar button[aria-label="Create new note"],
html[data-theme="dark"] .quick-notes-list-toolbar button[title="Create new note"],
.dark .quick-notes-list-toolbar button,
.dark .quick-notes-list-toolbar .quick-notes-list-add-button,
.dark .quick-notes-list-toolbar .quick-notes-add-button,
.dark .quick-notes-list-toolbar button[aria-label="Create new note"],
.dark .quick-notes-list-toolbar button[title="Create new note"],
[data-theme="dark"] .quick-notes-list-toolbar button,
[data-theme="dark"] .quick-notes-list-toolbar .quick-notes-list-add-button,
[data-theme="dark"] .quick-notes-list-toolbar .quick-notes-add-button,
[data-theme="dark"] .quick-notes-list-toolbar button[aria-label="Create new note"],
[data-theme="dark"] .quick-notes-list-toolbar button[title="Create new note"] {
  background:
    radial-gradient(circle at 30% 18%, rgba(255, 255, 255, 0.34), transparent 34%),
    linear-gradient(135deg, #c084fc 0%, #8b5cf6 48%, #22d3ee 100%) !important;

  border-color: rgba(216, 180, 254, 0.82) !important;
  color: #ffffff !important;

  box-shadow:
    0 16px 34px rgba(139, 92, 246, 0.38),
    0 0 0 4px rgba(168, 85, 247, 0.16),
    0 0 26px rgba(34, 211, 238, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
}

/* END FINAL QUICK NOTES PLUS VISIBILITY FIX */
'''

css = css.rstrip() + "\n\n" + patch.strip() + "\n"
css_path.write_text(css)

print("Final Quick Notes plus visibility fix applied successfully.")
print(f"Updated file: {css_path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Made the Quick Notes + button clearly visible in light mode")
print("- Forced a CSS-rendered white + symbol")
print("- Preserved polished dark-mode styling")
print("")
print("No backend files touched.")
print("No NotesContext.jsx changes.")
print("No QuickNotesDrawer.jsx logic changes.")
