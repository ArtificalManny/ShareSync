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

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-darkmode-v2-safe-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-darkmode-v2-safe-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_original
css = css_original

required = [
    "export default function ProjectCardV2",
    "ProjectAvatar",
]

missing = [item for item in required if item not in jsx]
if missing:
    raise RuntimeError(
        f"This does not look like the active ProjectCardV2 file. Missing: {missing}. No changes written."
    )

changes = []

def replace_once(label, old, new, required=False):
    global jsx
    if new in jsx:
        changes.append(f"{label}: already present")
        return

    if old not in jsx:
        msg = f"{label}: not found"
        if required:
            raise RuntimeError(
                f"Required patch target not found: {label}. No changes written.\n"
                "Run this and paste the output:\n"
                "grep -n \"group relative overflow-hidden\\|SignalChip\\|primaryCue\\|Progress\\|border-t\" src/components/projects/ProjectCardV2.jsx"
            )
        changes.append(msg)
        return

    jsx = jsx.replace(old, new, 1)
    changes.append(f"{label}: patched")

# 1) Main V2 card shell — REQUIRED
replace_once(
    "main card shell",
    "group relative overflow-hidden rounded-2xl cursor-pointer flex flex-col justify-between",
    "project-card-v2-shell group relative overflow-hidden rounded-2xl cursor-pointer flex flex-col justify-between",
    required=True,
)

# 2) Signal chips: Momentum / Risk / Activity
replace_once(
    "signal chips",
    "flex items-center gap-2 rounded-lg border px-2.5 py-2 min-w-0 ${toneClasses[tone] || toneClasses.neutral}",
    "project-card-v2-signal project-card-v2-signal-${tone} flex items-center gap-2 rounded-lg border px-2.5 py-2 min-w-0 ${toneClasses[tone] || toneClasses.neutral}",
)

# 3) State badge: Strong / Completed / Blocked / etc.
replace_once(
    "state badge",
    "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stateBadgeClasses[stateMeta.tone]}",
    "project-card-v2-state-badge project-card-v2-state-${stateMeta.tone} shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stateBadgeClasses[stateMeta.tone]}",
)

# 4) Primary cue block: READY / BLOCKED / NEXT MOVE
replace_once(
    "primary cue",
    "rounded-xl border p-3.5 mb-4",
    "project-card-v2-cue project-card-v2-cue-${primaryCue.tone} rounded-xl border p-3.5 mb-4",
)

# 5) Progress strip
replace_once(
    "progress strip",
    '<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">',
    '<div className="project-card-v2-progress rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">',
)

# 6) Footer
replace_once(
    "footer",
    '<div className="px-5 py-4 border-t border-slate-100 bg-white/80">',
    '<div className="project-card-v2-footer px-5 py-4 border-t border-slate-100 bg-white/80">',
)

marker = "PROJECT CARD V2 DARKMODE SAFE v1"

if marker in css:
    start = css.find("/* =========================================================\n   PROJECT CARD V2 DARKMODE SAFE v1")
    end = css.find("/* END PROJECT CARD V2 DARKMODE SAFE v1 */", start)
    if start != -1 and end != -1:
        end += len("/* END PROJECT CARD V2 DARKMODE SAFE v1 */")
        css = css[:start].rstrip() + "\n\n" + css[end:].lstrip()

css_patch = r'''
/* =========================================================
   PROJECT CARD V2 DARKMODE SAFE v1
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
    radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.26), transparent 38%),
    radial-gradient(circle at 92% 12%, rgba(45, 212, 191, 0.16), transparent 36%),
    linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(8, 13, 25, 0.96)) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: #f8fafc !important;
  box-shadow:
    0 24px 58px rgba(0, 0, 0, 0.42),
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
  border-color: rgba(167, 139, 250, 0.46) !important;
  box-shadow:
    0 30px 72px rgba(0, 0, 0, 0.50),
    0 0 0 1px rgba(167, 139, 250, 0.18),
    0 0 36px rgba(139, 92, 246, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.14) !important;
}

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
  color: rgba(226, 232, 240, 0.80) !important;
}

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
  border-color: rgba(52, 211, 153, 0.50) !important;
  background: rgba(16, 185, 129, 0.13) !important;
}

html.dark .project-card-v2-state-red,
html[data-theme="dark"] .project-card-v2-state-red,
body.dark .project-card-v2-state-red {
  color: #fca5a5 !important;
  border-color: rgba(248, 113, 113, 0.52) !important;
  background: rgba(239, 68, 68, 0.13) !important;
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

html.dark .project-card-v2-cue,
html[data-theme="dark"] .project-card-v2-cue,
body.dark .project-card-v2-cue {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 42%),
    rgba(255, 255, 255, 0.055) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 14px 28px rgba(0, 0, 0, 0.20);
}

html.dark .project-card-v2-cue > div:last-child,
html[data-theme="dark"] .project-card-v2-cue > div:last-child,
body.dark .project-card-v2-cue > div:last-child {
  color: rgba(248, 250, 252, 0.94) !important;
}

html.dark .project-card-v2-signal,
html[data-theme="dark"] .project-card-v2-signal,
body.dark .project-card-v2-signal {
  background: rgba(255, 255, 255, 0.055) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: rgba(248, 250, 252, 0.92) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.09),
    0 10px 22px rgba(0, 0, 0, 0.18);
}

html.dark .project-card-v2-signal-emerald,
html[data-theme="dark"] .project-card-v2-signal-emerald,
body.dark .project-card-v2-signal-emerald {
  border-color: rgba(52, 211, 153, 0.46) !important;
  color: #6ee7b7 !important;
  background:
    radial-gradient(circle at 10% 0%, rgba(16, 185, 129, 0.22), transparent 42%),
    rgba(6, 78, 59, 0.24) !important;
}

html.dark .project-card-v2-signal-violet,
html[data-theme="dark"] .project-card-v2-signal-violet,
body.dark .project-card-v2-signal-violet {
  border-color: rgba(167, 139, 250, 0.46) !important;
  color: #c4b5fd !important;
  background:
    radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.22), transparent 42%),
    rgba(76, 29, 149, 0.20) !important;
}

html.dark .project-card-v2-signal-blue,
html[data-theme="dark"] .project-card-v2-signal-blue,
body.dark .project-card-v2-signal-blue {
  border-color: rgba(96, 165, 250, 0.42) !important;
  color: #93c5fd !important;
  background:
    radial-gradient(circle at 10% 0%, rgba(59, 130, 246, 0.20), transparent 42%),
    rgba(30, 64, 175, 0.16) !important;
}

html.dark .project-card-v2-signal-red,
html[data-theme="dark"] .project-card-v2-signal-red,
body.dark .project-card-v2-signal-red {
  border-color: rgba(248, 113, 113, 0.48) !important;
  color: #fca5a5 !important;
  background:
    radial-gradient(circle at 10% 0%, rgba(239, 68, 68, 0.24), transparent 42%),
    rgba(127, 29, 29, 0.20) !important;
}

html.dark .project-card-v2-progress,
html[data-theme="dark"] .project-card-v2-progress,
body.dark .project-card-v2-progress {
  background: rgba(255, 255, 255, 0.045) !important;
  border-color: rgba(255, 255, 255, 0.11) !important;
}

html.dark .project-card-v2-progress span,
html[data-theme="dark"] .project-card-v2-progress span,
body.dark .project-card-v2-progress span {
  color: rgba(248, 250, 252, 0.88) !important;
}

html.dark .project-card-v2-progress .bg-slate-200,
html[data-theme="dark"] .project-card-v2-progress .bg-slate-200,
body.dark .project-card-v2-progress .bg-slate-200 {
  background: rgba(255, 255, 255, 0.12) !important;
}

html.dark .project-card-v2-footer,
html[data-theme="dark"] .project-card-v2-footer,
body.dark .project-card-v2-footer {
  background: rgba(2, 6, 23, 0.38) !important;
  border-top-color: rgba(255, 255, 255, 0.09) !important;
  backdrop-filter: blur(14px);
}

html.dark .project-card-v2-footer .rounded-full,
html[data-theme="dark"] .project-card-v2-footer .rounded-full,
body.dark .project-card-v2-footer .rounded-full {
  border-color: rgba(15, 23, 42, 0.92) !important;
}

/* END PROJECT CARD V2 DARKMODE SAFE v1 */
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

print("ProjectCardV2 safe dark-mode patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Patch results:")
for item in changes:
    print(f"- {item}")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No project fetching, routing, filtering, sprint, or card click logic changed.")
