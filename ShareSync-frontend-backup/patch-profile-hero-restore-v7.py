from pathlib import Path
from datetime import datetime

css_path = Path("src/pages/Profile.css")
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = css_path.with_suffix(css_path.suffix + f".backup-profile-hero-restore-v7-{stamp}")
backup.write_text(css)

patch = r'''

/* ═══════════════════════════════════════════════════════════════════════
   PROFILE HERO RESTORE v7
   Fixes:
   - Restores the silver identity card after cleanup rules made it transparent
   - Uses higher specificity than older .profile-visual-shell > section:first-of-type rules
   - Restores visible Edit Profile button
   CSS-only. No JSX / logic changes.
   ═══════════════════════════════════════════════════════════════════════ */

.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type {
  width: min(100%, 980px) !important;
  min-height: 420px !important;
  margin-inline: auto !important;
  margin-bottom: 4rem !important;
  padding: 3.25rem 2rem 2.85rem !important;
  position: relative !important;
  overflow: hidden !important;
  border-radius: 2.1rem !important;
  border: 1px solid rgba(255, 255, 255, 0.72) !important;
  background:
    radial-gradient(circle at 50% 12%, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.34) 32%, transparent 56%),
    radial-gradient(circle at 16% 22%, rgba(139, 92, 246, 0.17), transparent 34%),
    radial-gradient(circle at 84% 78%, rgba(45, 212, 191, 0.15), transparent 34%),
    linear-gradient(135deg, #c5cbd5 0%, #e8ebf1 38%, #f9fafb 54%, #d5dce7 100%) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    inset 0 -1px 0 rgba(255, 255, 255, 0.22),
    0 26px 70px rgba(15, 23, 42, 0.11),
    0 12px 32px rgba(139, 92, 246, 0.10) !important;
  backdrop-filter: blur(10px) saturate(1.08) !important;
  -webkit-backdrop-filter: blur(10px) saturate(1.08) !important;
}

/* Beat the older cleanup rule that disabled pseudo-elements */
.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type::before {
  content: "" !important;
  display: block !important;
  position: absolute !important;
  inset: 0 0 auto 0 !important;
  height: 4px !important;
  background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 32%, #67e8f9 68%, #14b8a6 100%) !important;
  opacity: 0.95 !important;
  z-index: 0 !important;
}

.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type::after {
  content: "" !important;
  display: block !important;
  position: absolute !important;
  inset: 0 !important;
  pointer-events: none !important;
  background:
    radial-gradient(circle at 50% 16%, rgba(255, 255, 255, 0.38), transparent 36%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.11), transparent 22%, transparent 78%, rgba(255, 255, 255, 0.17)) !important;
  opacity: 0.95 !important;
  z-index: 0 !important;
}

.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type > * {
  position: relative !important;
  z-index: 1 !important;
}

/* Keep the name strong but not gigantic */
.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type .profile-hero-name,
.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type h1 {
  font-size: clamp(2rem, 2.8vw, 2.85rem) !important;
  line-height: 1.04 !important;
  letter-spacing: -0.045em !important;
  font-weight: 900 !important;
  margin-top: 0.15rem !important;
  margin-bottom: 0.65rem !important;
  background: linear-gradient(135deg, #111827 0%, #4c1d95 52%, #0891b2 100%) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.34) !important;
}

/* Force Edit Profile back into a real visible button */
.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type .profile-hero-cta,
.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type button.profile-hero-cta {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.5rem !important;
  border-radius: 999px !important;
  padding: 0.65rem 1.25rem !important;
  font-weight: 850 !important;
  color: #ffffff !important;
  opacity: 1 !important;
  border: 1px solid rgba(196, 181, 253, 0.65) !important;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 52%, #2563eb 100%) !important;
  box-shadow:
    0 16px 34px rgba(124, 58, 237, 0.30),
    inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.25) !important;
}

.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type .profile-hero-cta *,
.profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type .profile-hero-cta svg {
  color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;
}

/* Dark mode */
html.dark .profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type,
html[data-theme="dark"] .profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type,
body.dark .profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type {
  border-color: rgba(255, 255, 255, 0.10) !important;
  background:
    radial-gradient(circle at 50% 12%, rgba(255, 255, 255, 0.10), transparent 42%),
    radial-gradient(circle at 16% 20%, rgba(139, 92, 246, 0.22), transparent 34%),
    radial-gradient(circle at 84% 78%, rgba(45, 212, 191, 0.14), transparent 32%),
    linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.94)) !important;
}

@media (max-width: 768px) {
  .profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type {
    width: 100% !important;
    min-height: 360px !important;
    border-radius: 1.55rem !important;
    padding: 2.55rem 1.25rem 2.25rem !important;
  }

  .profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type .profile-hero-name,
  .profile-visual-shell > section.profile-hero-surface.profile-hero-surface:first-of-type h1 {
    font-size: clamp(1.9rem, 8vw, 2.55rem) !important;
  }
}
'''

if "PROFILE HERO RESTORE v7" not in css:
    css = css.rstrip() + "\n" + patch + "\n"

css_path.write_text(css)

print("Profile hero restore v7 applied successfully.")
print(f"Updated file: {css_path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Profile.css")
print("- Restored the silver profile hero card")
print("- Restored premium hero accent line")
print("- Restored Edit Profile button visibility")
print("")
print("No JSX touched.")
print("No backend files touched.")
print("No API calls changed.")
