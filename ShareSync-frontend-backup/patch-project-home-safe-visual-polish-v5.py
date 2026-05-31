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
    FILE_PATH.suffix + f".backup-project-home-safe-visual-polish-v5-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
shutil.copy2(FILE_PATH, backup_path)

unsafe_patterns = [
    "onClick={() =",
    "className={()",
    "className=}",
    "undefined undefined",
]

before_counts = {bad: original.count(bad) for bad in unsafe_patterns}

# Remove old failed ProjectHome visual artifacts if they are still present.
text = re.sub(
    r'\s*<style className="project-home-visual-style">\{`.*?`\}</style>\s*',
    "\n",
    text,
    flags=re.DOTALL,
)

text = text.replace("project-home-visual-scope ", "")
text = text.replace(" project-home-visual-scope", "")
text = text.replace("project-home-visual-scope", "")

# Remove previous safe style block if rerunning.
text = re.sub(
    r'\s*<style className="project-home-safe-visual-polish-v5-style">\{`.*?`\}</style>\s*',
    "\n",
    text,
    flags=re.DOTALL,
)

# Find the main returned root div without modifying layout classes.
show_debug_index = text.find("{SHOW_DEBUG && (")
if show_debug_index == -1:
    raise RuntimeError("Could not find SHOW_DEBUG anchor. No changes were written.")

return_index = text.rfind("return (", 0, show_debug_index)
if return_index == -1:
    return_index = text.rfind("return(", 0, show_debug_index)

if return_index == -1:
    raise RuntimeError("Could not find ProjectHome return block. No changes were written.")

root_start = text.find("<div", return_index, show_debug_index)
if root_start == -1:
    raise RuntimeError("Could not find ProjectHome root div. No changes were written.")

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

root_end = find_tag_end(text, root_start)
if root_end == -1:
    raise RuntimeError("Could not find ProjectHome root opening tag end. No changes were written.")

root_tag = text[root_start:root_end + 1]

if 'data-project-home-polish="safe-v5"' not in root_tag:
    root_tag_updated = root_tag[:-1] + ' data-project-home-polish="safe-v5">'
    text = text[:root_start] + root_tag_updated + text[root_end + 1:]
    insert_after = root_start + len(root_tag_updated)
else:
    insert_after = root_end + 1

style_block = r'''
      <style className="project-home-safe-visual-polish-v5-style">{`
        /*
          ProjectHome Safe Visual Polish v5

          Rules:
          - No layout changes.
          - No margin/padding changes.
          - No height/min-height changes.
          - No fixed/absolute positioning.
          - No broad child repositioning.
          - Visual-only: background, shadow, border, text contrast, glow.
        */

        [data-project-home-polish="safe-v5"] {
          background:
            radial-gradient(circle at 10% 8%, rgba(139, 92, 246, 0.10), transparent 30%),
            radial-gradient(circle at 92% 10%, rgba(45, 212, 191, 0.12), transparent 34%),
            linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(239, 246, 255, 0.92)) !important;
        }

        .dark [data-project-home-polish="safe-v5"] {
          background:
            radial-gradient(circle at 10% 8%, rgba(139, 92, 246, 0.18), transparent 32%),
            radial-gradient(circle at 92% 10%, rgba(45, 212, 191, 0.14), transparent 34%),
            linear-gradient(180deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.96)) !important;
        }

        [data-project-home-polish="safe-v5"] header {
          background-image:
            linear-gradient(135deg, rgba(255, 255, 255, 0.76), rgba(248, 250, 252, 0.62)),
            radial-gradient(circle at 92% 12%, rgba(34, 211, 238, 0.14), transparent 36%),
            radial-gradient(circle at 8% 10%, rgba(139, 92, 246, 0.13), transparent 34%) !important;
          border-color: rgba(148, 163, 184, 0.30) !important;
          box-shadow:
            0 18px 48px rgba(15, 23, 42, 0.08),
            inset 0 -1px 0 rgba(255, 255, 255, 0.58) !important;
          backdrop-filter: blur(18px) saturate(1.12);
        }

        .dark [data-project-home-polish="safe-v5"] header {
          background-image:
            linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.82)),
            radial-gradient(circle at 92% 12%, rgba(34, 211, 238, 0.13), transparent 36%),
            radial-gradient(circle at 8% 10%, rgba(139, 92, 246, 0.18), transparent 34%) !important;
          border-color: rgba(148, 163, 184, 0.22) !important;
          box-shadow:
            0 18px 48px rgba(0, 0, 0, 0.28),
            inset 0 -1px 0 rgba(255, 255, 255, 0.06) !important;
        }

        [data-project-home-polish="safe-v5"] header h1,
        [data-project-home-polish="safe-v5"] header h2 {
          text-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
        }

        [data-project-home-polish="safe-v5"] nav {
          background-image:
            linear-gradient(135deg, rgba(255, 255, 255, 0.74), rgba(241, 245, 249, 0.58)) !important;
          border-color: rgba(148, 163, 184, 0.28) !important;
          box-shadow:
            0 14px 34px rgba(15, 23, 42, 0.065),
            inset 0 1px 0 rgba(255, 255, 255, 0.58) !important;
          backdrop-filter: blur(18px) saturate(1.12);
        }

        .dark [data-project-home-polish="safe-v5"] nav {
          background-image:
            linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(2, 6, 23, 0.76)) !important;
          border-color: rgba(148, 163, 184, 0.20) !important;
          box-shadow:
            0 14px 34px rgba(0, 0, 0, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
        }

        [data-project-home-polish="safe-v5"] nav button,
        [data-project-home-polish="safe-v5"] nav a {
          transition:
            color 180ms ease,
            background-color 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease,
            filter 180ms ease;
        }

        [data-project-home-polish="safe-v5"] nav button:hover,
        [data-project-home-polish="safe-v5"] nav a:hover {
          filter: saturate(1.12);
          text-shadow: 0 8px 22px rgba(124, 58, 237, 0.16);
        }

        [data-project-home-polish="safe-v5"] nav button[aria-selected="true"],
        [data-project-home-polish="safe-v5"] nav button[aria-current="page"],
        [data-project-home-polish="safe-v5"] nav a[aria-current="page"] {
          background-image:
            linear-gradient(135deg, rgba(139, 92, 246, 0.14), rgba(34, 211, 238, 0.08)) !important;
          border-color: rgba(167, 139, 250, 0.52) !important;
          box-shadow:
            0 12px 30px rgba(124, 58, 237, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.70) !important;
        }

        [data-project-home-polish="safe-v5"] [class*="from-violet"],
        [data-project-home-polish="safe-v5"] [class*="from-purple"] {
          box-shadow:
            0 14px 34px rgba(124, 58, 237, 0.20),
            inset 0 1px 0 rgba(255, 255, 255, 0.26);
        }

        [data-project-home-polish="safe-v5"] [class*="border-purple"],
        [data-project-home-polish="safe-v5"] [class*="border-violet"] {
          box-shadow:
            0 0 0 1px rgba(196, 181, 253, 0.18),
            0 12px 30px rgba(124, 58, 237, 0.08);
        }
      `}</style>
'''

if "project-home-safe-visual-polish-v5-style" not in text:
    text = text[:insert_after] + "\n" + style_block + text[insert_after:]

after_counts = {bad: text.count(bad) for bad in unsafe_patterns}

for bad in unsafe_patterns:
    if after_counts[bad] > before_counts[bad]:
        FILE_PATH.write_text(original)
        raise RuntimeError(
            f"Patch introduced unsafe JSX pattern: {bad}. Original restored."
        )

FILE_PATH.write_text(text)

print("ProjectHome safe visual polish v5 applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Added data-project-home-polish='safe-v5' to ProjectHome root")
print("- Added scoped visual-only CSS inside ProjectHome.jsx")
print("")
print("Safety rules:")
print("- No margin changes")
print("- No padding changes")
print("- No height or min-height changes")
print("- No fixed/absolute positioning")
print("- No broad > * child positioning")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No hooks were changed.")
print("No state logic was changed.")
print("No child component files were changed.")
