from pathlib import Path
from datetime import datetime

css_path = Path("src/pages/Profile.css")
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = css_path.with_suffix(css_path.suffix + f".backup-profile-edit-button-purple-v8-{stamp}")
backup.write_text(css)

patch = r'''

/* ═══════════════════════════════════════════════════════════════════════
   PROFILE EDIT BUTTON PURPLE v8
   Fixes the faint/washed-out Edit Profile button inside the profile hero.
   CSS-only. No JSX / logic changes.
   ═══════════════════════════════════════════════════════════════════════ */

.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type button.profile-hero-cta,
.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type .profile-hero-cta,
.profile-hero-surface button.profile-hero-cta {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.5rem !important;

  min-height: 44px !important;
  padding: 0.72rem 1.45rem !important;
  border-radius: 999px !important;

  border: 1px solid rgba(221, 214, 254, 0.95) !important;
  background: linear-gradient(135deg, #9333ea 0%, #7c3aed 48%, #6d28d9 100%) !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;

  font-weight: 900 !important;
  letter-spacing: -0.01em !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.32) !important;

  box-shadow:
    0 18px 38px rgba(124, 58, 237, 0.38),
    0 0 0 5px rgba(139, 92, 246, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;

  filter: none !important;
  mix-blend-mode: normal !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type button.profile-hero-cta *,
.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type .profile-hero-cta *,
.profile-hero-surface button.profile-hero-cta *,
.profile-hero-surface button.profile-hero-cta svg {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type button.profile-hero-cta:hover,
.profile-hero-surface button.profile-hero-cta:hover {
  transform: translateY(-2px) !important;
  background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 45%, #7c3aed 100%) !important;
  box-shadow:
    0 24px 52px rgba(124, 58, 237, 0.48),
    0 0 0 6px rgba(139, 92, 246, 0.13),
    inset 0 1px 0 rgba(255, 255, 255, 0.40) !important;
}
'''

if "PROFILE EDIT BUTTON PURPLE v8" not in css:
    css = css.rstrip() + "\n" + patch + "\n"

css_path.write_text(css)

print("Profile Edit Profile button purple v8 patch applied successfully.")
print(f"Updated file: {css_path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Profile.css")
print("- Made Edit Profile button solid purple and readable")
print("")
print("No JSX touched.")
print("No backend files touched.")
print("No API calls changed.")
