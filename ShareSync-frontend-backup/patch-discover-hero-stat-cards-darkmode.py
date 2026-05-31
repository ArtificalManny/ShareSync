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

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-discover-stat-cards-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-discover-stat-cards-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_original
css = css_original

required = [
    "function NetworkStatCard",
    'label="Signals"',
    'label="Ships"',
    'label="Streak"',
    'tone="emerald"',
    'tone="amber"',
    'tone="violet"',
]

missing = [item for item in required if item not in jsx]
if missing:
    raise RuntimeError(
        f"Could not verify Discover NetworkStatCard structure. Missing: {missing}. No changes written."
    )

old = '''    <div className={`rounded-2xl border px-4 py-3 ${toneClasses[tone] || toneClasses.violet}`}>'''

new = '''    <div className={`discover-network-stat-card discover-network-stat-${tone} rounded-2xl border px-4 py-3 ${toneClasses[tone] || toneClasses.violet}`}>'''

if "discover-network-stat-card" not in jsx:
    if old not in jsx:
        raise RuntimeError(
            "Could not find the NetworkStatCard root div. No changes written.\n"
            "Run this and paste the output:\n"
            "grep -n \"NetworkStatCard\\|rounded-2xl border px-4 py-3\\|Signals\\|Ships\\|Streak\" src/pages/Discover.jsx"
        )

    jsx = jsx.replace(old, new, 1)

marker = "DISCOVER HERO NETWORK STAT CARDS v1"

if marker in css:
    start = css.find("/* =========================================================\n   DISCOVER HERO NETWORK STAT CARDS v1")
    end = css.find("/* END DISCOVER HERO NETWORK STAT CARDS v1 */", start)
    if start != -1 and end != -1:
        end += len("/* END DISCOVER HERO NETWORK STAT CARDS v1 */")
        css = css[:start].rstrip() + "\n\n" + css[end:].lstrip()

css_patch = r'''
/* =========================================================
   DISCOVER HERO NETWORK STAT CARDS v1
   Discover hero: Signals / Ships / Streak dark-mode polish.
   ========================================================= */

.discover-network-stat-card {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  min-height: 76px;
}

.discover-network-stat-card > * {
  position: relative;
  z-index: 1;
}

html.dark .discover-network-stat-card,
html[data-theme="dark"] .discover-network-stat-card,
body.dark .discover-network-stat-card {
  color: #f8fafc !important;
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

html.dark .discover-network-stat-emerald,
html[data-theme="dark"] .discover-network-stat-emerald,
body.dark .discover-network-stat-emerald {
  background:
    radial-gradient(circle at 16% 0%, rgba(16, 185, 129, 0.40), transparent 44%),
    linear-gradient(135deg, rgba(6, 78, 59, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(52, 211, 153, 0.90) !important;
}

html.dark .discover-network-stat-amber,
html[data-theme="dark"] .discover-network-stat-amber,
body.dark .discover-network-stat-amber {
  background:
    radial-gradient(circle at 16% 0%, rgba(251, 191, 36, 0.42), transparent 44%),
    linear-gradient(135deg, rgba(69, 46, 5, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(251, 191, 36, 0.90) !important;
}

html.dark .discover-network-stat-violet,
html[data-theme="dark"] .discover-network-stat-violet,
body.dark .discover-network-stat-violet {
  background:
    radial-gradient(circle at 16% 0%, rgba(139, 92, 246, 0.42), transparent 44%),
    linear-gradient(135deg, rgba(30, 27, 75, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(167, 139, 250, 0.88) !important;
}

html.dark .discover-network-stat-card > div > div:first-child,
html[data-theme="dark"] .discover-network-stat-card > div > div:first-child,
body.dark .discover-network-stat-card > div > div:first-child {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 12px 24px rgba(0, 0, 0, 0.22);
}

html.dark .discover-network-stat-emerald svg,
html[data-theme="dark"] .discover-network-stat-emerald svg,
body.dark .discover-network-stat-emerald svg {
  color: #34d399 !important;
  filter: drop-shadow(0 0 12px rgba(52, 211, 153, 0.35));
}

html.dark .discover-network-stat-amber svg,
html[data-theme="dark"] .discover-network-stat-amber svg,
body.dark .discover-network-stat-amber svg {
  color: #fbbf24 !important;
  filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.35));
}

html.dark .discover-network-stat-violet svg,
html[data-theme="dark"] .discover-network-stat-violet svg,
body.dark .discover-network-stat-violet svg {
  color: #c4b5fd !important;
  filter: drop-shadow(0 0 12px rgba(167, 139, 250, 0.35));
}

html.dark .discover-network-stat-card .tabular-nums,
html[data-theme="dark"] .discover-network-stat-card .tabular-nums,
body.dark .discover-network-stat-card .tabular-nums {
  color: #ffffff !important;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.16);
}

html.dark .discover-network-stat-card .uppercase,
html[data-theme="dark"] .discover-network-stat-card .uppercase,
body.dark .discover-network-stat-card .uppercase {
  opacity: 1 !important;
  color: rgba(248, 250, 252, 0.78) !important;
}

/* END DISCOVER HERO NETWORK STAT CARDS v1 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

for bad in ["onClick={() =", "className={}"]:
    if bad in jsx and bad not in jsx_original:
        jsx_path.write_text(jsx_original)
        css_path.write_text(css_original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

if "discover-network-stat-card" not in jsx or marker not in css:
    jsx_path.write_text(jsx_original)
    css_path.write_text(css_original)
    raise RuntimeError("Patch incomplete. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Discover hero stat cards dark-mode patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added scoped class names to Discover NetworkStatCard")
print("- Added dark-mode CSS for Signals / Ships / Streak")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No discovery feed, loading, stats, or routing logic changed.")
