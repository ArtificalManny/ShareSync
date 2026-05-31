from pathlib import Path
from datetime import datetime

css_path = Path("src/pages/Profile.css")
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = css_path.with_suffix(css_path.suffix + f".backup-profile-edit-button-fill-v14-{stamp}")
backup.write_text(css)

patch = r'''

/* ═══════════════════════════════════════════════════════════════════════
   PROFILE EDIT BUTTON FILL v14
   Final target:
   - The hero Edit Profile button already has a purple border
   - This forces the interior purple using a real inner fill layer
   - Scoped only to buttons inside the profile hero surface
   ═══════════════════════════════════════════════════════════════════════ */

html body .profile-visual-shell section.profile-hero-surface button,
html body section.profile-hero-surface button,
html body .profile-hero-surface button[data-profile-action="edit-profile"],
html body .profile-hero-surface .profile-edit-purple-force {
  position: relative !important;
  isolation: isolate !important;
  overflow: hidden !important;

  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.55rem !important;

  min-width: 150px !important;
  min-height: 46px !important;
  padding: 0.78rem 1.65rem !important;

  border-radius: 999px !important;
  border: 1px solid rgba(221, 214, 254, 0.98) !important;

  background: #7c3aed !important;
  background-color: #7c3aed !important;
  background-image: linear-gradient(135deg, #a855f7 0%, #7c3aed 48%, #6d28d9 100%) !important;
  background-clip: padding-box !important;

  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;

  opacity: 1 !important;
  visibility: visible !important;
  cursor: pointer !important;

  font-weight: 900 !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.38) !important;

  box-shadow:
    0 18px 42px rgba(124, 58, 237, 0.42),
    0 0 0 5px rgba(139, 92, 246, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;

  filter: none !important;
  mix-blend-mode: normal !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* Force the purple interior even if another rule keeps wiping background */
html body .profile-visual-shell section.profile-hero-surface button::before,
html body section.profile-hero-surface button::before,
html body .profile-hero-surface button[data-profile-action="edit-profile"]::before,
html body .profile-hero-surface .profile-edit-purple-force::before {
  content: "" !important;
  display: block !important;
  position: absolute !important;
  inset: 0 !important;
  z-index: 0 !important;
  border-radius: inherit !important;
  pointer-events: none !important;

  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 48%, #6d28d9 100%) !important;
  opacity: 1 !important;

  filter: none !important;
  mix-blend-mode: normal !important;
}

/* Keep the icon/text above the purple fill */
html body .profile-visual-shell section.profile-hero-surface button *,
html body section.profile-hero-surface button *,
html body .profile-hero-surface button[data-profile-action="edit-profile"] *,
html body .profile-hero-surface .profile-edit-purple-force * {
  position: relative !important;
  z-index: 2 !important;

  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;

  filter: none !important;
  mix-blend-mode: normal !important;
}

/* Hover */
html body .profile-visual-shell section.profile-hero-surface button:hover::before,
html body section.profile-hero-surface button:hover::before,
html body .profile-hero-surface button[data-profile-action="edit-profile"]:hover::before {
  background: linear-gradient(135deg, #c084fc 0%, #8b5cf6 45%, #7c3aed 100%) !important;
}
'''

if "PROFILE EDIT BUTTON FILL v14" not in css:
    css = css.rstrip() + "\n" + patch + "\n"

css_path.write_text(css)

print("Profile Edit Profile button fill v14 patch applied successfully.")
print(f"Updated file: {css_path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Profile.css")
print("- Forced the hero Edit Profile button interior purple")
print("")
print("No JSX touched.")
print("No backend files touched.")
print("No API calls changed.")
