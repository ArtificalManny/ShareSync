from pathlib import Path
from datetime import datetime

jsx_path = Path("src/pages/Projects.jsx")
css_path = Path("src/pages/Projects.css")

jsx = jsx_path.read_text()
css = css_path.read_text()

jsx_backup = jsx_path.with_suffix(
    jsx_path.suffix + f".backup-projects-visual-strike-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
css_backup = css_path.with_suffix(
    css_path.suffix + f".backup-projects-visual-strike-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)

jsx_backup.write_text(jsx)
css_backup.write_text(css)

# Ensure Projects.css is actually loaded.
css_import = "import './Projects.css';"
if css_import not in jsx:
    anchor = "import { getProjects } from '../api/projects';"
    if anchor not in jsx:
        raise RuntimeError("Could not find getProjects import anchor. No changes were written.")
    jsx = jsx.replace(anchor, anchor + "\n" + css_import, 1)

# Root shell
jsx = jsx.replace(
    'className="min-h-screen p-6 lg:p-10 max-w-[1400px] mx-auto"',
    'className="projects-visual-shell min-h-screen p-6 lg:p-10 max-w-[1400px] mx-auto"',
    1,
)

# Header / hero
jsx = jsx.replace(
    '<header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">',
    '<header className="projects-hero mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">',
    1,
)

jsx = jsx.replace(
    '<div className="flex items-center gap-2 mb-2">',
    '<div className="projects-eyebrow flex items-center gap-2 mb-2">',
    1,
)

jsx = jsx.replace(
    '<h1 className="text-4xl font-semibold text-slate-800 dark:text-white">',
    '<h1 className="projects-title text-4xl font-semibold text-slate-800 dark:text-white">',
    1,
)

jsx = jsx.replace(
    '<div className="flex items-center gap-3">',
    '<div className="projects-hero-actions flex items-center gap-3">',
    1,
)

# Search field and create button
jsx = jsx.replace(
    '<div className="relative">\n            <Search',
    '<div className="projects-search-shell relative">\n            <Search',
    1,
)

jsx = jsx.replace(
    'className="\n                bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 rounded-lg',
    'className="projects-search-input\n                bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 rounded-lg',
    1,
)

jsx = jsx.replace(
    'className="\n              flex items-center gap-2 px-4 py-2.5 rounded-lg\n              text-white text-sm font-medium',
    'className="projects-new-button\n              flex items-center gap-2 px-4 py-2.5 rounded-lg\n              text-white text-sm font-medium',
    1,
)

# Toolbar
jsx = jsx.replace(
    '<div className="flex items-center justify-between mb-6 mt-8 pb-4 border-b border-slate-200 dark:border-white/10">',
    '<div className="projects-toolbar flex items-center justify-between mb-6 mt-8 pb-4 border-b border-slate-200 dark:border-white/10">',
    1,
)

jsx = jsx.replace(
    '<div className="flex gap-1">\n          {[\'all\', \'active\', \'at-risk\'].map(filter => (',
    '<div className="projects-filter-group flex gap-1">\n          {[\'all\', \'active\', \'at-risk\'].map(filter => (',
    1,
)

jsx = jsx.replace(
    '<div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg border border-transparent dark:border-white/5">',
    '<div className="projects-view-toggle flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg border border-transparent dark:border-white/5">',
    1,
)

# Project card / row hooks
jsx = jsx.replace(
    'className={`\n        group p-5 rounded-xl cursor-pointer',
    'className={`\n        project-card project-card-grid group p-5 rounded-xl cursor-pointer',
    1,
)

jsx = jsx.replace(
    'className="\n        group flex items-center justify-between p-4 rounded-xl cursor-pointer',
    'className="\n        project-row project-row-list group flex items-center justify-between p-4 rounded-xl cursor-pointer',
    1,
)

# Grid/list hooks
jsx = jsx.replace(
    '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">',
    '<div className="projects-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">',
    2,
)

jsx = jsx.replace(
    '<div className="space-y-3">',
    '<div className="projects-list space-y-3">',
    1,
)

css_patch = r'''

/* ═══════════════════════════════════════════════════════════════════════════════
   PROJECTS PAGE VISUAL STRIKE
   Scope: src/pages/Projects.jsx only
   Purpose:
   - Stronger Projects header
   - Premium workspace background
   - Better toolbar surface
   - More dimensional project cards
   ═══════════════════════════════════════════════════════════════════════════════ */

.projects-visual-shell {
  position: relative;
  isolation: isolate;
}

.projects-visual-shell::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -2;
  background:
    radial-gradient(circle at 18% 12%, rgba(139, 92, 246, 0.13), transparent 28%),
    radial-gradient(circle at 82% 18%, rgba(34, 211, 238, 0.13), transparent 30%),
    radial-gradient(circle at 80% 86%, rgba(236, 72, 153, 0.08), transparent 26%),
    linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(255, 255, 255, 0.96));
}

.projects-visual-shell::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  opacity: 0.55;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 44px 44px;
}

.projects-hero {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 32px;
  padding: 2rem;
  background:
    radial-gradient(circle at 14% 20%, rgba(139, 92, 246, 0.16), transparent 34%),
    radial-gradient(circle at 90% 30%, rgba(34, 211, 238, 0.16), transparent 36%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.74));
  box-shadow:
    0 24px 60px rgba(15, 23, 42, 0.06),
    0 12px 32px rgba(139, 92, 246, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.projects-hero::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: linear-gradient(90deg, #8b5cf6, #22d3ee, #10b981);
}

.projects-hero::after {
  content: "";
  position: absolute;
  right: -3rem;
  top: -4rem;
  width: 18rem;
  height: 18rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.12), transparent 68%);
  filter: blur(2px);
}

.projects-eyebrow {
  position: relative;
  z-index: 1;
  width: fit-content;
  border: 1px solid rgba(196, 181, 253, 0.72);
  border-radius: 999px;
  padding: 0.4rem 0.75rem;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.projects-eyebrow span {
  font-weight: 900;
  letter-spacing: 0.18em;
  color: #6d28d9 !important;
}

.projects-title {
  position: relative;
  z-index: 1;
  font-size: clamp(2.35rem, 5vw, 4.75rem) !important;
  line-height: 0.92 !important;
  letter-spacing: -0.06em;
  font-weight: 950 !important;
  background: linear-gradient(135deg, #0f172a 0%, #4c1d95 45%, #0891b2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;
  text-shadow: 0 18px 45px rgba(139, 92, 246, 0.14);
}

.projects-hero-actions {
  position: relative;
  z-index: 1;
  align-items: center;
}

.projects-search-shell {
  filter: drop-shadow(0 12px 24px rgba(15, 23, 42, 0.05));
}

.projects-search-input {
  border-radius: 999px !important;
  background: rgba(255, 255, 255, 0.86) !important;
  box-shadow:
    0 14px 30px rgba(15, 23, 42, 0.045),
    inset 0 1px 0 rgba(255, 255, 255, 0.82) !important;
}

.projects-search-input:focus {
  box-shadow:
    0 18px 38px rgba(139, 92, 246, 0.13),
    0 0 0 4px rgba(139, 92, 246, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.88) !important;
}

.projects-new-button {
  border-radius: 999px !important;
  font-weight: 900 !important;
  box-shadow:
    0 18px 36px rgba(139, 92, 246, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
}

.projects-new-button:hover {
  transform: translateY(-2px) !important;
  box-shadow:
    0 24px 48px rgba(139, 92, 246, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.42) !important;
}

.projects-toolbar {
  position: relative;
  border: 1px solid rgba(226, 232, 240, 0.82) !important;
  border-radius: 999px;
  padding: 0.65rem !important;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(248, 250, 252, 0.64)) !important;
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.045),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.projects-filter-group,
.projects-view-toggle {
  border-radius: 999px !important;
}

.projects-filter-group button,
.projects-view-toggle button {
  border-radius: 999px !important;
}

.project-card-grid,
.project-row-list {
  border-radius: 26px !important;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.88)) !important;
  box-shadow:
    0 20px 45px rgba(15, 23, 42, 0.055),
    0 10px 30px rgba(139, 92, 246, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.86) !important;
}

.project-card-grid::before,
.project-row-list::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background:
    radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.10), transparent 38%),
    radial-gradient(circle at 100% 100%, rgba(34, 211, 238, 0.08), transparent 36%);
  opacity: 0;
  transition: opacity 180ms ease;
}

.project-card-grid:hover::before,
.project-row-list:hover::before {
  opacity: 1;
}

.project-card-grid:hover,
.project-row-list:hover {
  border-color: rgba(167, 139, 250, 0.55) !important;
}

.projects-grid {
  position: relative;
}

.projects-list {
  position: relative;
}

/* Dark mode */
html.dark .projects-visual-shell::before,
html[data-theme="dark"] .projects-visual-shell::before,
body.dark .projects-visual-shell::before {
  background:
    radial-gradient(circle at 18% 12%, rgba(139, 92, 246, 0.18), transparent 28%),
    radial-gradient(circle at 82% 18%, rgba(34, 211, 238, 0.13), transparent 30%),
    linear-gradient(180deg, rgba(5, 7, 12, 0.98), rgba(10, 15, 26, 0.98));
}

html.dark .projects-hero,
html[data-theme="dark"] .projects-hero,
body.dark .projects-hero {
  border-color: rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at 14% 20%, rgba(139, 92, 246, 0.20), transparent 34%),
    radial-gradient(circle at 90% 30%, rgba(34, 211, 238, 0.14), transparent 36%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(8, 13, 24, 0.88));
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.28),
    0 12px 32px rgba(139, 92, 246, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

html.dark .projects-title,
html[data-theme="dark"] .projects-title,
body.dark .projects-title {
  background: linear-gradient(135deg, #ffffff 0%, #c4b5fd 45%, #67e8f9 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

html.dark .projects-eyebrow,
html[data-theme="dark"] .projects-eyebrow,
body.dark .projects-eyebrow,
html.dark .projects-toolbar,
html[data-theme="dark"] .projects-toolbar,
body.dark .projects-toolbar {
  border-color: rgba(255, 255, 255, 0.08) !important;
  background: rgba(255, 255, 255, 0.045) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.055);
}

html.dark .project-card-grid,
html[data-theme="dark"] .project-card-grid,
body.dark .project-card-grid,
html.dark .project-row-list,
html[data-theme="dark"] .project-row-list,
body.dark .project-row-list {
  background:
    linear-gradient(145deg, rgba(17, 24, 39, 0.96), rgba(9, 13, 24, 0.90)) !important;
  box-shadow:
    0 20px 45px rgba(0, 0, 0, 0.28),
    0 10px 30px rgba(139, 92, 246, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.055) !important;
}

@media (max-width: 768px) {
  .projects-hero {
    padding: 1.4rem;
    border-radius: 26px;
  }

  .projects-hero-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .projects-search-input {
    width: 100% !important;
  }

  .projects-toolbar {
    border-radius: 24px;
    align-items: stretch;
    gap: 0.75rem;
    flex-direction: column;
  }
}
'''

if "PROJECTS PAGE VISUAL STRIKE" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Projects page visual strike patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Ensured Projects.css is imported")
print("- Added scoped class hooks to Projects.jsx")
print("- Added scoped visual CSS to Projects.css")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No project fetching/filtering/navigation/modal logic changed.")
