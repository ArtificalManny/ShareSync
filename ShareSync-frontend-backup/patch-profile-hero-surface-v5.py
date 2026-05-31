from pathlib import Path
from datetime import datetime
import re

jsx_path = Path("src/pages/Profile.jsx")
css_path = Path("src/pages/Profile.css")

jsx = jsx_path.read_text()
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-profile-hero-surface-v5-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-profile-hero-surface-v5-{stamp}")

jsx_backup.write_text(jsx)
css_backup.write_text(css)

# 1) Ensure Profile.css is imported.
if 'import "./Profile.css";' not in jsx and "import './Profile.css';" not in jsx:
    lines = jsx.splitlines()
    import_indexes = [i for i, line in enumerate(lines) if line.strip().startswith("import ")]
    if not import_indexes:
        raise RuntimeError("Could not find import section in Profile.jsx. No changes were written.")
    lines.insert(import_indexes[-1] + 1, 'import "./Profile.css";')
    jsx = "\n".join(lines) + "\n"

# 2) Add a root visual scope class to the page wrapper.
if "profile-visual-shell" not in jsx:
    exact_root = 'className="min-h-screen p-6 lg:p-12 max-w-[1400px] mx-auto"'
    exact_root_new = 'className="profile-visual-shell min-h-screen p-6 lg:p-12 max-w-[1400px] mx-auto"'
    if exact_root in jsx:
        jsx = jsx.replace(exact_root, exact_root_new, 1)
    else:
        pattern = r'className="(?=[^"]*\bmin-h-screen\b)(?=[^"]*\bmx-auto\b)([^"]*)"'
        jsx, count = re.subn(pattern, lambda m: f'className="profile-visual-shell {m.group(1)}"', jsx, count=1)
        if count != 1:
            raise RuntimeError("Could not find Profile root wrapper. No changes were written.")

# 3) Style the EXISTING header section, do not add another wrapper.
if "profile-hero-surface" not in jsx:
    exact_section = '<section className="flex flex-col items-center mb-16">'
    exact_section_new = '<section className="profile-hero-surface flex flex-col items-center mb-16">'
    if exact_section in jsx:
        jsx = jsx.replace(exact_section, exact_section_new, 1)
    else:
        pattern = r'(<section\s+className=")([^"]*\bflex\b[^"]*\bflex-col\b[^"]*\bitems-center\b[^"]*\bmb-16\b[^"]*)(">)'
        jsx, count = re.subn(pattern, lambda m: f'{m.group(1)}profile-hero-surface {m.group(2)}{m.group(3)}', jsx, count=1)
        if count != 1:
            raise RuntimeError("Could not find Profile header section. No changes were written.")

# 4) Add small class hooks to the existing name / badge row / bio / edit button.
if "profile-hero-name" not in jsx:
    old = '<h1 className="text-4xl font-semibold text-slate-800 dark:text-white mb-3">'
    new = '<h1 className="profile-hero-name text-4xl font-semibold text-slate-800 dark:text-white mb-3">'
    if old not in jsx:
        raise RuntimeError("Could not find profile h1. No changes were written.")
    jsx = jsx.replace(old, new, 1)

if "profile-hero-meta" not in jsx:
    old = '<div className="flex items-center justify-center gap-3 flex-wrap">'
    new = '<div className="profile-hero-meta flex items-center justify-center gap-3 flex-wrap">'
    if old not in jsx:
        raise RuntimeError("Could not find profile badge/meta row. No changes were written.")
    jsx = jsx.replace(old, new, 1)

if "profile-hero-bio" not in jsx:
    old = '<p className="mt-6 text-slate-600 dark:text-zinc-300 max-w-lg mx-auto leading-relaxed">{user.bio}</p>'
    new = '<p className="profile-hero-bio mt-6 text-slate-600 dark:text-zinc-300 max-w-lg mx-auto leading-relaxed">{user.bio}</p>'
    if old in jsx:
        jsx = jsx.replace(old, new, 1)

if "profile-hero-cta" not in jsx:
    old = 'className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/20 hover:shadow-lg"'
    new = 'className="profile-hero-cta mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/20 hover:shadow-lg"'
    if old not in jsx:
        raise RuntimeError("Could not find Edit Profile button class. No changes were written.")
    jsx = jsx.replace(old, new, 1)

css_patch = r'''

/* ═══════════════════════════════════════════════════════════════════════
   PROFILE HERO SURFACE v5
   Purpose:
   - Improve the silver identity card behind name / badges
   - Avoid nested matryoshka wrappers
   - Style only the existing Profile header section
   ═══════════════════════════════════════════════════════════════════════ */

.profile-visual-shell {
  position: relative;
  isolation: isolate;
}

/* Keep the page calm behind the hero */
.profile-visual-shell::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -2;
  background:
    radial-gradient(circle at 18% 14%, rgba(139, 92, 246, 0.12), transparent 30%),
    radial-gradient(circle at 82% 20%, rgba(34, 211, 238, 0.11), transparent 34%),
    radial-gradient(circle at 80% 90%, rgba(236, 72, 153, 0.07), transparent 28%);
}

/* The actual premium silver identity panel */
.profile-visual-shell > .profile-hero-surface:first-of-type,
.profile-hero-surface.profile-hero-surface {
  width: min(100%, 980px) !important;
  margin-inline: auto !important;
  margin-bottom: 4rem !important;
  padding: 3.35rem 2rem 2.9rem !important;
  position: relative !important;
  overflow: hidden !important;
  border-radius: 2.1rem !important;
  border: 1px solid rgba(255, 255, 255, 0.68) !important;
  background:
    radial-gradient(circle at 50% 12%, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.28) 32%, transparent 55%),
    radial-gradient(circle at 16% 20%, rgba(139, 92, 246, 0.16), transparent 34%),
    radial-gradient(circle at 84% 78%, rgba(45, 212, 191, 0.14), transparent 32%),
    linear-gradient(135deg, #c5cbd5 0%, #e7e9ef 38%, #f9fafb 54%, #d7dde7 100%) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.75),
    inset 0 -1px 0 rgba(255, 255, 255, 0.22),
    0 26px 70px rgba(15, 23, 42, 0.115),
    0 12px 32px rgba(139, 92, 246, 0.10) !important;
  backdrop-filter: blur(10px) saturate(1.08);
  -webkit-backdrop-filter: blur(10px) saturate(1.08);
}

/* Re-enable premium top line even if an older cleanup patch disabled pseudo-elements */
.profile-visual-shell > .profile-hero-surface:first-of-type::before,
.profile-hero-surface.profile-hero-surface::before {
  content: "" !important;
  display: block !important;
  position: absolute !important;
  inset: 0 0 auto 0 !important;
  height: 4px !important;
  background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 32%, #67e8f9 68%, #14b8a6 100%) !important;
  opacity: 0.95 !important;
  z-index: 0 !important;
}

/* Soft interior light, not another card */
.profile-visual-shell > .profile-hero-surface:first-of-type::after,
.profile-hero-surface.profile-hero-surface::after {
  content: "" !important;
  display: block !important;
  position: absolute !important;
  inset: 0 !important;
  pointer-events: none !important;
  background:
    radial-gradient(circle at 50% 16%, rgba(255, 255, 255, 0.36), transparent 36%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.10), transparent 22%, transparent 78%, rgba(255, 255, 255, 0.16)) !important;
  opacity: 0.95 !important;
  z-index: 0 !important;
}

.profile-hero-surface > * {
  position: relative;
  z-index: 1;
}

/* Better hierarchy: name is premium but not oversized */
.profile-visual-shell .profile-hero-surface .profile-hero-name {
  font-size: clamp(2.05rem, 3vw, 3rem) !important;
  line-height: 1.04 !important;
  letter-spacing: -0.045em !important;
  font-weight: 900 !important;
  margin-top: 0.15rem !important;
  margin-bottom: 0.65rem !important;
  background: linear-gradient(135deg, #111827 0%, #4c1d95 52%, #0891b2 100%) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.34);
}

/* Badge row spacing and readable chips */
.profile-visual-shell .profile-hero-surface .profile-hero-meta {
  gap: 0.6rem 0.75rem !important;
  margin-top: 0.2rem !important;
  margin-bottom: 1rem !important;
}

.profile-visual-shell .profile-hero-surface .profile-hero-meta > * {
  position: relative;
  z-index: 1;
}

.profile-visual-shell .profile-hero-surface .profile-hero-meta span {
  box-shadow:
    0 8px 18px rgba(15, 23, 42, 0.055),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.profile-visual-shell .profile-hero-surface .profile-hero-bio {
  margin-top: 1.2rem !important;
  color: #475569 !important;
  font-size: 1rem !important;
  line-height: 1.65 !important;
}

/* Edit Profile button becomes readable and premium */
.profile-visual-shell .profile-hero-surface .profile-hero-cta {
  border-radius: 999px !important;
  padding: 0.65rem 1.25rem !important;
  font-weight: 850 !important;
  color: #ffffff !important;
  opacity: 1 !important;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 52%, #2563eb 100%) !important;
  box-shadow:
    0 16px 34px rgba(124, 58, 237, 0.30),
    inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.25) !important;
}

.profile-visual-shell .profile-hero-surface .profile-hero-cta *,
.profile-visual-shell .profile-hero-surface .profile-hero-cta svg {
  color: #ffffff !important;
  opacity: 1 !important;
}

.profile-visual-shell .profile-hero-surface .profile-hero-cta:hover {
  transform: translateY(-2px);
  box-shadow:
    0 22px 46px rgba(124, 58, 237, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;
}

/* Dark mode variant */
html.dark .profile-visual-shell > .profile-hero-surface:first-of-type,
html[data-theme="dark"] .profile-visual-shell > .profile-hero-surface:first-of-type,
body.dark .profile-visual-shell > .profile-hero-surface:first-of-type {
  border-color: rgba(255, 255, 255, 0.10) !important;
  background:
    radial-gradient(circle at 50% 12%, rgba(255, 255, 255, 0.10), transparent 42%),
    radial-gradient(circle at 16% 20%, rgba(139, 92, 246, 0.22), transparent 34%),
    radial-gradient(circle at 84% 78%, rgba(45, 212, 191, 0.14), transparent 32%),
    linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.94)) !important;
}

html.dark .profile-visual-shell .profile-hero-surface .profile-hero-name,
html[data-theme="dark"] .profile-visual-shell .profile-hero-surface .profile-hero-name,
body.dark .profile-visual-shell .profile-hero-surface .profile-hero-name {
  background: linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #67e8f9 100%) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
}

html.dark .profile-visual-shell .profile-hero-surface .profile-hero-bio,
html[data-theme="dark"] .profile-visual-shell .profile-hero-surface .profile-hero-bio,
body.dark .profile-visual-shell .profile-hero-surface .profile-hero-bio {
  color: rgba(226, 232, 240, 0.84) !important;
}

@media (max-width: 768px) {
  .profile-visual-shell > .profile-hero-surface:first-of-type,
  .profile-hero-surface.profile-hero-surface {
    width: 100% !important;
    border-radius: 1.55rem !important;
    padding: 2.55rem 1.25rem 2.25rem !important;
  }

  .profile-visual-shell .profile-hero-surface .profile-hero-name {
    font-size: clamp(1.9rem, 8vw, 2.65rem) !important;
  }
}
'''

if "PROFILE HERO SURFACE v5" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Profile hero surface v5 patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Profile.css import if missing")
print("- One root Profile visual scope class")
print("- Existing header section class")
print("- Existing name/meta/bio/edit-button class hooks")
print("- Root-scoped Profile hero CSS")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No profile loading, editing, upload, analytics, or growth logic changed.")
