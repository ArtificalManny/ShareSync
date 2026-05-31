from pathlib import Path
from datetime import datetime
import re

jsx_path = Path("src/pages/Profile.jsx")
css_path = Path("src/pages/Profile.css")

jsx = jsx_path.read_text()
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-profile-visual-strike-v3-root-scoped-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-profile-visual-strike-v3-root-scoped-{stamp}")

jsx_backup.write_text(jsx)
css_backup.write_text(css)

# 1) Ensure Profile.css is imported.
if 'import "./Profile.css";' not in jsx and "import './Profile.css';" not in jsx:
    lines = jsx.splitlines()
    import_indexes = [i for i, line in enumerate(lines) if line.strip().startswith("import ")]
    if not import_indexes:
        raise RuntimeError("Could not find any import lines in Profile.jsx. No changes were written.")
    lines.insert(import_indexes[-1] + 1, 'import "./Profile.css";')
    jsx = "\n".join(lines) + "\n"

# 2) Add ONE safe root class to the main Profile page wrapper.
# This avoids fragile matching for the hero/header section.
if "profile-visual-shell" not in jsx:
    pattern = r'className="(?=[^"]*\bmin-h-screen\b)(?=[^"]*\bmx-auto\b)([^"]*)"'

    def add_root_class(match):
        existing = match.group(1)
        return f'className="profile-visual-shell {existing}"'

    jsx, count = re.subn(pattern, add_root_class, jsx, count=1)

    if count != 1:
        raise RuntimeError(
            "Could not find Profile root wrapper with min-h-screen + mx-auto. "
            "No changes were written."
        )

css_patch = r'''

/* ═══════════════════════════════════════════════════════════════════════════════
   PROFILE PAGE VISUAL STRIKE v3 ROOT-SCOPED
   Scope: Only elements inside .profile-visual-shell
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
  opacity: 0.44;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 44px 44px;
}

/* Top identity card: first section inside the profile page */
.profile-visual-shell > section:first-of-type {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.9) !important;
  border-radius: 36px !important;
  background:
    radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.58) 35%, transparent 60%),
    radial-gradient(circle at 14% 22%, rgba(139, 92, 246, 0.14), transparent 34%),
    radial-gradient(circle at 88% 18%, rgba(34, 211, 238, 0.14), transparent 36%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.86), rgba(226, 232, 240, 0.56)) !important;
  box-shadow:
    0 28px 80px rgba(15, 23, 42, 0.075),
    0 12px 34px rgba(139, 92, 246, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
}

.profile-visual-shell > section:first-of-type::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: linear-gradient(90deg, #8b5cf6, #22d3ee, #10b981);
}

.profile-visual-shell > section:first-of-type::after {
  content: "";
  position: absolute;
  right: -5rem;
  top: -7rem;
  width: 24rem;
  height: 24rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.14), transparent 66%);
  filter: blur(2px);
  pointer-events: none;
}

/* Keep hero content above the glow layers */
.profile-visual-shell > section:first-of-type > * {
  position: relative;
  z-index: 1;
}

/* Profile name */
.profile-visual-shell > section:first-of-type h1 {
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

/* Edit Profile button */
.profile-visual-shell > section:first-of-type button {
  border-radius: 999px;
}

.profile-visual-shell > section:first-of-type button[class*="text-white"] {
  font-weight: 850 !important;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 52%, #2563eb 100%) !important;
  box-shadow:
    0 18px 36px rgba(124, 58, 237, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
}

.profile-visual-shell > section:first-of-type button[class*="text-white"]:hover {
  transform: translateY(-2px);
  box-shadow:
    0 24px 52px rgba(124, 58, 237, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.40) !important;
}

/* Main dashboard cards */
.profile-visual-shell :where(
  .profile-card,
  .badge-tile,
  [class*="rounded-xl"][class*="border"][class*="bg-white"],
  [class*="rounded-2xl"][class*="border"][class*="bg-white"]
) {
  position: relative;
  overflow: hidden;
  box-shadow:
    0 20px 48px rgba(15, 23, 42, 0.058),
    0 10px 32px rgba(139, 92, 246, 0.070),
    inset 0 1px 0 rgba(255, 255, 255, 0.88) !important;
}

.profile-visual-shell :where(
  .profile-card,
  [class*="rounded-xl"][class*="border"][class*="bg-white"],
  [class*="rounded-2xl"][class*="border"][class*="bg-white"]
)::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  opacity: 0.72;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.86), rgba(34, 211, 238, 0.70), rgba(16, 185, 129, 0.62));
}

.profile-visual-shell :where(
  .profile-card,
  [class*="rounded-xl"][class*="border"][class*="bg-white"],
  [class*="rounded-2xl"][class*="border"][class*="bg-white"]
):hover {
  transform: translateY(-2px);
  border-color: rgba(167, 139, 250, 0.52) !important;
}

/* Dark mode */
html.dark .profile-visual-shell::before,
html[data-theme="dark"] .profile-visual-shell::before,
body.dark .profile-visual-shell::before {
  background:
    radial-gradient(circle at 18% 10%, rgba(139, 92, 246, 0.18), transparent 30%),
    radial-gradient(circle at 82% 16%, rgba(34, 211, 238, 0.13), transparent 34%),
    linear-gradient(180deg, rgba(5, 7, 12, 0.98), rgba(10, 15, 26, 0.98));
}

html.dark .profile-visual-shell > section:first-of-type,
html[data-theme="dark"] .profile-visual-shell > section:first-of-type,
body.dark .profile-visual-shell > section:first-of-type {
  border-color: rgba(255, 255, 255, 0.08) !important;
  background:
    radial-gradient(circle at 50% 12%, rgba(255, 255, 255, 0.08), transparent 52%),
    radial-gradient(circle at 14% 22%, rgba(139, 92, 246, 0.20), transparent 34%),
    radial-gradient(circle at 88% 18%, rgba(34, 211, 238, 0.14), transparent 36%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(8, 13, 24, 0.88)) !important;
}

html.dark .profile-visual-shell > section:first-of-type h1,
html[data-theme="dark"] .profile-visual-shell > section:first-of-type h1,
body.dark .profile-visual-shell > section:first-of-type h1 {
  background: linear-gradient(135deg, #ffffff 0%, #c4b5fd 48%, #67e8f9 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

@media (max-width: 768px) {
  .profile-visual-shell > section:first-of-type {
    border-radius: 28px !important;
  }

  .profile-visual-shell > section:first-of-type h1 {
    font-size: clamp(2rem, 10vw, 3rem) !important;
  }
}
'''

if "PROFILE PAGE VISUAL STRIKE v3 ROOT-SCOPED" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Profile page visual strike v3 root-scoped patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Ensured Profile.css is imported")
print("- Added one root class to Profile.jsx")
print("- Added root-scoped visual CSS to Profile.css")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No profile loading, editing, upload, analytics, or growth logic changed.")
