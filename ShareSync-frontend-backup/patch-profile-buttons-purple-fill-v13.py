from pathlib import Path
from datetime import datetime

css_path = Path("src/pages/Profile.css")
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = css_path.with_suffix(css_path.suffix + f".backup-profile-buttons-purple-fill-v13-{stamp}")
backup.write_text(css)

patch = r'''

/* ═══════════════════════════════════════════════════════════════════════
   PROFILE BUTTON PURPLE FILL v13
   Final fill fix:
   - Earlier patches reached the button border
   - This forces the button interior purple using background + inset fill
   - CSS-only
   ═══════════════════════════════════════════════════════════════════════ */

html body button[data-profile-action="edit-profile"],
html body .profile-visual-shell button[data-profile-action="edit-profile"],
html body .profile-hero-surface button[data-profile-action="edit-profile"],
html body button[data-profile-action="save-profile"],
html body .profile-visual-shell button[data-profile-action="save-profile"] {
  appearance: none !important;
  -webkit-appearance: none !important;

  background-color: #7c3aed !important;
  background-image: linear-gradient(135deg, #a855f7 0%, #7c3aed 48%, #6d28d9 100%) !important;
  background-blend-mode: normal !important;
  background-clip: padding-box !important;

  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;

  border: 1px solid rgba(221, 214, 254, 0.98) !important;
  opacity: 1 !important;
  visibility: visible !important;

  box-shadow:
    inset 0 0 0 999px rgba(124, 58, 237, 0.96),
    inset 0 1px 0 rgba(255, 255, 255, 0.36),
    0 18px 42px rgba(124, 58, 237, 0.38),
    0 0 0 5px rgba(139, 92, 246, 0.13) !important;

  filter: none !important;
  mix-blend-mode: normal !important;
  isolation: isolate !important;
}

html body button[data-profile-action="edit-profile"] *,
html body button[data-profile-action="edit-profile"] svg,
html body button[data-profile-action="save-profile"] *,
html body button[data-profile-action="save-profile"] svg {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

/* Keep disabled Save Changes readable, but softer */
html body button[data-profile-action="save-profile"]:disabled {
  background-color: #8b5cf6 !important;
  background-image: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 48%, #7c3aed 100%) !important;

  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 0.82 !important;

  box-shadow:
    inset 0 0 0 999px rgba(139, 92, 246, 0.92),
    inset 0 1px 0 rgba(255, 255, 255, 0.30),
    0 12px 28px rgba(124, 58, 237, 0.24) !important;

  cursor: not-allowed !important;
}

/* Hover for active buttons */
html body button[data-profile-action="edit-profile"]:hover,
html body button[data-profile-action="save-profile"]:not(:disabled):hover {
  background-color: #9333ea !important;
  background-image: linear-gradient(135deg, #c084fc 0%, #8b5cf6 45%, #7c3aed 100%) !important;

  box-shadow:
    inset 0 0 0 999px rgba(147, 51, 234, 0.96),
    inset 0 1px 0 rgba(255, 255, 255, 0.44),
    0 24px 54px rgba(124, 58, 237, 0.50),
    0 0 0 6px rgba(139, 92, 246, 0.18) !important;
}
'''

if "PROFILE BUTTON PURPLE FILL v13" not in css:
    css = css.rstrip() + "\n" + patch + "\n"

css_path.write_text(css)

print("Profile button purple fill v13 patch applied successfully.")
print(f"Updated file: {css_path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Profile.css")
print("- Forced Edit Profile and Save Changes button interiors purple")
print("")
print("No JSX touched.")
print("No backend files touched.")
print("No API calls changed.")
