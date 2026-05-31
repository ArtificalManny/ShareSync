from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/components/Sidebar.jsx")
if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-before-wordmark-dark-fix-{stamp}")
shutil.copy2(path, backup)

text = path.read_text()

if "openshare-sidebar-wordmark" not in text:
    raise RuntimeError("Could not find openshare-sidebar-wordmark in Sidebar.jsx")

# 1) Make the JSX class itself more resilient in Tailwind dark mode.
old_class = "openshare-sidebar-wordmark text-sm font-extrabold text-slate-950"
new_class = "openshare-sidebar-wordmark text-[15px] font-black text-slate-950 dark:text-white"

if old_class in text:
    text = text.replace(old_class, new_class, 1)

# 2) Add explicit app-theme selectors.
# This fixes manual dark mode, not just OS/browser dark mode.
dark_fix_marker = "/* FIX: Sidebar wordmark follows manual app dark mode */"

if dark_fix_marker not in text:
    insert_before = "        @media (prefers-color-scheme: dark) {"
    if insert_before not in text:
        raise RuntimeError("Could not find the dark media block to insert before.")

    dark_fix = f"""
        {dark_fix_marker}
        html.dark #app-sidebar .openshare-sidebar-wordmark,
        html[data-theme="dark"] #app-sidebar .openshare-sidebar-wordmark,
        [data-theme="dark"] #app-sidebar .openshare-sidebar-wordmark {{
          color: #f8fafc !important;
          -webkit-text-fill-color: #f8fafc !important;
          opacity: 1 !important;
          font-size: 15px !important;
          line-height: 1rem !important;
          font-weight: 950 !important;
          letter-spacing: -0.015em !important;
          text-shadow:
            0 0 1px rgba(255, 255, 255, 0.95),
            0 0 16px rgba(139, 92, 246, 0.58),
            0 2px 12px rgba(0, 0, 0, 0.65) !important;
        }}

        html.dark #app-sidebar .sidebar-brand-zone,
        html[data-theme="dark"] #app-sidebar .sidebar-brand-zone,
        [data-theme="dark"] #app-sidebar .sidebar-brand-zone {{
          background:
            radial-gradient(circle at 42% 35%, rgba(139, 92, 246, 0.16), transparent 44%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent) !important;
        }}

"""
    text = text.replace(insert_before, dark_fix + insert_before, 1)

path.write_text(text)

print("✅ Sidebar OpenShare wordmark dark-mode visibility fixed.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- OpenShare wordmark is now brighter in manual dark mode")
print("- Added html.dark and data-theme='dark' selectors")
print("- Kept sidebar routing, auto-hide, localStorage, and layout logic untouched")
print("")
print("Next:")
print("1. Restart Vite if needed")
print("2. Hard refresh Chrome: Cmd+Shift+R")
