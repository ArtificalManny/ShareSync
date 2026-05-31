from pathlib import Path
from datetime import datetime

jsx_path = Path("src/components/Navbar.jsx")
css_path = Path("src/components/Navbar.css")

jsx = jsx_path.read_text()
css = css_path.read_text()

jsx_backup = jsx_path.with_suffix(
    jsx_path.suffix + f".backup-navbar-visual-strike-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
css_backup = css_path.with_suffix(
    css_path.suffix + f".backup-navbar-visual-strike-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)

jsx_backup.write_text(jsx)
css_backup.write_text(css)

original_jsx = jsx

# Ensure Navbar.css is actually loaded by Navbar.jsx.
css_import = 'import "./Navbar.css";'
if css_import not in jsx:
    anchor = 'import FocusBlockScheduler from "./focus/FocusBlockScheduler";'
    if anchor not in jsx:
        raise RuntimeError("Could not find import anchor for Navbar.css. No changes were written.")
    jsx = jsx.replace(anchor, anchor + "\n" + css_import, 1)

# Replace external glow/shadow with inset-only shadows so the navbar edge does not bleed over Sidebar.
jsx = jsx.replace(
    '"0 1px 0 rgba(249, 115, 22, 0.16), 0 4px 20px rgba(249, 115, 22, 0.10)"',
    '"inset 0 -1px 0 rgba(249, 115, 22, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.05)"',
    1,
)

jsx = jsx.replace(
    '"0 1px 0 rgba(139, 92, 246, 0.14), 0 4px 20px rgba(139, 92, 246, 0.10)"',
    '"inset 0 -1px 0 rgba(139, 92, 246, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.05)"',
    1,
)

jsx = jsx.replace(
    'boxShadow: "0 1px 0 rgba(139, 92, 246, 0.08)",',
    'boxShadow: "inset 0 -1px 0 rgba(139, 92, 246, 0.16)",',
    1,
)

# Upgrade the navbar surface backgrounds without changing layout.
jsx = jsx.replace(
    'background: effectiveIsDarkMode\n        ? "linear-gradient(90deg, rgba(9,9,11,0.94) 0%, rgba(15,15,20,0.91) 50%, rgba(9,9,11,0.94) 100%)"\n        : "rgba(255,255,255,0.86)",',
    'background: effectiveIsDarkMode\n        ? "linear-gradient(90deg, rgba(7,10,18,0.96) 0%, rgba(15,23,42,0.92) 46%, rgba(8,13,22,0.96) 100%)"\n        : "linear-gradient(90deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.90) 48%, rgba(236,254,255,0.78) 100%)",',
    1,
)

# Add stable visual hook classes.
jsx = jsx.replace(
    'className="navbar navbar-dark-surface-refined sticky top-0 z-40 h-14 border-b border-slate-200/70 bg-white/85 px-4 text-slate-900 backdrop-blur-xl transition-all duration-500 dark:border-white/[0.08] dark:!bg-[#09090B]/92 dark:text-zinc-100 lg:px-6"',
    'className="navbar openshare-navbar-polish navbar-dark-surface-refined sticky top-0 z-40 h-14 border-b border-slate-200/70 bg-white/85 px-4 text-slate-900 backdrop-blur-xl transition-all duration-500 dark:border-white/[0.08] dark:!bg-[#09090B]/92 dark:text-zinc-100 lg:px-6"',
    1,
)

jsx = jsx.replace(
    'className="h-full max-w-[1800px] mx-auto flex items-center"',
    'className="openshare-navbar-inner h-full max-w-[1800px] mx-auto flex items-center"',
    1,
)

jsx = jsx.replace(
    'className="flex items-center gap-2"',
    'className="navbar-page-pill flex items-center gap-2"',
    1,
)

jsx = jsx.replace(
    'className="hidden md:flex items-center relative group"',
    'className="navbar-search-shell hidden md:flex items-center relative group"',
    1,
)

jsx = jsx.replace(
    'className="flex-1 min-w-0 flex items-center justify-start px-4"',
    'className="navbar-command-center flex-1 min-w-0 flex items-center justify-start px-4"',
    1,
)

jsx = jsx.replace(
    'className="flex shrink-0 items-center gap-2"',
    'className="navbar-actions flex shrink-0 items-center gap-2"',
    1,
)

jsx = jsx.replace(
    'className={`relative p-2 text-slate-600',
    'className={`navbar-icon-button relative p-2 text-slate-600',
    1,
)

jsx = jsx.replace(
    'className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition-all duration-200 mr-2',
    'className={`navbar-new-button flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition-all duration-200 mr-2',
    1,
)

# Scoped CSS polish. Appended at bottom so it wins over earlier Navbar.css hover resets.
css_patch = r'''

/* ═══════════════════════════════════════════════════════════════════════════════
   NAVBAR VISUAL POLISH — scoped to Navbar.jsx only
   - Removes the little edge/glow bleed near Sidebar
   - Adds subtle glass depth, sharper command-center feel, and cleaner controls
   ═══════════════════════════════════════════════════════════════════════════════ */

.openshare-navbar-polish {
  position: sticky;
  isolation: isolate;
  overflow: visible;
}

.openshare-navbar-polish::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(circle at 18% 50%, rgba(139, 92, 246, 0.08), transparent 34%),
    radial-gradient(circle at 78% 45%, rgba(34, 211, 238, 0.08), transparent 38%);
  opacity: 0.9;
}

.openshare-navbar-polish::after {
  content: "";
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: -1px;
  height: 1px;
  pointer-events: none;
  z-index: 1;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(139, 92, 246, 0.42) 18%,
    rgba(34, 211, 238, 0.36) 52%,
    rgba(16, 185, 129, 0.28) 78%,
    transparent 100%
  );
}

.openshare-navbar-inner {
  position: relative;
  z-index: 2;
}

.navbar-page-pill {
  min-height: 2.25rem;
  border-radius: 999px;
  padding: 0.25rem 0.55rem;
  background: rgba(255, 255, 255, 0.48);
  border: 1px solid rgba(226, 232, 240, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.dark .navbar-page-pill,
html[data-theme="dark"] .navbar-page-pill {
  background: rgba(255, 255, 255, 0.045);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.navbar-search-shell .navbar-dark-search {
  border-radius: 999px !important;
  box-shadow:
    0 10px 28px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.65) !important;
}

.navbar-search-shell .navbar-dark-search:focus {
  box-shadow:
    0 14px 34px rgba(139, 92, 246, 0.12),
    0 0 0 3px rgba(139, 92, 246, 0.11),
    inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
}

.dark .navbar-search-shell .navbar-dark-search,
html[data-theme="dark"] .navbar-search-shell .navbar-dark-search {
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.20),
    inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
}

.navbar-icon-button {
  border-radius: 999px !important;
  display: inline-grid !important;
  place-items: center !important;
  min-width: 2.25rem;
  min-height: 2.25rem;
}

.navbar-icon-button:hover {
  background: rgba(255, 255, 255, 0.72) !important;
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
}

.dark .navbar-icon-button:hover,
html[data-theme="dark"] .navbar-icon-button:hover {
  background: rgba(255, 255, 255, 0.075) !important;
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
}

.navbar-new-button {
  border-radius: 999px !important;
  min-height: 2.25rem;
  padding-inline: 1.05rem !important;
  box-shadow:
    0 14px 30px rgba(124, 58, 237, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
}

.navbar-new-button:hover {
  box-shadow:
    0 18px 38px rgba(124, 58, 237, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;
}

.navbar-actions {
  padding-left: 0.25rem;
}

@media (max-width: 900px) {
  .navbar-page-pill {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
  }

  .openshare-navbar-polish::after {
    left: 0.5rem;
    right: 0.5rem;
  }
}
'''

if "NAVBAR VISUAL POLISH — scoped to Navbar.jsx only" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"

bad_patterns = [
    "onClick={() =",
    "className={` =",
    "className={ =",
]

for bad in bad_patterns:
    if bad in jsx:
        jsx_path.write_text(original_jsx)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Navbar visual strike patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Navbar surface glow changed from external shadow to inset shadow")
print("- Added scoped Navbar visual classes")
print("- Added scoped Navbar.css polish")
print("- Ensured Navbar.css is imported by Navbar.jsx")
print("")
print("No Sidebar.jsx changes.")
print("No backend files touched.")
print("No routing, search, notification, profile, or create-project logic changed.")
