from pathlib import Path
from datetime import datetime
import shutil
import re

FILE_PATH = Path("src/pages/ProjectHome.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

text = FILE_PATH.read_text()
original = text

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-project-home-visual-strike-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
shutil.copy2(FILE_PATH, backup_path)

# ─────────────────────────────────────────────────────────────
# 1. Add root visual scope class flexibly near SHOW_DEBUG
# ─────────────────────────────────────────────────────────────
if "project-home-visual-scope" not in text:
    show_debug_index = text.find("{SHOW_DEBUG && (")
    if show_debug_index == -1:
        raise RuntimeError("Could not find SHOW_DEBUG anchor. No changes were written.")

    root_start = text.rfind('<div className="', 0, show_debug_index)
    if root_start == -1:
        raise RuntimeError("Could not find ProjectHome root div before SHOW_DEBUG. No changes were written.")

    class_start = root_start + len('<div className="')
    class_end = text.find('"', class_start)
    if class_end == -1:
        raise RuntimeError("Could not find ProjectHome root className ending quote. No changes were written.")

    current_classes = text[class_start:class_end]

    if "min-h-screen" not in current_classes:
        raise RuntimeError(
            "Found a div before SHOW_DEBUG, but it does not look like the ProjectHome root. No changes were written."
        )

    new_classes = "project-home-visual-scope relative overflow-x-hidden " + current_classes
    text = text[:class_start] + new_classes + text[class_end:]


# ─────────────────────────────────────────────────────────────
# 2. Insert scoped ProjectHome CSS
# ─────────────────────────────────────────────────────────────
style_block = r'''      <style className="project-home-visual-style">{`
        .project-home-visual-scope {
          isolation: isolate;
          background:
            radial-gradient(circle at 14% 0%, rgba(139, 92, 246, 0.14), transparent 30%),
            radial-gradient(circle at 86% 8%, rgba(45, 212, 191, 0.14), transparent 34%),
            linear-gradient(180deg, #f8fafc 0%, #eef4f8 100%) !important;
        }

        .dark .project-home-visual-scope {
          background:
            radial-gradient(circle at 14% 0%, rgba(139, 92, 246, 0.22), transparent 32%),
            radial-gradient(circle at 86% 8%, rgba(34, 211, 238, 0.16), transparent 34%),
            radial-gradient(circle at 70% 80%, rgba(16, 185, 129, 0.08), transparent 35%),
            linear-gradient(180deg, #070b16 0%, #0f172a 100%) !important;
        }

        .project-home-visual-scope::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image:
            linear-gradient(rgba(99, 102, 241, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.055) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: linear-gradient(to bottom, transparent 0%, black 12%, black 82%, transparent 100%);
        }

        .dark .project-home-visual-scope::before {
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.045) 1px, transparent 1px);
        }

        .project-home-visual-scope::after {
          content: "";
          position: fixed;
          right: -18rem;
          bottom: -18rem;
          width: 42rem;
          height: 42rem;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.18), transparent 62%);
          filter: blur(24px);
        }

        .project-home-visual-scope > * {
          position: relative;
          z-index: 1;
        }

        .project-home-visual-scope > header {
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.84), rgba(248, 250, 252, 0.70)),
            radial-gradient(circle at 90% 10%, rgba(45, 212, 191, 0.16), transparent 36%),
            radial-gradient(circle at 8% 10%, rgba(139, 92, 246, 0.13), transparent 34%) !important;
          border-bottom: 1px solid rgba(148, 163, 184, 0.28) !important;
          box-shadow: 0 22px 55px rgba(15, 23, 42, 0.09);
          backdrop-filter: blur(22px);
        }

        .dark .project-home-visual-scope > header {
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.86)),
            radial-gradient(circle at 88% 12%, rgba(45, 212, 191, 0.15), transparent 35%),
            radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.20), transparent 38%) !important;
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.32);
        }

        .project-home-visual-scope > header::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -1px;
          height: 2px;
          background: linear-gradient(90deg, #8b5cf6 0%, #22d3ee 52%, #34d399 100%);
          opacity: 0.95;
        }

        .project-home-visual-scope > header h1 {
          letter-spacing: -0.045em;
          text-shadow: 0 14px 34px rgba(15, 23, 42, 0.12);
        }

        .project-home-visual-scope > nav {
          background: rgba(255, 255, 255, 0.72) !important;
          border-bottom: 1px solid rgba(148, 163, 184, 0.24) !important;
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.07);
          backdrop-filter: blur(22px);
        }

        .dark .project-home-visual-scope > nav {
          background: rgba(15, 23, 42, 0.78) !important;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.26);
        }

        .project-home-visual-scope > nav button[title]:hover {
          transform: translateY(-1px);
          border-color: rgba(139, 92, 246, 0.16);
          box-shadow: 0 12px 28px rgba(124, 58, 237, 0.08);
        }

        .project-home-visual-scope > nav button[title] .absolute {
          height: 3px !important;
          background: linear-gradient(90deg, #8b5cf6, #22d3ee) !important;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.55);
        }

        .project-home-main-overview > div {
          padding-top: 2.75rem;
        }

        .project-home-main-overview section {
          position: relative;
          overflow: hidden;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.70)),
            radial-gradient(circle at 95% 12%, rgba(45, 212, 191, 0.10), transparent 32%),
            radial-gradient(circle at 4% 4%, rgba(139, 92, 246, 0.09), transparent 32%) !important;
          border: 1px solid rgba(148, 163, 184, 0.24) !important;
          box-shadow:
            0 22px 48px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.70) !important;
          backdrop-filter: blur(18px);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .dark .project-home-main-overview section {
          background:
            linear-gradient(135deg, rgba(17, 24, 39, 0.88), rgba(15, 23, 42, 0.72)),
            radial-gradient(circle at 95% 12%, rgba(45, 212, 191, 0.12), transparent 32%),
            radial-gradient(circle at 4% 4%, rgba(139, 92, 246, 0.16), transparent 34%) !important;
          border-color: rgba(255, 255, 255, 0.075) !important;
          box-shadow:
            0 22px 54px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
        }

        .project-home-main-overview section::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #8b5cf6 0%, #22d3ee 52%, #34d399 100%);
          opacity: 0.92;
        }

        .project-home-main-overview section:hover {
          transform: translateY(-2px);
          border-color: rgba(139, 92, 246, 0.24) !important;
          box-shadow:
            0 28px 70px rgba(15, 23, 42, 0.12),
            0 0 0 1px rgba(139, 92, 246, 0.05) !important;
        }

        .dark .project-home-main-overview section:hover {
          box-shadow:
            0 28px 70px rgba(0, 0, 0, 0.36),
            0 0 0 1px rgba(139, 92, 246, 0.12) !important;
        }

        .project-home-main-overview svg circle[stroke="url(#momentum-grad)"] {
          filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.35));
        }

        .project-home-main-overview article {
          border-color: rgba(148, 163, 184, 0.24) !important;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.78)) !important;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06) !important;
        }

        .dark .project-home-main-overview article {
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.60)) !important;
          border-color: rgba(255, 255, 255, 0.075) !important;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.26) !important;
        }

        @media (max-width: 900px) {
          .project-home-visual-scope > header,
          .project-home-visual-scope > nav {
            padding-left: 1.25rem !important;
            padding-right: 1.25rem !important;
          }

          .project-home-main-overview > div {
            padding: 1.5rem !important;
          }
        }
      `}</style>
'''

if "project-home-visual-style" not in text:
    anchor = "      {SHOW_DEBUG && ("
    if anchor not in text:
        FILE_PATH.write_text(original)
        raise RuntimeError("Could not find SHOW_DEBUG anchor for style insertion. Original restored.")

    text = text.replace(anchor, style_block + "\n" + anchor, 1)


# ─────────────────────────────────────────────────────────────
# 3. Add active-view class to main wrapper
# ─────────────────────────────────────────────────────────────
if "project-home-main project-home-main-" not in text:
    main_pattern = '<main key={pulseRefreshKey}>{renderViewContent()}</main>'
    main_replacement = '<main key={pulseRefreshKey} className={`project-home-main project-home-main-${activeView}`}>{renderViewContent()}</main>'

    if main_pattern in text:
        text = text.replace(main_pattern, main_replacement, 1)
    else:
        # More flexible fallback for whitespace differences
        text, count = re.subn(
            r'<main\s+key=\{pulseRefreshKey\}\s*>\s*\{renderViewContent\(\)\}\s*</main>',
            main_replacement,
            text,
            count=1,
        )

        if count != 1:
            FILE_PATH.write_text(original)
            raise RuntimeError("Could not find pulseRefreshKey main wrapper. Original restored.")


# ─────────────────────────────────────────────────────────────
# 4. Safety checks
# ─────────────────────────────────────────────────────────────
bad_patterns = [
    "onClick={() =",
    "className={()",
    "className=}",
    "undefined undefined",
]

for bad in bad_patterns:
    if bad in text:
        FILE_PATH.write_text(original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

FILE_PATH.write_text(text)

print("ProjectHome visual strike v2 patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- ProjectHome root visual scope class")
print("- Scoped ProjectHome visual CSS inside ProjectHome.jsx")
print("- Main wrapper class for active-view-specific styling")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No hooks were changed.")
print("No state logic was changed.")
print("No child component files were changed.")
