from pathlib import Path
from datetime import datetime
import shutil

jsx_path = Path("src/pages/Discover.jsx")
css_path = Path("src/index.css")

if not jsx_path.exists():
    raise FileNotFoundError(f"Missing file: {jsx_path}")

if not css_path.exists():
    raise FileNotFoundError(f"Missing file: {css_path}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

jsx_original = jsx_path.read_text()
css_original = css_path.read_text()

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-public-signals-darkmode-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-public-signals-darkmode-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_original
css = css_original

required = [
    "Latest Public Signals",
    "<ActivityFeed activities={publicActivities} />",
]

missing = [item for item in required if item not in jsx]
if missing:
    raise RuntimeError(
        f"Could not verify Discover Latest Public Signals structure. Missing: {missing}. No changes written."
    )

if "discover-public-signals-panel" not in jsx:
    label_index = jsx.find("Latest Public Signals")
    section_index = jsx.rfind("<section", 0, label_index)

    if section_index == -1:
        raise RuntimeError(
            "Could not find the opening <section> for Latest Public Signals. No changes written."
        )

    class_start = jsx.find('className="', section_index)
    class_end = jsx.find('"', class_start + len('className="'))

    if class_start == -1 or class_end == -1 or class_start > label_index:
        raise RuntimeError(
            "Could not find the className for the Latest Public Signals section. No changes written."
        )

    class_value_start = class_start + len('className="')
    existing_classes = jsx[class_value_start:class_end]

    updated_classes = "discover-public-signals-panel " + existing_classes
    jsx = jsx[:class_value_start] + updated_classes + jsx[class_end:]

marker = "DISCOVER PUBLIC SIGNALS DARK CARDS v1"

if marker in css:
    start = css.find("/* =========================================================\n   DISCOVER PUBLIC SIGNALS DARK CARDS v1")
    end = css.find("/* END DISCOVER PUBLIC SIGNALS DARK CARDS v1 */", start)
    if start != -1 and end != -1:
        end += len("/* END DISCOVER PUBLIC SIGNALS DARK CARDS v1 */")
        css = css[:start].rstrip() + "\n\n" + css[end:].lstrip()

css_patch = r'''
/* =========================================================
   DISCOVER PUBLIC SIGNALS DARK CARDS v1
   Discover > Latest Public Signals:
   Activity card + Your Progress card dark-mode polish.
   ========================================================= */

.discover-public-signals-panel {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

html.dark .discover-public-signals-panel,
html[data-theme="dark"] .discover-public-signals-panel,
body.dark .discover-public-signals-panel {
  background:
    radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.16), transparent 34%),
    radial-gradient(circle at 90% 18%, rgba(34, 211, 238, 0.10), transparent 34%),
    rgba(15, 15, 20, 0.88) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow:
    0 22px 56px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

/* The large white feed cards inside Latest Public Signals */
html.dark .discover-public-signals-panel [class*="bg-white"][class*="rounded"],
html[data-theme="dark"] .discover-public-signals-panel [class*="bg-white"][class*="rounded"],
body.dark .discover-public-signals-panel [class*="bg-white"][class*="rounded"] {
  background:
    radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.22), transparent 38%),
    radial-gradient(circle at 92% 12%, rgba(45, 212, 191, 0.14), transparent 36%),
    linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(10, 10, 14, 0.96)) !important;
  border: 1px solid rgba(255, 255, 255, 0.10) !important;
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
  color: #f8fafc !important;
}

/* Keep small icon pills readable instead of washed out */
html.dark .discover-public-signals-panel [class*="bg-slate-"],
html[data-theme="dark"] .discover-public-signals-panel [class*="bg-slate-"],
body.dark .discover-public-signals-panel [class*="bg-slate-"] {
  background: rgba(255, 255, 255, 0.07) !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
}

/* Fix faint gray text inside the activity/progress cards */
html.dark .discover-public-signals-panel [class*="text-slate-"],
html.dark .discover-public-signals-panel [class*="text-zinc-"],
html.dark .discover-public-signals-panel [class*="text-gray-"],
html[data-theme="dark"] .discover-public-signals-panel [class*="text-slate-"],
html[data-theme="dark"] .discover-public-signals-panel [class*="text-zinc-"],
html[data-theme="dark"] .discover-public-signals-panel [class*="text-gray-"],
body.dark .discover-public-signals-panel [class*="text-slate-"],
body.dark .discover-public-signals-panel [class*="text-zinc-"],
body.dark .discover-public-signals-panel [class*="text-gray-"] {
  color: rgba(248, 250, 252, 0.76) !important;
}

/* Headings, usernames, numbers, and labels */
html.dark .discover-public-signals-panel h1,
html.dark .discover-public-signals-panel h2,
html.dark .discover-public-signals-panel h3,
html.dark .discover-public-signals-panel h4,
html.dark .discover-public-signals-panel strong,
html.dark .discover-public-signals-panel .font-bold,
html.dark .discover-public-signals-panel .font-black,
html[data-theme="dark"] .discover-public-signals-panel h1,
html[data-theme="dark"] .discover-public-signals-panel h2,
html[data-theme="dark"] .discover-public-signals-panel h3,
html[data-theme="dark"] .discover-public-signals-panel h4,
html[data-theme="dark"] .discover-public-signals-panel strong,
html[data-theme="dark"] .discover-public-signals-panel .font-bold,
html[data-theme="dark"] .discover-public-signals-panel .font-black,
body.dark .discover-public-signals-panel h1,
body.dark .discover-public-signals-panel h2,
body.dark .discover-public-signals-panel h3,
body.dark .discover-public-signals-panel h4,
body.dark .discover-public-signals-panel strong,
body.dark .discover-public-signals-panel .font-bold,
body.dark .discover-public-signals-panel .font-black {
  color: #ffffff !important;
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.10);
}

/* Preserve accent colors while making them glow slightly */
html.dark .discover-public-signals-panel .text-violet-500,
html.dark .discover-public-signals-panel .text-violet-600,
html.dark .discover-public-signals-panel .text-violet-700 {
  color: #c4b5fd !important;
}

html.dark .discover-public-signals-panel .text-emerald-500,
html.dark .discover-public-signals-panel .text-emerald-600,
html.dark .discover-public-signals-panel .text-emerald-700 {
  color: #34d399 !important;
}

html.dark .discover-public-signals-panel .text-amber-500,
html.dark .discover-public-signals-panel .text-amber-600,
html.dark .discover-public-signals-panel .text-amber-700 {
  color: #fbbf24 !important;
}

/* Progress bars / tiny separators should not vanish */
html.dark .discover-public-signals-panel [class*="bg-amber-"],
html.dark .discover-public-signals-panel [class*="bg-orange-"],
html.dark .discover-public-signals-panel [class*="bg-red-"],
html.dark .discover-public-signals-panel [class*="bg-violet-"],
html.dark .discover-public-signals-panel [class*="bg-emerald-"],
html.dark .discover-public-signals-panel [class*="bg-cyan-"] {
  opacity: 1 !important;
}

/* END DISCOVER PUBLIC SIGNALS DARK CARDS v1 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

for bad in ["onClick={() =", "className={}"]:
    if bad in jsx and bad not in jsx_original:
        jsx_path.write_text(jsx_original)
        css_path.write_text(css_original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

if "discover-public-signals-panel" not in jsx or marker not in css:
    jsx_path.write_text(jsx_original)
    css_path.write_text(css_original)
    raise RuntimeError("Patch incomplete. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Discover public signals dark-mode patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added one scoped class to Discover's Latest Public Signals section")
print("- Added dark-mode CSS for the activity card and Your Progress card inside that section")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No ActivityFeed.jsx changes.")
print("No Achievements.jsx changes.")
print("No discovery feed, loading, stats, or routing logic changed.")
