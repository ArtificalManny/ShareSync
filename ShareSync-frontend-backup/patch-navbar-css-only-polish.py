from pathlib import Path
from datetime import datetime

jsx_path = Path("src/components/Navbar.jsx")
css_path = Path("src/components/Navbar.css")

jsx = jsx_path.read_text()
css = css_path.read_text()

jsx_backup = jsx_path.with_suffix(
    jsx_path.suffix + f".backup-navbar-css-only-polish-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
css_backup = css_path.with_suffix(
    css_path.suffix + f".backup-navbar-css-only-polish-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)

jsx_backup.write_text(jsx)
css_backup.write_text(css)

# Only ensure Navbar.css is imported. No JSX className rewriting.
css_import = 'import "./Navbar.css";'
if css_import not in jsx:
    anchor = 'import FocusBlockScheduler from "./focus/FocusBlockScheduler";'
    if anchor not in jsx:
        raise RuntimeError("Could not find FocusBlockScheduler import anchor. No changes were written.")
    jsx = jsx.replace(anchor, anchor + "\n" + css_import, 1)
    jsx_path.write_text(jsx)

css_patch = r'''

/* ═══════════════════════════════════════════════════════════════════════════════
   NAVBAR CSS-ONLY VISUAL POLISH
   Safe pass:
   - Uses existing .navbar hook from Navbar.jsx
   - Fixes edge/glow bleed with inset-only shadow
   - Adds subtle glass depth without touching Sidebar.jsx
   ═══════════════════════════════════════════════════════════════════════════════ */

.navbar {
  isolation: isolate !important;
  overflow: clip !important;
  box-shadow:
    inset 0 -1px 0 rgba(139, 92, 246, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.65) !important;
}

.navbar::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background:
    radial-gradient(circle at 18% 50%, rgba(139, 92, 246, 0.075), transparent 34%),
    radial-gradient(circle at 78% 45%, rgba(34, 211, 238, 0.085), transparent 38%);
}

.navbar::after {
  content: "";
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: 0;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(139, 92, 246, 0.38) 18%,
    rgba(34, 211, 238, 0.32) 52%,
    rgba(16, 185, 129, 0.24) 78%,
    transparent 100%
  );
}

/* Search command field */
.navbar .navbar-dark-search {
  border-radius: 999px !important;
  box-shadow:
    0 10px 28px rgba(15, 23, 42, 0.045),
    inset 0 1px 0 rgba(255, 255, 255, 0.68) !important;
}

.navbar .navbar-dark-search:focus {
  box-shadow:
    0 14px 34px rgba(139, 92, 246, 0.13),
    0 0 0 3px rgba(139, 92, 246, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.75) !important;
}

/* Navbar icon buttons */
.navbar button {
  border-radius: 999px;
}

.navbar button:hover {
  transform: translateY(-1px);
}

/* New button: target by its existing Tailwind color classes */
.navbar button[class*="!bg-[#7c3aed]"],
.navbar button[class*="!bg-[#f97316]"] {
  border-radius: 999px !important;
  min-height: 2.25rem;
  box-shadow:
    0 14px 30px rgba(124, 58, 237, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
}

.navbar button[class*="!bg-[#7c3aed]"]:hover,
.navbar button[class*="!bg-[#f97316]"]:hover {
  box-shadow:
    0 18px 38px rgba(124, 58, 237, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.42) !important;
}

/* Dark mode refinement */
html.dark .navbar,
html[data-theme="dark"] .navbar,
body.dark .navbar {
  box-shadow:
    inset 0 -1px 0 rgba(139, 92, 246, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.055) !important;
}

html.dark .navbar::before,
html[data-theme="dark"] .navbar::before,
body.dark .navbar::before {
  background:
    radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.12), transparent 34%),
    radial-gradient(circle at 82% 45%, rgba(34, 211, 238, 0.10), transparent 40%);
}

html.dark .navbar .navbar-dark-search,
html[data-theme="dark"] .navbar .navbar-dark-search,
body.dark .navbar .navbar-dark-search {
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.045) !important;
}
'''

if "NAVBAR CSS-ONLY VISUAL POLISH" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"
    css_path.write_text(css)

print("Navbar CSS-only polish applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Ensured Navbar.css is imported")
print("- Added CSS-only navbar polish using existing .navbar hook")
print("- Added inset shadow to prevent edge/glow bleed")
print("")
print("No Sidebar.jsx changes.")
print("No routing/state/API logic changed.")
