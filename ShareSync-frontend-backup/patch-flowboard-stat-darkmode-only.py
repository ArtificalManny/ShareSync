from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/features/flow/FlowBoard.jsx")

if not path.exists():
    raise FileNotFoundError(f"Missing file: {path}")

original = path.read_text()
stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-flow-stat-darkmode-{stamp}")
shutil.copy2(path, backup)

text = original

required_classes = [
    "flow-stat-motion",
    "flow-stat-review",
    "flow-stat-blocked",
    "flow-stat-done",
]

missing = [cls for cls in required_classes if cls not in text]
if missing:
    raise RuntimeError(f"Missing expected FlowBoard stat classes: {missing}. No changes were written.")

marker = "FLOWBOARD DARK STAT SIGNAL CARDS v1"

# Remove previous copy of this exact patch if present.
if marker in text:
    start = text.find("          /* =========================================================\n             FLOWBOARD DARK STAT SIGNAL CARDS v1")
    end = text.find("          /* END FLOWBOARD DARK STAT SIGNAL CARDS v1 */", start)
    if start != -1 and end != -1:
        end += len("          /* END FLOWBOARD DARK STAT SIGNAL CARDS v1 */")
        text = text[:start].rstrip() + "\n\n" + text[end:].lstrip()

insert_after = """          .flow-stat-total { border-top: 3px solid rgba(100, 116, 139, 0.72) !important; }
          .flow-stat-motion { border-top: 3px solid rgba(139, 92, 246, 0.86) !important; }
          .flow-stat-review { border-top: 3px solid rgba(245, 158, 11, 0.86) !important; }
          .flow-stat-blocked { border-top: 3px solid rgba(244, 63, 94, 0.86) !important; }
          .flow-stat-done { border-top: 3px solid rgba(16, 185, 129, 0.86) !important; }"""

if insert_after not in text:
    raise RuntimeError(
        "Could not find the FlowBoard stat border block. No changes were written.\n"
        "Run this and paste the output:\n"
        "grep -n \"flow-stat-total\\|flow-stat-motion\\|flow-stat-review\\|flow-stat-blocked\\|flow-stat-done\" src/features/flow/FlowBoard.jsx"
    )

patch = r'''
          /* =========================================================
             FLOWBOARD DARK STAT SIGNAL CARDS v1
             Makes Board stat cards readable in dark mode:
             In Motion / Review / Blocked / Done.
             ========================================================= */

          .dark .flow-stat-motion {
            background:
              radial-gradient(circle at 15% 0%, rgba(139, 92, 246, 0.40), transparent 44%),
              linear-gradient(135deg, rgba(30, 27, 75, 0.98), rgba(15, 23, 42, 0.94)) !important;
            border-color: rgba(167, 139, 250, 0.82) !important;
            box-shadow:
              0 18px 42px rgba(0, 0, 0, 0.38),
              inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
          }

          .dark .flow-stat-review {
            background:
              radial-gradient(circle at 15% 0%, rgba(245, 158, 11, 0.42), transparent 44%),
              linear-gradient(135deg, rgba(69, 46, 5, 0.98), rgba(15, 23, 42, 0.94)) !important;
            border-color: rgba(251, 191, 36, 0.90) !important;
            box-shadow:
              0 18px 42px rgba(0, 0, 0, 0.38),
              inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
          }

          .dark .flow-stat-blocked {
            background:
              radial-gradient(circle at 15% 0%, rgba(244, 63, 94, 0.42), transparent 44%),
              linear-gradient(135deg, rgba(76, 5, 25, 0.98), rgba(15, 23, 42, 0.94)) !important;
            border-color: rgba(251, 113, 133, 0.92) !important;
            box-shadow:
              0 18px 42px rgba(0, 0, 0, 0.38),
              inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
          }

          .dark .flow-stat-done {
            background:
              radial-gradient(circle at 15% 0%, rgba(16, 185, 129, 0.38), transparent 44%),
              linear-gradient(135deg, rgba(6, 78, 59, 0.98), rgba(15, 23, 42, 0.94)) !important;
            border-color: rgba(52, 211, 153, 0.90) !important;
            box-shadow:
              0 18px 42px rgba(0, 0, 0, 0.38),
              inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
          }

          .dark .flow-stat-motion::before,
          .dark .flow-stat-review::before,
          .dark .flow-stat-blocked::before,
          .dark .flow-stat-done::before {
            opacity: 0.45 !important;
            background:
              radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.18), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.06), transparent 62%) !important;
          }

          .dark .flow-stat-motion div:first-child {
            color: #c4b5fd !important;
            text-shadow: 0 0 18px rgba(139, 92, 246, 0.42);
          }

          .dark .flow-stat-review div:first-child {
            color: #fbbf24 !important;
            text-shadow: 0 0 18px rgba(245, 158, 11, 0.42);
          }

          .dark .flow-stat-blocked div:first-child {
            color: #fb7185 !important;
            text-shadow: 0 0 18px rgba(244, 63, 94, 0.42);
          }

          .dark .flow-stat-done div:first-child {
            color: #34d399 !important;
            text-shadow: 0 0 18px rgba(16, 185, 129, 0.42);
          }

          .dark .flow-stat-motion div:last-child,
          .dark .flow-stat-review div:last-child,
          .dark .flow-stat-blocked div:last-child,
          .dark .flow-stat-done div:last-child {
            color: #ffffff !important;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.16);
          }

          /* END FLOWBOARD DARK STAT SIGNAL CARDS v1 */'''

text = text.replace(insert_after, insert_after + "\n\n" + patch, 1)

for bad in ["onClick={() =", "className={}"]:
    if bad in text and bad not in original:
        path.write_text(original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

if marker not in text:
    path.write_text(original)
    raise RuntimeError("Patch marker was not added. Original restored.")

path.write_text(text)

print("FlowBoard dark stat card patch applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Dark-mode styling for In Motion / Review / Blocked / Done stat cards")
print("")
print("No JSX structure changed.")
print("No backend files touched.")
print("No API calls changed.")
print("No board task movement, fetching, filtering, or status logic changed.")
