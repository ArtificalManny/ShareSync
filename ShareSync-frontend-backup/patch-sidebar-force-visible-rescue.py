from pathlib import Path
from datetime import datetime

path = Path("src/components/Sidebar.jsx")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".backup-sidebar-force-visible-rescue-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

start_marker = "      <style>{`"
end_marker = "      `}</style>"

if start_marker not in text:
    raise RuntimeError("Could not find Sidebar style block. No changes were written.")

start = text.index(start_marker) + len(start_marker)

rescue_css = r'''

        /* TEMP RESCUE: force Sidebar visible again after visual patch issue */
        #app-sidebar {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          transform: translateX(0) !important;
          translate: 0 0 !important;
          left: 0 !important;
          z-index: 80 !important;
          background:
            radial-gradient(circle at 22% 12%, rgba(139, 92, 246, 0.10), transparent 34%),
            radial-gradient(circle at 82% 28%, rgba(34, 211, 238, 0.08), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.94)) !important;
          border-right: 1px solid rgba(203, 213, 225, 0.86) !important;
          box-shadow: 18px 0 50px rgba(15, 23, 42, 0.06) !important;
        }

        #app-sidebar > * {
          visibility: visible !important;
          opacity: 1 !important;
        }

        #app-sidebar a,
        #app-sidebar button {
          opacity: 1 !important;
          visibility: visible !important;
        }

        #app-sidebar span,
        #app-sidebar svg {
          opacity: 1 !important;
          visibility: visible !important;
        }

        #app-sidebar a[aria-current="page"],
        #app-sidebar a[aria-current="true"],
        #app-sidebar .active {
          background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,243,255,0.96)) !important;
          border: 1px solid rgba(196, 181, 253, 0.95) !important;
          box-shadow:
            0 16px 36px rgba(139, 92, 246, 0.16),
            0 0 0 4px rgba(139, 92, 246, 0.08),
            inset 0 1px 0 rgba(255,255,255,0.95) !important;
        }

'''

if rescue_css.strip() in text:
    raise RuntimeError("Rescue CSS already exists. No changes were written.")

text = text[:start] + rescue_css + text[start:]

bad_patterns = [
    "onClick={() =",
    "className={` =",
    "className={ =",
]

for bad in bad_patterns:
    if bad in text:
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. No changes were written.")

path.write_text(text)

print("Sidebar force-visible rescue patch applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Added force-visible rescue CSS inside Sidebar.jsx")
print("")
print("Did NOT change:")
print("- routes")
print("- nav labels")
print("- localStorage")
print("- React state")
print("- backend files")
