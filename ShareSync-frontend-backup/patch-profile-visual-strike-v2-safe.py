from pathlib import Path
from datetime import datetime

jsx_path = Path("src/pages/Profile.jsx")
css_path = Path("src/pages/Profile.css")

jsx = jsx_path.read_text()
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-profile-visual-strike-v2-safe-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-profile-visual-strike-v2-safe-{stamp}")

jsx_backup.write_text(jsx)
css_backup.write_text(css)

# IMPORTANT:
# Do NOT reject "onClick={() => ...}".
# That is valid JSX. Previous scripts falsely treated normal arrow handlers as corruption.

# 1) Ensure Profile.css is imported
css_import = 'import "./Profile.css";'
if css_import not in jsx:
    anchor = 'import { useAnalytics } from "../contexts/AnalyticsContext";'
    if anchor not in jsx:
        raise RuntimeError("Could not find Profile.css import anchor. No changes were written.")
    jsx = jsx.replace(anchor, anchor + "\n" + css_import, 1)

# 2) Root profile shell
old = 'className="min-h-screen p-6 lg:p-12 max-w-[1400px] mx-auto"'
new = 'className="profile-visual-shell min-h-screen p-6 lg:p-12 max-w-[1400px] mx-auto"'
if "profile-visual-shell" not in jsx:
    if old not in jsx:
        raise RuntimeError("Could not find Profile root wrapper. No changes were written.")
    jsx = jsx.replace(old, new, 1)

# 3) Header / identity card
old = '<section className="flex flex-col items-center mb-16">'
new = '<section className="profile-identity-hero flex flex-col items-center mb-16">'
if "profile-identity-hero" not in jsx:
    if old not in jsx:
        raise RuntimeError("Could not find Profile header section. No changes were written.")
    jsx = jsx.replace(old, new, 1)

old = '<div className="text-center mt-8">'
new = '<div className="profile-identity-copy text-center mt-8">'
if "profile-identity-copy" not in jsx:
    jsx = jsx.replace(old, new, 1)

old = '<h1 className="text-4xl font-semibold text-slate-800 dark:text-white mb-3">'
new = '<h1 className="profile-display-name text-4xl font-semibold text-slate-800 dark:text-white mb-3">'
if "profile-display-name" not in jsx:
    jsx = jsx.replace(old, new, 1)

old = '<div className="flex items-center justify-center gap-3 flex-wrap">'
new = '<div className="profile-identity-badges flex items-center justify-center gap-3 flex-wrap">'
if "profile-identity-badges" not in jsx:
    jsx = jsx.replace(old, new, 1)

old = 'className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/20 hover:shadow-lg"'
new = 'className="profile-edit-button mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/20 hover:shadow-lg"'
if "profile-edit-button" not in jsx:
    jsx = jsx.replace(old, new, 1)

# 4) Avatar polish hooks
old = 'className="relative flex flex-col items-center"'
new = 'className="profile-avatar-editor relative flex flex-col items-center"'
if "profile-avatar-editor" not in jsx:
    jsx = jsx.replace(old, new, 1)

old = 'className="absolute inset-0 rounded-full p-1"'
new = 'className="profile-avatar-ring absolute inset-0 rounded-full p-1"'
if "profile-avatar-ring" not in jsx:
    jsx = jsx.replace(old, new, 1)

old = 'className="absolute inset-2 rounded-full overflow-hidden border-4 border-white dark:border-[#111113] bg-slate-100 dark:bg-zinc-800 shadow-lg shadow-violet-100 dark:shadow-violet-900/20"'
new = 'className="profile-avatar-frame absolute inset-2 rounded-full overflow-hidden border-4 border-white dark:border-[#111113] bg-slate-100 dark:bg-zinc-800 shadow-lg shadow-violet-100 dark:shadow-violet-900/20"'
if "profile-avatar-frame" not in jsx:
    jsx = jsx.replace(old, new, 1)

old = 'className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg shadow-md"'
new = 'className="profile-rank-badge absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg shadow-md"'
if "profile-rank-badge" not in jsx:
    jsx = jsx.replace(old, new, 1)

# 5) Mini stat cards
old = 'className="p-5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 hover:border-violet-200 dark:hover:border-violet-500/30 transition-all duration-200"'
new = 'className="profile-mini-stat-card p-5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 hover:border-violet-200 dark:hover:border-violet-500/30 transition-all duration-200"'
if "profile-mini-stat-card" not in jsx:
    jsx = jsx.replace(old, new, 1)

css_patch = r'''

/* ═══════════════════════════════════════════════════════════════════════════════
   PROFILE PAGE VISUAL STRIKE v2 SAFE
   Scope: src/pages/Profile.jsx only
   No backend/API/profile logic changes.
   ═══════════════════════════════════════════════════════════════════════════════ */

.profile-visual-shell {
  position: relative;
  isolation: isolate;
}

.profile-visual-shell::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -2;
  background:
    radial-gradient(circle at 18% 10%, rgba(139, 92, 246, 0.15), transparent 30%),
    radial-gradient(circle at 82% 16%, rgba(34, 211, 238, 0.13), transparent 34%),
    radial-gradient(circle at 78% 88%, rgba(236, 72, 153, 0.08), transparent 28%),
    linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(238, 242, 255, 0.92));
}

.profile-visual-shell::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  opacity: 0.45;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 44px 44px;
}

.profile-identity-hero {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.88);
  border-radius: 36px;
  padding: 3rem 2rem 2.5rem;
  background:
    radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.56) 35%, transparent 58%),
    radial-gradient(circle at 14% 22%, rgba(139, 92, 246, 0.14), transparent 34%),
    radial-gradient(circle at 88% 18%, rgba(34, 211, 238, 0.14), transparent 36%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.84), rgba(226, 232, 240, 0.54));
  box-shadow:
    0 28px 80px rgba(15, 23, 42, 0.075),
    0 12px 34px rgba(139, 92, 246, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.90);
}

.profile-identity-hero::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: linear-gradient(90deg, #8b5cf6, #22d3ee, #10b981);
}

.profile-identity-hero::after {
  content: "";
  position: absolute;
  right: -5rem;
  top: -7rem;
  width: 24rem;
  height: 24rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.14), transparent 66%);
  filter: blur(2px);
}

.profile-avatar-editor,
.profile-identity-copy {
  position: relative;
  z-index: 1;
}

.profile-avatar-ring {
  box-shadow:
    0 0 0 8px rgba(255, 255, 255, 0.82),
    0 22px 55px rgba(139, 92, 246, 0.26),
    0 0 42px rgba(34, 211, 238, 0.22);
}

.profile-avatar-frame {
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.90) !important;
}

.profile-rank-badge {
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow:
    0 14px 28px rgba(109, 40, 217, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
}

.profile-display-name {
  font-size: clamp(2.25rem, 3.8vw, 3.6rem) !important;
  line-height: 1 !important;
  letter-spacing: -0.052em;
  font-weight: 950 !important;
  background: linear-gradient(135deg, #0f172a 0%, #4c1d95 48%, #0891b2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;
  text-shadow: 0 18px 42px rgba(139, 92, 246, 0.12);
}

.profile-identity-badges > span {
  box-shadow:
    0 10px 22px rgba(15, 23, 42, 0.055),
    inset 0 1px 0 rgba(255, 255, 255, 0.26);
}

.profile-edit-button {
  border-radius: 999px !important;
  padding-inline: 1.25rem !important;
  font-weight: 850 !important;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 52%, #2563eb 100%) !important;
  box-shadow:
    0 18px 36px rgba(124, 58, 237, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
}

.profile-edit-button:hover {
  transform: translateY(-2px);
  box-shadow:
    0 24px 52px rgba(124, 58, 237, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.40) !important;
}

/* Main profile content cards without adding risky JSX hooks everywhere */
.profile-visual-shell > .grid > div > div[class*="rounded-xl"][class*="bg-white"],
.profile-visual-shell .profile-mini-stat-card {
  position: relative;
  overflow: hidden;
  border-radius: 26px !important;
  background:
    radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.055), transparent 38%),
    radial-gradient(circle at 100% 100%, rgba(34, 211, 238, 0.050), transparent 38%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.88)) !important;
  box-shadow:
    0 20px 48px rgba(15, 23, 42, 0.058),
    0 10px 32px rgba(139, 92, 246, 0.070),
    inset 0 1px 0 rgba(255, 255, 255, 0.88) !important;
}

.profile-visual-shell > .grid > div > div[class*="rounded-xl"][class*="bg-white"]::before,
.profile-visual-shell .profile-mini-stat-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  opacity: 0.72;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.86), rgba(34, 211, 238, 0.70), rgba(16, 185, 129, 0.62));
}

.profile-visual-shell > .grid > div > div[class*="rounded-xl"][class*="bg-white"]:hover,
.profile-visual-shell .profile-mini-stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(167, 139, 250, 0.52) !important;
  box-shadow:
    0 26px 60px rgba(15, 23, 42, 0.075),
    0 14px 38px rgba(139, 92, 246, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.92) !important;
}

html.dark .profile-visual-shell::before,
html[data-theme="dark"] .profile-visual-shell::before,
body.dark .profile-visual-shell::before {
  background:
    radial-gradient(circle at 18% 10%, rgba(139, 92, 246, 0.18), transparent 30%),
    radial-gradient(circle at 82% 16%, rgba(34, 211, 238, 0.13), transparent 34%),
    linear-gradient(180deg, rgba(5, 7, 12, 0.98), rgba(10, 15, 26, 0.98));
}

html.dark .profile-identity-hero,
html[data-theme="dark"] .profile-identity-hero,
body.dark .profile-identity-hero {
  border-color: rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at 50% 12%, rgba(255, 255, 255, 0.08), transparent 52%),
    radial-gradient(circle at 14% 22%, rgba(139, 92, 246, 0.20), transparent 34%),
    radial-gradient(circle at 88% 18%, rgba(34, 211, 238, 0.14), transparent 36%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(8, 13, 24, 0.88));
}

html.dark .profile-display-name,
html[data-theme="dark"] .profile-display-name,
body.dark .profile-display-name {
  background: linear-gradient(135deg, #ffffff 0%, #c4b5fd 48%, #67e8f9 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

@media (max-width: 768px) {
  .profile-identity-hero {
    padding: 2.25rem 1.25rem 2rem;
    border-radius: 28px;
  }

  .profile-display-name {
    font-size: clamp(2rem, 10vw, 3rem) !important;
  }
}
'''

if "PROFILE PAGE VISUAL STRIKE v2 SAFE" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Profile page visual strike v2 safe patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Ensured Profile.css is imported")
print("- Added safe scoped visual class hooks")
print("- Added scoped Profile visual CSS")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No profile loading, editing, upload, analytics, or growth logic changed.")
