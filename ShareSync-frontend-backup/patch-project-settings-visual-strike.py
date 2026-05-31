from pathlib import Path
from datetime import datetime
import shutil

jsx_path = Path("src/pages/project/ProjectSettings.jsx")
css_path = Path("src/index.css")

if not jsx_path.exists():
    raise FileNotFoundError(f"Missing file: {jsx_path}")

if not css_path.exists():
    raise FileNotFoundError(f"Missing file: {css_path}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

jsx_original = jsx_path.read_text()
css_original = css_path.read_text()

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-project-settings-visual-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-project-settings-visual-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_original
css = css_original

if "const ProjectSettings = () =>" not in jsx:
    raise RuntimeError("Could not verify ProjectSettings.jsx. No changes written.")

# Root page scope
root_old = 'className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-800 dark:text-white pb-20 transition-colors"'
root_new = 'className="project-settings-page min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-800 dark:text-white pb-20 transition-colors"'

if "project-settings-page" not in jsx:
    if root_old not in jsx:
        raise RuntimeError("Could not find ProjectSettings root page div. No changes written.")
    jsx = jsx.replace(root_old, root_new, 1)

# Main shell scope
shell_old = 'className="max-w-4xl mx-auto px-6 py-8"'
shell_new = 'className="project-settings-shell max-w-4xl mx-auto px-6 py-8"'

if "project-settings-shell" not in jsx:
    if shell_old not in jsx:
        raise RuntimeError("Could not find ProjectSettings shell div. No changes written.")
    jsx = jsx.replace(shell_old, shell_new, 1)

# Header scope
header_old = '<div className="flex items-center gap-4 mb-8">'
header_new = '<div className="project-settings-header flex items-center gap-4 mb-8">'

if "project-settings-header" not in jsx:
    if header_old not in jsx:
        raise RuntimeError("Could not find ProjectSettings header div. No changes written.")
    jsx = jsx.replace(header_old, header_new, 1)

# Project info card scope
info_old = "<div className={`bg-slate-800/50 backdrop-blur-xl border ${canEditProjectInfo ? 'border-brand-500/20' : 'border-slate-700/50'} rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden`}>"
info_new = "<div className={`project-settings-card project-information-card bg-slate-800/50 backdrop-blur-xl border ${canEditProjectInfo ? 'border-brand-500/20' : 'border-slate-700/50'} rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden`}>"

if "project-information-card" not in jsx:
    if info_old not in jsx:
        raise RuntimeError("Could not find Project Information card. No changes written.")
    jsx = jsx.replace(info_old, info_new, 1)

# Notification card scope
notif_old = '<div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-blue-500/20 rounded-2xl p-6 shadow-xl mb-6">'
notif_new = '<div className="project-settings-card project-notifications-card bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-blue-500/20 rounded-2xl p-6 shadow-xl mb-6">'

if "project-notifications-card" not in jsx:
    if notif_old not in jsx:
        raise RuntimeError("Could not find notification preferences card. No changes written.")
    jsx = jsx.replace(notif_old, notif_new, 1)

# Notification description scope
desc_old = '<p className="text-sm text-slate-600 dark:text-slate-400 mb-6">'
desc_new = '<p className="project-notifications-description text-sm text-slate-600 dark:text-slate-400 mb-6">'

if "project-notifications-description" not in jsx:
    if desc_old not in jsx:
        raise RuntimeError("Could not find notification description paragraph. No changes written.")
    jsx = jsx.replace(desc_old, desc_new, 1)

# Notification row scope
row_old = 'className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/[0.04]"'
row_new = 'className="project-notification-row flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/[0.04]"'

if "project-notification-row" not in jsx:
    if row_old not in jsx:
        raise RuntimeError("Could not find notification preference rows. No changes written.")
    jsx = jsx.replace(row_old, row_new)

# Notification title scope
title_old = 'className="font-semibold text-slate-800 dark:text-white capitalize"'
title_new = 'className="project-notification-title font-semibold text-slate-800 dark:text-white capitalize"'

if "project-notification-title" not in jsx:
    if title_old not in jsx:
        raise RuntimeError("Could not find notification title class. No changes written.")
    jsx = jsx.replace(title_old, title_new)

# Notification subtitle scope
subtitle_old = 'className="text-sm text-slate-500 dark:text-slate-400"'
subtitle_new = 'className="project-notification-subtitle text-sm text-slate-500 dark:text-slate-400"'

if "project-notification-subtitle" not in jsx:
    if subtitle_old not in jsx:
        raise RuntimeError("Could not find notification subtitle class. No changes written.")
    jsx = jsx.replace(subtitle_old, subtitle_new)

# Save preferences button scope
save_old = 'className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"'
save_new = 'className="project-notification-save-btn w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"'

if "project-notification-save-btn" not in jsx:
    if save_old not in jsx:
        raise RuntimeError("Could not find Save Preferences button. No changes written.")
    jsx = jsx.replace(save_old, save_new, 1)

# Danger card scope
danger_old = '<div className="bg-error-500/10 border border-error-500/30 rounded-2xl p-6 shadow-xl">'
danger_new = '<div className="project-settings-card project-danger-card bg-error-500/10 border border-error-500/30 rounded-2xl p-6 shadow-xl">'

if "project-danger-card" not in jsx:
    if danger_old not in jsx:
        raise RuntimeError("Could not find Danger Zone card. No changes written.")
    jsx = jsx.replace(danger_old, danger_new, 1)

# Remove older block if present
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

css = remove_block(css, "PROJECT SETTINGS VISUAL STRIKE v1")

css_patch = r'''
/* =========================================================
   PROJECT SETTINGS VISUAL STRIKE v1
   Project Settings page + notification preferences readability.
   ========================================================= */

.project-settings-page {
  position: relative;
  isolation: isolate;
}

html.dark .project-settings-page,
html[data-theme="dark"] .project-settings-page,
body.dark .project-settings-page {
  background:
    radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.20), transparent 34%),
    radial-gradient(circle at 92% 18%, rgba(45, 212, 191, 0.13), transparent 36%),
    linear-gradient(135deg, #060913 0%, #09090b 48%, #07111c 100%) !important;
}

.project-settings-card {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.project-settings-card > * {
  position: relative;
  z-index: 1;
}

.project-settings-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0;
}

html.dark .project-settings-card,
html[data-theme="dark"] .project-settings-card,
body.dark .project-settings-card {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 36%),
    radial-gradient(circle at 96% 12%, rgba(59, 130, 246, 0.14), transparent 34%),
    linear-gradient(135deg, rgba(20, 24, 38, 0.96), rgba(9, 14, 26, 0.96)) !important;
  border-color: rgba(147, 197, 253, 0.22) !important;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(147, 197, 253, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

html.dark .project-settings-card::before,
html[data-theme="dark"] .project-settings-card::before,
body.dark .project-settings-card::before {
  opacity: 1;
  background:
    linear-gradient(120deg, rgba(139, 92, 246, 0.10), transparent 42%, rgba(45, 212, 191, 0.08));
}

html.dark .project-notifications-card,
html[data-theme="dark"] .project-notifications-card,
body.dark .project-notifications-card {
  border-color: rgba(96, 165, 250, 0.30) !important;
}

html.dark .project-notifications-card h2,
html.dark .project-information-card h2,
html.dark .project-danger-card h2,
html[data-theme="dark"] .project-notifications-card h2,
html[data-theme="dark"] .project-information-card h2,
html[data-theme="dark"] .project-danger-card h2,
body.dark .project-notifications-card h2,
body.dark .project-information-card h2,
body.dark .project-danger-card h2 {
  color: #ffffff !important;
  opacity: 1 !important;
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.12);
}

html.dark .project-notifications-description,
html[data-theme="dark"] .project-notifications-description,
body.dark .project-notifications-description {
  color: rgba(203, 213, 225, 0.92) !important;
  line-height: 1.7 !important;
}

/* Each notification row */
html.dark .project-notification-row,
html[data-theme="dark"] .project-notification-row,
body.dark .project-notification-row {
  background:
    radial-gradient(circle at 4% 0%, rgba(59, 130, 246, 0.14), transparent 42%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.88)) !important;
  border-color: rgba(148, 163, 184, 0.20) !important;
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

html.dark .project-notification-row:hover,
html[data-theme="dark"] .project-notification-row:hover,
body.dark .project-notification-row:hover {
  transform: translateY(-1px);
  border-color: rgba(96, 165, 250, 0.42) !important;
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.30),
    0 0 0 1px rgba(96, 165, 250, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

.project-notification-row {
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

html.dark .project-notification-title,
html[data-theme="dark"] .project-notification-title,
body.dark .project-notification-title {
  color: #f8fafc !important;
  opacity: 1 !important;
  font-weight: 800 !important;
}

html.dark .project-notification-subtitle,
html[data-theme="dark"] .project-notification-subtitle,
body.dark .project-notification-subtitle {
  color: rgba(203, 213, 225, 0.90) !important;
  opacity: 1 !important;
}

/* Toggle track improvements */
html.dark .project-notification-row label div:first-of-type,
html[data-theme="dark"] .project-notification-row label div:first-of-type,
body.dark .project-notification-row label div:first-of-type {
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.10) !important;
}

/* Save button */
.project-notification-save-btn {
  color: #ffffff !important;
}

html.dark .project-notification-save-btn,
html[data-theme="dark"] .project-notification-save-btn,
body.dark .project-notification-save-btn {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 46%, #7c3aed 100%) !important;
  color: #ffffff !important;
  border: 1px solid rgba(147, 197, 253, 0.42) !important;
  box-shadow:
    0 18px 42px rgba(59, 130, 246, 0.26),
    0 0 28px rgba(124, 58, 237, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.18) !important;
}

html.dark .project-notification-save-btn:hover,
html[data-theme="dark"] .project-notification-save-btn:hover,
body.dark .project-notification-save-btn:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

/* Inputs inside Project Information */
html.dark .project-information-card input,
html.dark .project-information-card textarea,
html[data-theme="dark"] .project-information-card input,
html[data-theme="dark"] .project-information-card textarea,
body.dark .project-information-card input,
body.dark .project-information-card textarea {
  background: rgba(15, 23, 42, 0.88) !important;
  border-color: rgba(148, 163, 184, 0.20) !important;
  color: #f8fafc !important;
}

html.dark .project-information-card label,
html[data-theme="dark"] .project-information-card label,
body.dark .project-information-card label {
  color: rgba(226, 232, 240, 0.92) !important;
  font-weight: 700 !important;
}

/* Danger card */
html.dark .project-danger-card,
html[data-theme="dark"] .project-danger-card,
body.dark .project-danger-card {
  background:
    radial-gradient(circle at 8% 0%, rgba(239, 68, 68, 0.16), transparent 38%),
    linear-gradient(135deg, rgba(30, 14, 20, 0.94), rgba(9, 14, 26, 0.96)) !important;
  border-color: rgba(248, 113, 113, 0.30) !important;
}

/* END PROJECT SETTINGS VISUAL STRIKE v1 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

for bad in ["onClick={() =", "className={}"]:
    if bad in jsx and bad not in jsx_original:
        jsx_path.write_text(jsx_original)
        css_path.write_text(css_original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

required_jsx = [
    "project-settings-page",
    "project-notifications-card",
    "project-notification-row",
    "project-notification-title",
    "project-notification-subtitle",
    "project-notification-save-btn",
]

missing = [token for token in required_jsx if token not in jsx]
if missing:
    jsx_path.write_text(jsx_original)
    css_path.write_text(css_original)
    raise RuntimeError(f"Patch incomplete. Missing {missing}. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("ProjectSettings visual patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added scoped ProjectSettings classes")
print("- Made Your Notification Preferences text more apparent")
print("- Added dark-mode visual styling for notification rows")
print("- Added visual polish to Project Information and Danger Zone cards")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No settings save, upload, notification, or leave-project logic changed.")
