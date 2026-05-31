from pathlib import Path
from datetime import datetime
import shutil

jsx_path = Path("src/components/projects/ProjectCardV2.jsx")
css_path = Path("src/index.css")

if not jsx_path.exists():
    raise FileNotFoundError(f"Missing file: {jsx_path}")

if not css_path.exists():
    raise FileNotFoundError(f"Missing file: {css_path}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

jsx_original = jsx_path.read_text()
css_original = css_path.read_text()

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-darkmode-card-v2-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-darkmode-card-v2-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_original
css = css_original

required = [
    "export default function ProjectCardV2",
    "function SignalChip",
    "Momentum",
    "Risk",
    "Activity",
    "ProjectAvatar",
    "primaryCue",
    "progress",
]

missing = [item for item in required if item not in jsx]
if missing:
    raise RuntimeError(
        f"Could not verify ProjectCardV2 structure. Missing: {missing}. No changes written."
    )

replacements = [
    (
        '''      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 min-w-0 ${toneClasses[tone] || toneClasses.neutral}`}''',
        '''      className={`project-card-v2-signal project-card-v2-signal-${tone} flex items-center gap-2 rounded-lg border px-2.5 py-2 min-w-0 ${toneClasses[tone] || toneClasses.neutral}`}''',
    ),
    (
        '''        group relative overflow-hidden rounded-2xl cursor-pointer flex flex-col justify-between
        bg-white border border-slate-200/90''',
        '''        project-card-v2-shell group relative overflow-hidden rounded-2xl cursor-pointer flex flex-col justify-between
        bg-white border border-slate-200/90''',
    ),
    (
        '''            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stateBadgeClasses[stateMeta.tone]}`}''',
        '''            className={`project-card-v2-state-badge project-card-v2-state-${stateMeta.tone} shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stateBadgeClasses[stateMeta.tone]}`}''',
    ),
    (
        '''            rounded-xl border p-3.5 mb-4
            ${primaryCue.tone === 'red' ''',
        '''            project-card-v2-cue project-card-v2-cue-${primaryCue.tone} rounded-xl border p-3.5 mb-4
            ${primaryCue.tone === 'red' ''',
    ),
    (
        '''        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">''',
        '''        <div className="project-card-v2-progress rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">''',
    ),
    (
        '''      <div className="px-5 py-4 border-t border-slate-100 bg-white/80">''',
        '''      <div className="project-card-v2-footer px-5 py-4 border-t border-slate-100 bg-white/80">''',
    ),
]

if "project-card-v2-shell" not in jsx:
    for old, new in replacements:
        if old not in jsx:
            raise RuntimeError(
                "Could not find one of the expected ProjectCardV2 blocks. No changes written.\n"
                "Run this and paste the output:\n"
                "grep -n \"ProjectCardV2\\|SignalChip\\|primaryCue\\|Progress\\|border-t border-slate\" src/components/projects/ProjectCardV2.jsx"
            )
        jsx = jsx.replace(old, new, 1)

marker = "PROJECT CARD V2 DARKMODE STRIKE v1"

if marker in css:
    start = css.find("/* =========================================================\n   PROJECT CARD V2 DARKMODE STRIKE v1")
    end = css.find("/* END PROJECT CARD V2 DARKMODE STRIKE v1 */", start)
    if start != -1 and end != -1:
        end += len("/* END PROJECT CARD V2 DARKMODE STRIKE v1 */")
        css = css[:start].rstrip() + "\n\n" + css[end:].lstrip()

css_patch = r'''
/* =========================================================
   PROJECT CARD V2 DARKMODE STRIKE v1
   Projects page grid cards: dark-mode mission-card polish.
   ========================================================= */

.project-card-v2-shell {
  isolation: isolate;
}

.project-card-v2-shell > * {
  position: relative;
  z-index: 1;
}

.project-card-v2-shell::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 220ms ease;
}

html.dark .project-card-v2-shell,
html[data-theme="dark"] .project-card-v2-shell,
body.dark .project-card-v2-shell {
  background:
    radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.24), transparent 38%),
    radial-gradient(circle at 92% 12%, rgba(45, 212, 191, 0.14), transparent 36%),
    linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(8, 13, 25, 0.96)) !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
  color: #f8fafc !important;
  box-shadow:
    0 24px 58px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

html.dark .project-card-v2-shell::before,
html[data-theme="dark"] .project-card-v2-shell::before,
body.dark .project-card-v2-shell::before {
  background:
    linear-gradient(120deg, rgba(124, 58, 237, 0.18), transparent 38%, rgba(45, 212, 191, 0.12));
  opacity: 1;
}

html.dark .project-card-v2-shell:hover,
html[data-theme="dark"] .project-card-v2-shell:hover,
body.dark .project-card-v2-shell:hover {
  border-color: rgba(167, 139, 250, 0.42) !important;
  box-shadow:
    0 30px 72px rgba(0, 0, 0, 0.46),
    0 0 0 1px rgba(167, 139, 250, 0.18),
    0 0 36px rgba(139, 92, 246, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.14) !important;
}

/* Main title + general text contrast */
html.dark .project-card-v2-shell h3,
html[data-theme="dark"] .project-card-v2-shell h3,
body.dark .project-card-v2-shell h3 {
  color: #ffffff !important;
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.10);
}

html.dark .project-card-v2-shell p,
html.dark .project-card-v2-shell [class*="text-slate-"],
html[data-theme="dark"] .project-card-v2-shell p,
html[data-theme="dark"] .project-card-v2-shell [class*="text-slate-"],
body.dark .project-card-v2-shell p,
body.dark .project-card-v2-shell [class*="text-slate-"] {
  color: rgba(226, 232, 240, 0.78) !important;
}

/* State badge */
html.dark .project-card-v2-state-badge,
html[data-theme="dark"] .project-card-v2-state-badge,
body.dark .project-card-v2-state-badge {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
  color: #ffffff !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 10px 22px rgba(0, 0, 0, 0.22);
}

html.dark .project-card-v2-state-emerald,
html[data-theme="dark"] .project-card-v2-state-emerald,
body.dark .project-card-v2-state-emerald {
  color: #6ee7b7 !important;
  border-color: rgba(52, 211, 153, 0.48) !important;
  background: rgba(16, 185, 129, 0.12) !important;
}

html.dark .project-card-v2-state-red,
html[data-theme="dark"] .project-card-v2-state-red,
body.dark .project-card-v2-state-red {
  color: #fca5a5 !important;
  border-color: rgba(248, 113, 113, 0.52) !important;
  background: rgba(239, 68, 68, 0.12) !important;
}

html.dark .project-card-v2-state-amber,
html[data-theme="dark"] .project-card-v2-state-amber,
body.dark .project-card-v2-state-amber {
  color: #fcd34d !important;
  border-color: rgba(251, 191, 36, 0.52) !important;
  background: rgba(245, 158, 11, 0.13) !important;
}

html.dark .project-card-v2-state-violet,
html[data-theme="dark"] .project-card-v2-state-violet,
body.dark .project-card-v2-state-violet {
  color: #c4b5fd !important;
  border-color: rgba(167, 139, 250, 0.52) !important;
  background: rgba(139, 92, 246, 0.14) !important;
}

/* Primary cue block */
html.dark .project-card-v2-cue,
html[data-theme="dark"] .project-card-v2-cue,
body.dark .project-card-v2-cue {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.16), transparent 40%),
    rgba(255, 255, 255, 0.055) !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 14px 28px rgba(0, 0, 0, 0.18);
}

html.dark .project-card-v2-cue > div:last-child,
html[data-theme="dark"] .project-card-v2-cue > div:last-child,
body.dark .project-card-v2-cue > div:last-child {
  color: rgba(248, 250, 252, 0.92) !important;
}

html.dark .project-card-v2-cue-blue,
html[data-theme="dark"] .project-card-v2-cue-blue,
body.dark .project-card-v2-cue-blue {
  border-color: rgba(96, 165, 250, 0.38) !important;
  background:
    radial-gradient(circle at 8% 0%, rgba(59, 130, 246, 0.18), transparent 42%),
    rgba(15, 23, 42, 0.70) !important;
}

html.dark .project-card-v2-cue-violet,
html[data-theme="dark"] .project-card-v2-cue-violet,
body.dark .project-card-v2-cue-violet {
  border-color: rgba(167, 139, 250, 0.42) !important;
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.22), transparent 42%),
    rgba(24, 24, 37, 0.76) !important;
}

html.dark .project-card-v2-cue-red,
html[data-theme="dark"] .project-card-v2-cue-red,
body.dark .project-card-v2-cue-red {
  border-color: rgba(248, 113, 113, 0.42) !important;
  background:
    radial-gradient(circle at 8% 0%, rgba(239, 68, 68, 0.22), transparent 42%),
    rgba(35, 16, 24, 0.78) !important;
}

/* Momentum / Risk / Activity chips */
html.dark .project-card-v2-signal,
html[data-theme="dark"] .project-card-v2-signal,
body.dark .project-card-v2-signal {
  background: rgba(255, 255, 255, 0.055) !important;
  border-color: rgba(255, 255, 255, 0.11) !important;
  color: rgba(248, 250, 252, 0.90) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.09),
    0 10px 22px rgba(0, 0, 0, 0.18);
}

html.dark .project-card-v2-signal svg,
html[data-theme="dark"] .project-card-v2-signal svg,
body.dark .project-card-v2-signal svg {
  filter: drop-shadow(0 0 10px currentColor);
}

html.dark .project-card-v2-signal-emerald,
html[data-theme="dark"] .project-card-v2-signal-emerald,
body.dark .project-card-v2-signal-emerald {
  border-color: rgba(52, 211, 153, 0.42) !important;
  color: #6ee7b7 !important;
  background:
    radial-gradient(circle at 10% 0%, rgba(16, 185, 129, 0.20), transparent 42%),
    rgba(6, 78, 59, 0.22) !important;
}

html.dark .project-card-v2-signal-violet,
html[data-theme="dark"] .project-card-v2-signal-violet,
body.dark .project-card-v2-signal-violet {
  border-color: rgba(167, 139, 250, 0.42) !important;
  color: #c4b5fd !important;
  background:
    radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.20), transparent 42%),
    rgba(76, 29, 149, 0.18) !important;
}

html.dark .project-card-v2-signal-blue,
html[data-theme="dark"] .project-card-v2-signal-blue,
body.dark .project-card-v2-signal-blue {
  border-color: rgba(96, 165, 250, 0.38) !important;
  color: #93c5fd !important;
  background:
    radial-gradient(circle at 10% 0%, rgba(59, 130, 246, 0.18), transparent 42%),
    rgba(30, 64, 175, 0.14) !important;
}

html.dark .project-card-v2-signal-red,
html[data-theme="dark"] .project-card-v2-signal-red,
body.dark .project-card-v2-signal-red {
  border-color: rgba(248, 113, 113, 0.46) !important;
  color: #fca5a5 !important;
  background:
    radial-gradient(circle at 10% 0%, rgba(239, 68, 68, 0.22), transparent 42%),
    rgba(127, 29, 29, 0.18) !important;
}

html.dark .project-card-v2-signal-amber,
html[data-theme="dark"] .project-card-v2-signal-amber,
body.dark .project-card-v2-signal-amber {
  border-color: rgba(251, 191, 36, 0.44) !important;
  color: #fcd34d !important;
  background:
    radial-gradient(circle at 10% 0%, rgba(251, 191, 36, 0.22), transparent 42%),
    rgba(120, 53, 15, 0.18) !important;
}

/* Progress strip */
html.dark .project-card-v2-progress,
html[data-theme="dark"] .project-card-v2-progress,
body.dark .project-card-v2-progress {
  background: rgba(255, 255, 255, 0.045) !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
}

html.dark .project-card-v2-progress span,
html[data-theme="dark"] .project-card-v2-progress span,
body.dark .project-card-v2-progress span {
  color: rgba(248, 250, 252, 0.86) !important;
}

html.dark .project-card-v2-progress .bg-slate-200,
html[data-theme="dark"] .project-card-v2-progress .bg-slate-200,
body.dark .project-card-v2-progress .bg-slate-200 {
  background: rgba(255, 255, 255, 0.10) !important;
}

/* Footer */
html.dark .project-card-v2-footer,
html[data-theme="dark"] .project-card-v2-footer,
body.dark .project-card-v2-footer {
  background: rgba(2, 6, 23, 0.34) !important;
  border-top-color: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(14px);
}

html.dark .project-card-v2-footer .rounded-full,
html[data-theme="dark"] .project-card-v2-footer .rounded-full,
body.dark .project-card-v2-footer .rounded-full {
  border-color: rgba(15, 23, 42, 0.92) !important;
}

/* Sprint button */
html.dark .project-card-v2-footer button,
html[data-theme="dark"] .project-card-v2-footer button,
body.dark .project-card-v2-footer button {
  border-color: rgba(167, 139, 250, 0.32) !important;
}

/* END PROJECT CARD V2 DARKMODE STRIKE v1 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

for bad in ["onClick={() =", "className={}"]:
    if bad in jsx and bad not in jsx_original:
        jsx_path.write_text(jsx_original)
        css_path.write_text(css_original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

if "project-card-v2-shell" not in jsx or marker not in css:
    jsx_path.write_text(jsx_original)
    css_path.write_text(css_original)
    raise RuntimeError("Patch incomplete. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("ProjectCardV2 dark-mode visual patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added scoped visual classes to ProjectCardV2")
print("- Added dark-mode CSS for the project card shell, cue, signals, progress strip, and footer")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No project fetching, routing, filtering, sprint, or card click logic changed.")
