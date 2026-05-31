from pathlib import Path
from datetime import datetime
import shutil
import re

css_path = Path("src/index.css")

if not css_path.exists():
    raise FileNotFoundError("Could not find src/index.css")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-quick-notes-contrast-{stamp}")
shutil.copy2(css_path, css_backup)

css = css_path.read_text()

# Remove older version if rerunning.
css = re.sub(
    r"/\* =========================================================\n"
    r"   QUICK NOTES DRAWER CONTRAST REPAIR\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* END QUICK NOTES DRAWER CONTRAST REPAIR \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

patch = r'''
/* =========================================================
   QUICK NOTES DRAWER CONTRAST REPAIR
   Fixes washed-out note list/editor text in light + dark mode.
   Styling only. No note storage, auth, or create/delete logic changes.
   ========================================================= */

/* Base drawer surface */
.quick-notes-drawer,
.quick-notes-drawer-polished {
  color: #0f172a !important;
  background:
    radial-gradient(circle at 100% 100%, rgba(168, 85, 247, 0.08), transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)) !important;
}

/* Left notes column */
.quick-notes-drawer .quick-notes-list,
.quick-notes-drawer-polished .quick-notes-list {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)) !important;
  border-right-color: rgba(203, 213, 225, 0.95) !important;
}

/* Note rows */
.quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button),
.quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button) {
  color: #0f172a !important;
  background: transparent !important;
  border-bottom-color: rgba(226, 232, 240, 0.95) !important;
}

/* Selected / active note row */
.quick-notes-drawer .quick-notes-list button[class*="bg-violet"],
.quick-notes-drawer-polished .quick-notes-list button[class*="bg-violet"] {
  background:
    linear-gradient(135deg, rgba(237, 233, 254, 0.96), rgba(245, 243, 255, 0.82)) !important;
  border-left: 3px solid #8b5cf6 !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.75),
    0 10px 24px rgba(124, 58, 237, 0.08) !important;
}

/* Note title/subtitle readability */
.quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button) [class*="font"],
.quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button) [class*="font"] {
  color: #111827 !important;
  -webkit-text-fill-color: currentColor !important;
}

.quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button) [class*="text-xs"],
.quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button) [class*="text-xs"] {
  color: #64748b !important;
  -webkit-text-fill-color: currentColor !important;
}

/* Selected note text */
.quick-notes-drawer .quick-notes-list button[class*="bg-violet"] [class*="font"],
.quick-notes-drawer-polished .quick-notes-list button[class*="bg-violet"] [class*="font"] {
  color: #6d28d9 !important;
}

.quick-notes-drawer .quick-notes-list button[class*="bg-violet"] [class*="text-xs"],
.quick-notes-drawer-polished .quick-notes-list button[class*="bg-violet"] [class*="text-xs"] {
  color: #7c3aed !important;
}

/* Editor title/body fields */
.quick-notes-drawer input,
.quick-notes-drawer textarea,
.quick-notes-drawer [contenteditable="true"],
.quick-notes-drawer-polished input,
.quick-notes-drawer-polished textarea,
.quick-notes-drawer-polished [contenteditable="true"] {
  color: #0f172a !important;
  -webkit-text-fill-color: currentColor !important;
}

.quick-notes-drawer input::placeholder,
.quick-notes-drawer textarea::placeholder,
.quick-notes-drawer-polished input::placeholder,
.quick-notes-drawer-polished textarea::placeholder {
  color: rgba(100, 116, 139, 0.78) !important;
}

/* Dark mode drawer */
html.dark .quick-notes-drawer,
html.dark .quick-notes-drawer-polished,
html[data-theme="dark"] .quick-notes-drawer,
html[data-theme="dark"] .quick-notes-drawer-polished,
.dark .quick-notes-drawer,
.dark .quick-notes-drawer-polished,
[data-theme="dark"] .quick-notes-drawer,
[data-theme="dark"] .quick-notes-drawer-polished {
  color: #e5e7eb !important;
  background:
    radial-gradient(circle at 100% 100%, rgba(168, 85, 247, 0.18), transparent 34%),
    radial-gradient(circle at 0% 0%, rgba(34, 211, 238, 0.08), transparent 32%),
    linear-gradient(135deg, #020617, #0f172a 62%, #111827) !important;
  border-left-color: rgba(167, 139, 250, 0.22) !important;
}

/* Dark mode left notes column */
html.dark .quick-notes-drawer .quick-notes-list,
html.dark .quick-notes-drawer-polished .quick-notes-list,
html[data-theme="dark"] .quick-notes-drawer .quick-notes-list,
html[data-theme="dark"] .quick-notes-drawer-polished .quick-notes-list,
.dark .quick-notes-drawer .quick-notes-list,
.dark .quick-notes-drawer-polished .quick-notes-list,
[data-theme="dark"] .quick-notes-drawer .quick-notes-list,
[data-theme="dark"] .quick-notes-drawer-polished .quick-notes-list {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.96)) !important;
  border-right-color: rgba(148, 163, 184, 0.20) !important;
}

/* Dark mode note rows */
html.dark .quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button),
html.dark .quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button),
html[data-theme="dark"] .quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button),
html[data-theme="dark"] .quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button),
.dark .quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button),
.dark .quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button),
[data-theme="dark"] .quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button),
[data-theme="dark"] .quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button) {
  color: #e5e7eb !important;
  background: transparent !important;
  border-bottom-color: rgba(148, 163, 184, 0.12) !important;
}

/* Dark mode note row hover */
html.dark .quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button):hover,
html.dark .quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button):hover,
.dark .quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button):hover,
.dark .quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button):hover {
  background:
    linear-gradient(135deg, rgba(139, 92, 246, 0.14), rgba(34, 211, 238, 0.06)) !important;
}

/* Dark mode selected note */
html.dark .quick-notes-drawer .quick-notes-list button[class*="bg-violet"],
html.dark .quick-notes-drawer-polished .quick-notes-list button[class*="bg-violet"],
html[data-theme="dark"] .quick-notes-drawer .quick-notes-list button[class*="bg-violet"],
html[data-theme="dark"] .quick-notes-drawer-polished .quick-notes-list button[class*="bg-violet"],
.dark .quick-notes-drawer .quick-notes-list button[class*="bg-violet"],
.dark .quick-notes-drawer-polished .quick-notes-list button[class*="bg-violet"],
[data-theme="dark"] .quick-notes-drawer .quick-notes-list button[class*="bg-violet"],
[data-theme="dark"] .quick-notes-drawer-polished .quick-notes-list button[class*="bg-violet"] {
  background:
    linear-gradient(135deg, rgba(139, 92, 246, 0.24), rgba(15, 23, 42, 0.96)) !important;
  border-left: 3px solid #a78bfa !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 12px 28px rgba(0, 0, 0, 0.28),
    0 0 22px rgba(139, 92, 246, 0.12) !important;
}

/* Dark mode note text */
html.dark .quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button) [class*="font"],
html.dark .quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button) [class*="font"],
html[data-theme="dark"] .quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button) [class*="font"],
html[data-theme="dark"] .quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button) [class*="font"],
.dark .quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button) [class*="font"],
.dark .quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button) [class*="font"],
[data-theme="dark"] .quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button) [class*="font"],
[data-theme="dark"] .quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button) [class*="font"] {
  color: #f8fafc !important;
  -webkit-text-fill-color: currentColor !important;
}

html.dark .quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button) [class*="text-xs"],
html.dark .quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button) [class*="text-xs"],
html[data-theme="dark"] .quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button) [class*="text-xs"],
html[data-theme="dark"] .quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button) [class*="text-xs"],
.dark .quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button) [class*="text-xs"],
.dark .quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button) [class*="text-xs"],
[data-theme="dark"] .quick-notes-drawer .quick-notes-list button:not(.quick-notes-list-add-button) [class*="text-xs"],
[data-theme="dark"] .quick-notes-drawer-polished .quick-notes-list button:not(.quick-notes-list-add-button) [class*="text-xs"] {
  color: #aab7ca !important;
  -webkit-text-fill-color: currentColor !important;
}

/* Dark mode editor/header fields */
html.dark .quick-notes-drawer input,
html.dark .quick-notes-drawer textarea,
html.dark .quick-notes-drawer [contenteditable="true"],
html.dark .quick-notes-drawer-polished input,
html.dark .quick-notes-drawer-polished textarea,
html.dark .quick-notes-drawer-polished [contenteditable="true"],
html[data-theme="dark"] .quick-notes-drawer input,
html[data-theme="dark"] .quick-notes-drawer textarea,
html[data-theme="dark"] .quick-notes-drawer [contenteditable="true"],
html[data-theme="dark"] .quick-notes-drawer-polished input,
html[data-theme="dark"] .quick-notes-drawer-polished textarea,
html[data-theme="dark"] .quick-notes-drawer-polished [contenteditable="true"],
.dark .quick-notes-drawer input,
.dark .quick-notes-drawer textarea,
.dark .quick-notes-drawer [contenteditable="true"],
.dark .quick-notes-drawer-polished input,
.dark .quick-notes-drawer-polished textarea,
.dark .quick-notes-drawer-polished [contenteditable="true"],
[data-theme="dark"] .quick-notes-drawer input,
[data-theme="dark"] .quick-notes-drawer textarea,
[data-theme="dark"] .quick-notes-drawer [contenteditable="true"],
[data-theme="dark"] .quick-notes-drawer-polished input,
[data-theme="dark"] .quick-notes-drawer-polished textarea,
[data-theme="dark"] .quick-notes-drawer-polished [contenteditable="true"] {
  color: #f8fafc !important;
  -webkit-text-fill-color: currentColor !important;
  background: rgba(15, 23, 42, 0.84) !important;
  border-color: rgba(148, 163, 184, 0.22) !important;
}

html.dark .quick-notes-drawer input::placeholder,
html.dark .quick-notes-drawer textarea::placeholder,
html.dark .quick-notes-drawer-polished input::placeholder,
html.dark .quick-notes-drawer-polished textarea::placeholder,
.dark .quick-notes-drawer input::placeholder,
.dark .quick-notes-drawer textarea::placeholder,
.dark .quick-notes-drawer-polished input::placeholder,
.dark .quick-notes-drawer-polished textarea::placeholder {
  color: rgba(203, 213, 225, 0.58) !important;
}

/* Make the editor pane itself avoid bright-white/dark mismatch */
html.dark .quick-notes-drawer [class*="border-b"],
html.dark .quick-notes-drawer-polished [class*="border-b"],
.dark .quick-notes-drawer [class*="border-b"],
.dark .quick-notes-drawer-polished [class*="border-b"] {
  border-color: rgba(148, 163, 184, 0.14) !important;
}

/* END QUICK NOTES DRAWER CONTRAST REPAIR */
'''

css = css.rstrip() + "\n\n" + patch.strip() + "\n"

if "QUICK NOTES DRAWER CONTRAST REPAIR" not in css:
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch marker missing. Original restored.")

css_path.write_text(css)

print("Quick Notes drawer contrast repair applied successfully.")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Improved Quick Notes drawer contrast in light mode")
print("- Improved Quick Notes drawer contrast in dark mode")
print("- Strengthened note list titles/subtitles")
print("- Strengthened selected note styling")
print("- Strengthened editor input/body text")
print("")
print("No backend files touched.")
print("No NotesContext.jsx changes.")
print("No QuickNotesDrawer.jsx logic changes.")
print("No note creation/deletion/pinning logic changed.")
