from pathlib import Path
from datetime import datetime

css_path = Path("src/pages/Profile.css")
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = css_path.with_suffix(css_path.suffix + f".backup-profile-buttons-final-v11-{stamp}")
backup.write_text(css)

patch = r'''

/* ═══════════════════════════════════════════════════════════════════════
   PROFILE BUTTON FINAL v11
   Purpose:
   - Force the visible hero Edit Profile button to become a real purple pill
   - Force modal Save Changes button to remain readable
   - Scoped only to Profile page / Profile modal patterns
   ═══════════════════════════════════════════════════════════════════════ */

/* HERO EDIT PROFILE BUTTON — hard reset then rebuild */
.profile-visual-shell .profile-hero-surface .profile-hero-copy > button,
.profile-visual-shell .profile-hero-surface button.profile-hero-cta,
.profile-visual-shell .profile-hero-surface button[data-profile-action="edit-profile"] {
  all: unset !important;
  box-sizing: border-box !important;

  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.55rem !important;

  min-width: 150px !important;
  min-height: 46px !important;
  margin-top: 1.5rem !important;
  padding: 0.78rem 1.65rem !important;

  border-radius: 999px !important;
  border: 1px solid rgba(221, 214, 254, 0.98) !important;

  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 48%, #6d28d9 100%) !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;

  font-size: 0.95rem !important;
  font-weight: 900 !important;
  line-height: 1 !important;
  letter-spacing: -0.01em !important;
  text-align: center !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.36) !important;

  opacity: 1 !important;
  visibility: visible !important;
  cursor: pointer !important;

  box-shadow:
    0 18px 42px rgba(124, 58, 237, 0.42),
    0 0 0 5px rgba(139, 92, 246, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;

  filter: none !important;
  mix-blend-mode: normal !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.profile-visual-shell .profile-hero-surface .profile-hero-copy > button *,
.profile-visual-shell .profile-hero-surface button.profile-hero-cta *,
.profile-visual-shell .profile-hero-surface button[data-profile-action="edit-profile"] *,
.profile-visual-shell .profile-hero-surface .profile-hero-copy > button svg {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

.profile-visual-shell .profile-hero-surface .profile-hero-copy > button:hover,
.profile-visual-shell .profile-hero-surface button.profile-hero-cta:hover,
.profile-visual-shell .profile-hero-surface button[data-profile-action="edit-profile"]:hover {
  transform: translateY(-2px) !important;
  background: linear-gradient(135deg, #c084fc 0%, #8b5cf6 45%, #7c3aed 100%) !important;
  box-shadow:
    0 24px 54px rgba(124, 58, 237, 0.52),
    0 0 0 6px rgba(139, 92, 246, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.46) !important;
}

/* MODAL SAVE CHANGES BUTTON — readable even when disabled */
.profile-visual-shell button[data-profile-action="save-profile"],
button[data-profile-action="save-profile"] {
  background: linear-gradient(135deg, #9333ea 0%, #7c3aed 48%, #6d28d9 100%) !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  border: 1px solid rgba(221, 214, 254, 0.95) !important;
  border-radius: 999px !important;
  font-weight: 900 !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.36) !important;
  box-shadow:
    0 16px 34px rgba(124, 58, 237, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
}

.profile-visual-shell button[data-profile-action="save-profile"] *,
button[data-profile-action="save-profile"] *,
button[data-profile-action="save-profile"] svg {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;
}

/* Disabled Save Changes: visible, but still clearly disabled */
.profile-visual-shell button[data-profile-action="save-profile"]:disabled,
button[data-profile-action="save-profile"]:disabled {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 48%, #7c3aed 100%) !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 0.78 !important;
  cursor: not-allowed !important;
  filter: grayscale(0.08) !important;
}

/* Fallback: if data attribute did not land, target the modal footer's submit-looking last button */
.profile-visual-shell [role="dialog"] button:last-child,
.profile-visual-shell .profile-edit-modal button:last-child {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 0.82 !important;
}
'''

if "PROFILE BUTTON FINAL v11" not in css:
    css = css.rstrip() + "\n" + patch + "\n"

css_path.write_text(css)

print("Profile button final v11 CSS patch applied successfully.")
print(f"Updated file: {css_path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Profile.css")
print("- Hard-reset/rebuilt the visible hero Edit Profile button")
print("- Reinforced Save Changes button readability")
print("")
print("No JSX touched.")
print("No backend files touched.")
print("No API calls changed.")
