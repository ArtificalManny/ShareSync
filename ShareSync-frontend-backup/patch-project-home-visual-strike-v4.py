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
    FILE_PATH.suffix + f".backup-project-home-visual-strike-v4-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
shutil.copy2(FILE_PATH, backup_path)

unsafe_patterns = [
    "onClick={() =",
    "className={()",
    "className=}",
    "undefined undefined",
]

before_counts = {bad: original.count(bad) for bad in unsafe_patterns}


def find_tag_end(source, start_index):
    quote = None
    brace_depth = 0

    for i in range(start_index, len(source)):
        ch = source[i]

        if quote:
            if ch == quote and source[i - 1] != "\\":
                quote = None
            continue

        if ch in ('"', "'", "`"):
            quote = ch
            continue

        if ch == "{":
            brace_depth += 1
            continue

        if ch == "}":
            brace_depth = max(0, brace_depth - 1)
            continue

        if ch == ">" and brace_depth == 0:
            return i

    return -1


show_debug_index = text.find("{SHOW_DEBUG && (")
if show_debug_index == -1:
    raise RuntimeError("Could not find SHOW_DEBUG anchor. No changes were written.")

return_index = text.rfind("return (", 0, show_debug_index)
if return_index == -1:
    return_index = text.rfind("return(", 0, show_debug_index)

if return_index == -1:
    raise RuntimeError("Could not find the ProjectHome return block. No changes were written.")

root_start = text.find("<div", return_index, show_debug_index)
if root_start == -1:
    raise RuntimeError("Could not find the first ProjectHome root div after return. No changes were written.")

root_end = find_tag_end(text, root_start)
if root_end == -1:
    raise RuntimeError("Could not find the ProjectHome root opening tag end. No changes were written.")

root_tag = text[root_start:root_end + 1]
new_root_tag = root_tag

scope_classes = "project-home-visual-scope relative overflow-x-hidden"

if "project-home-visual-scope" not in root_tag:
    double_match = re.search(r'className="([^"]*)"', root_tag)
    single_match = re.search(r"className='([^']*)'", root_tag)
    template_match = re.search(r"className=\{`([^`]*)`\}", root_tag)

    if double_match:
        current = double_match.group(1)
        updated = f'className="{scope_classes} {current}"'
        new_root_tag = root_tag[:double_match.start()] + updated + root_tag[double_match.end():]

    elif single_match:
        current = single_match.group(1)
        updated = f"className='{scope_classes} {current}'"
        new_root_tag = root_tag[:single_match.start()] + updated + root_tag[single_match.end():]

    elif template_match:
        current = template_match.group(1)
        updated = f"className={{`{scope_classes} {current}`}}"
        new_root_tag = root_tag[:template_match.start()] + updated + root_tag[template_match.end():]

    elif "className=" not in root_tag:
        new_root_tag = root_tag[:-1] + f' className="{scope_classes}">'

    else:
        raise RuntimeError(
            "Found root div, but className uses a complex expression. "
            "No changes were written. Paste 30 lines around the main return block."
        )

text = text[:root_start] + new_root_tag + text[root_end + 1:]
insert_after_root = root_start + len(new_root_tag)

style_block = r'''
      <style className="project-home-visual-style">{`
        .project-home-visual-scope {
          isolation: isolate;
          background:
            radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.14), transparent 30%),
            radial-gradient(circle at 88% 6%, rgba(45, 212, 191, 0.14), transparent 34%),
            linear-gradient(180deg, #f8fafc 0%, #eef4f8 100%) !important;
        }

        .dark .project-home-visual-scope {
          background:
            radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.24), transparent 34%),
            radial-gradient(circle at 88% 6%, rgba(34, 211, 238, 0.17), transparent 36%),
            radial-gradient(circle at 72% 86%, rgba(16, 185, 129, 0.10), transparent 36%),
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
          mask-image: linear-gradient(to bottom, transparent 0%, black 14%, black 84%, transparent 100%);
        }

        .dark .project-home-visual-scope::before {
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.045) 1px, transparent 1px);
        }

        .project-home-visual-scope::after {
          content: "";
          position: fixed;
          right: -16rem;
          bottom: -18rem;
          width: 42rem;
          height: 42rem;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.18), transparent 64%);
          filter: blur(26px);
        }

        .project-home-visual-scope > * {
          position: relative;
          z-index: 1;
        }

        .project-home-visual-scope header {
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.84), rgba(248, 250, 252, 0.70)),
            radial-gradient(circle at 90% 10%, rgba(45, 212, 191, 0.16), transparent 36%),
            radial-gradient(circle at 8% 10%, rgba(139, 92, 246, 0.13), transparent 34%) !important;
          border-bottom: 1px solid rgba(148, 163, 184, 0.28) !important;
          box-shadow: 0 22px 55px rgba(15, 23, 42, 0.09);
          backdrop-filter: blur(22px);
        }

        .dark .project-home-visual-scope header {
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.86)),
            radial-gradient(circle at 88% 12%, rgba(45, 212, 191, 0.15), transparent 35%),
            radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.20), transparent 38%) !important;
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.32);
        }

        .project-home-visual-scope header::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -1px;
          height: 2px;
          background: linear-gradient(90deg, #8b5cf6 0%, #22d3ee 52%, #34d399 100%);
          opacity: 0.95;
        }

        .project-home-visual-scope header h1 {
          letter-spacing: -0.045em;
          text-shadow: 0 14px 34px rgba(15, 23, 42, 0.12);
        }

        .project-home-visual-scope nav {
          background: rgba(255, 255, 255, 0.72) !important;
          border-bottom: 1px solid rgba(148, 163, 184, 0.24) !important;
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.07);
          backdrop-filter: blur(22px);
        }

        .dark .project-home-visual-scope nav {
          background: rgba(15, 23, 42, 0.78) !important;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.26);
        }

        .project-home-visual-scope nav button[title] {
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease,
            background 180ms ease;
        }

        .project-home-visual-scope nav button[title]:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 28px rgba(124, 58, 237, 0.10);
        }

        .project-home-visual-scope nav button[title] .absolute {
          height: 3px !important;
          background: linear-gradient(90deg, #8b5cf6, #22d3ee) !important;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.55);
        }

        .project-home-visual-scope main {
          position: relative;
          min-height: 60vh;
        }

        .project-home-visual-scope main::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 8% 8%, rgba(139, 92, 246, 0.08), transparent 26%),
            radial-gradient(circle at 92% 16%, rgba(45, 212, 191, 0.08), transparent 30%);
          z-index: -1;
        }

        @media (max-width: 900px) {
          .project-home-visual-scope header,
          .project-home-visual-scope nav {
            padding-left: 1.25rem !important;
            padding-right: 1.25rem !important;
          }
        }
      `}</style>
'''

if "project-home-visual-style" not in text:
    text = text[:insert_after_root] + "\n" + style_block + text[insert_after_root:]

after_counts = {bad: text.count(bad) for bad in unsafe_patterns}

for bad in unsafe_patterns:
    if after_counts[bad] > before_counts[bad]:
        FILE_PATH.write_text(original)
        raise RuntimeError(
            f"Patch introduced unsafe JSX pattern: {bad}. Original restored."
        )

FILE_PATH.write_text(text)

print("ProjectHome visual strike v4 patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- ProjectHome root visual scope class")
print("- Scoped ProjectHome visual CSS inside ProjectHome.jsx")
print("")
print("Important:")
print("- Existing unsafe-pattern count was preserved, not increased.")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No hooks were changed.")
print("No state logic was changed.")
print("No child component files were changed.")
