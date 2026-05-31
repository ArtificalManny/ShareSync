from pathlib import Path
from datetime import datetime
import shutil
import re

home_path = Path("src/pages/Home.jsx")
css_path = Path("src/index.css")

if not home_path.exists():
    raise FileNotFoundError("Could not find src/pages/Home.jsx")

if not css_path.exists():
    raise FileNotFoundError("Could not find src/index.css")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
home_backup = home_path.with_suffix(home_path.suffix + f".backup-intelligence-v2-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-intelligence-v2-{stamp}")

shutil.copy2(home_path, home_backup)
shutil.copy2(css_path, css_backup)

home = home_path.read_text()
css = css_path.read_text()

old = '''            {hasUsefulIntelligence && (
              <IntelligencePanel
                workload={workloadIntel.data}
                workloadLoading={workloadIntel.loading}
                workloadError={workloadIntel.error}
                isBalanced={workloadIntel.data?.isBalanced ?? false}
                onBalanceClick={() => handleOpenPanel("balance")}
                peakWindowStart={intelligence.peakWindowStart}
                peakWindowEnd={intelligence.peakWindowEnd}
                productivity={intelligence.productivity}
                coWorkingMultiplier={intelligence.coWorkingMultiplier}
                isCoWorking={intelligence.isCoWorking}
              />
            )}'''

new = '''            {hasUsefulIntelligence && (
              <div className="home-intelligence-panel" data-momentum={glowLevel}>
                <IntelligencePanel
                  workload={workloadIntel.data}
                  workloadLoading={workloadIntel.loading}
                  workloadError={workloadIntel.error}
                  isBalanced={workloadIntel.data?.isBalanced ?? false}
                  onBalanceClick={() => handleOpenPanel("balance")}
                  peakWindowStart={intelligence.peakWindowStart}
                  peakWindowEnd={intelligence.peakWindowEnd}
                  productivity={intelligence.productivity}
                  coWorkingMultiplier={intelligence.coWorkingMultiplier}
                  isCoWorking={intelligence.isCoWorking}
                />
              </div>
            )}'''

if "home-intelligence-panel" not in home:
    if old not in home:
        shutil.copy2(home_backup, home_path)
        raise RuntimeError(
            "Could not find the exact IntelligencePanel block. No changes written.\n"
            "Run this and paste the output:\n"
            "grep -n -B 10 -A 25 \"<IntelligencePanel\" src/pages/Home.jsx"
        )

    home = home.replace(old, new, 1)

css = re.sub(
    r"/\* =========================================================\n"
    r"   HOME INTELLIGENCE PANEL VISUAL STRIKE V2\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* END HOME INTELLIGENCE PANEL VISUAL STRIKE V2 \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

css_patch = r'''
/* =========================================================
   HOME INTELLIGENCE PANEL VISUAL STRIKE V2
   Scoped polish for Home.jsx > IntelligencePanel wrapper.
   ========================================================= */

.home-intelligence-panel {
  position: relative;
  isolation: isolate;
  border-radius: 1.75rem;
  padding: 1px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.55), rgba(245, 158, 11, 0.45), rgba(34, 211, 238, 0.45));
  box-shadow:
    0 22px 70px rgba(15, 23, 42, 0.10),
    0 0 34px rgba(168, 85, 247, 0.08);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    filter 180ms ease;
}

.home-intelligence-panel::before {
  content: "";
  position: absolute;
  inset: -1px;
  z-index: 0;
  border-radius: inherit;
  background:
    radial-gradient(circle at 0% 0%, rgba(168, 85, 247, 0.20), transparent 36%),
    radial-gradient(circle at 100% 100%, rgba(245, 158, 11, 0.18), transparent 40%);
  opacity: 0.9;
  pointer-events: none;
}

.home-intelligence-panel > * {
  position: relative;
  z-index: 1;
}

/* Make the IntelligencePanel's own card inherit the premium shell */
.home-intelligence-panel > div,
.home-intelligence-panel > section,
.home-intelligence-panel > article {
  border-radius: 1.7rem !important;
  overflow: hidden;
  border: 1px solid rgba(168, 85, 247, 0.16) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(168, 85, 247, 0.08), transparent 34%),
    radial-gradient(circle at 100% 100%, rgba(245, 158, 11, 0.08), transparent 40%),
    rgba(255, 255, 255, 0.94) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    0 18px 55px rgba(15, 23, 42, 0.08) !important;
}

/* Dark mode: make Intelligence feel like a real command module */
html.dark .home-intelligence-panel,
html[data-theme="dark"] .home-intelligence-panel,
.dark .home-intelligence-panel,
[data-theme="dark"] .home-intelligence-panel {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.72), rgba(245, 158, 11, 0.55), rgba(34, 211, 238, 0.46));
  box-shadow:
    0 26px 90px rgba(0, 0, 0, 0.44),
    0 0 54px rgba(168, 85, 247, 0.14),
    0 0 52px rgba(245, 158, 11, 0.10);
}

html.dark .home-intelligence-panel > div,
html.dark .home-intelligence-panel > section,
html.dark .home-intelligence-panel > article,
html[data-theme="dark"] .home-intelligence-panel > div,
html[data-theme="dark"] .home-intelligence-panel > section,
html[data-theme="dark"] .home-intelligence-panel > article,
.dark .home-intelligence-panel > div,
.dark .home-intelligence-panel > section,
.dark .home-intelligence-panel > article,
[data-theme="dark"] .home-intelligence-panel > div,
[data-theme="dark"] .home-intelligence-panel > section,
[data-theme="dark"] .home-intelligence-panel > article {
  border-color: rgba(245, 158, 11, 0.22) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(168, 85, 247, 0.18), transparent 36%),
    radial-gradient(circle at 100% 100%, rgba(245, 158, 11, 0.17), transparent 42%),
    linear-gradient(135deg, rgba(24, 24, 27, 0.98), rgba(2, 6, 23, 0.98)) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 20px 70px rgba(0, 0, 0, 0.30) !important;
}

/* Text clarity */
html.dark .home-intelligence-panel h1,
html.dark .home-intelligence-panel h2,
html.dark .home-intelligence-panel h3,
html.dark .home-intelligence-panel h4,
html[data-theme="dark"] .home-intelligence-panel h1,
html[data-theme="dark"] .home-intelligence-panel h2,
html[data-theme="dark"] .home-intelligence-panel h3,
html[data-theme="dark"] .home-intelligence-panel h4,
.dark .home-intelligence-panel h1,
.dark .home-intelligence-panel h2,
.dark .home-intelligence-panel h3,
.dark .home-intelligence-panel h4 {
  color: rgba(248, 250, 252, 0.98) !important;
  text-shadow: 0 0 22px rgba(168, 85, 247, 0.18);
}

html.dark .home-intelligence-panel p,
html.dark .home-intelligence-panel span,
html[data-theme="dark"] .home-intelligence-panel p,
html[data-theme="dark"] .home-intelligence-panel span,
.dark .home-intelligence-panel p,
.dark .home-intelligence-panel span {
  color: rgba(226, 232, 240, 0.86) !important;
}

/* Make warning/orange intelligence signals pop */
html.dark .home-intelligence-panel [class*="amber"],
html.dark .home-intelligence-panel [class*="orange"],
html[data-theme="dark"] .home-intelligence-panel [class*="amber"],
html[data-theme="dark"] .home-intelligence-panel [class*="orange"],
.dark .home-intelligence-panel [class*="amber"],
.dark .home-intelligence-panel [class*="orange"] {
  color: #f59e0b !important;
  text-shadow:
    0 0 18px rgba(245, 158, 11, 0.26),
    0 0 34px rgba(245, 158, 11, 0.12);
}

/* Inner warning / peak window blocks */
html.dark .home-intelligence-panel [class*="rounded"],
html[data-theme="dark"] .home-intelligence-panel [class*="rounded"],
.dark .home-intelligence-panel [class*="rounded"],
[data-theme="dark"] .home-intelligence-panel [class*="rounded"] {
  border-color: rgba(148, 163, 184, 0.18) !important;
}

html.dark .home-intelligence-panel [class*="border-amber"],
html.dark .home-intelligence-panel [class*="border-orange"],
html[data-theme="dark"] .home-intelligence-panel [class*="border-amber"],
html[data-theme="dark"] .home-intelligence-panel [class*="border-orange"],
.dark .home-intelligence-panel [class*="border-amber"],
.dark .home-intelligence-panel [class*="border-orange"] {
  border-color: rgba(245, 158, 11, 0.42) !important;
  box-shadow:
    0 0 28px rgba(245, 158, 11, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
}

/* Hover lift */
.home-intelligence-panel:hover {
  transform: translateY(-2px);
  filter: saturate(1.08);
  box-shadow:
    0 30px 90px rgba(15, 23, 42, 0.14),
    0 0 48px rgba(168, 85, 247, 0.14),
    0 0 44px rgba(245, 158, 11, 0.10);
}

html.dark .home-intelligence-panel:hover,
html[data-theme="dark"] .home-intelligence-panel:hover,
.dark .home-intelligence-panel:hover,
[data-theme="dark"] .home-intelligence-panel:hover {
  box-shadow:
    0 32px 100px rgba(0, 0, 0, 0.50),
    0 0 62px rgba(168, 85, 247, 0.18),
    0 0 64px rgba(245, 158, 11, 0.14);
}

/* END HOME INTELLIGENCE PANEL VISUAL STRIKE V2 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

unsafe_regexes = [
    (r"onClick=\{\(\)\s*=(?!>)", "malformed onClick arrow"),
    (r"className=\{className=\{", "double className corruption"),
]

for pattern, label in unsafe_regexes:
    if re.search(pattern, home):
        shutil.copy2(home_backup, home_path)
        shutil.copy2(css_backup, css_path)
        raise RuntimeError(f"Unsafe pattern detected: {label}. Original restored.")

if "home-intelligence-panel" not in home:
    shutil.copy2(home_backup, home_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing home-intelligence-panel. Original restored.")

if "HOME INTELLIGENCE PANEL VISUAL STRIKE V2" not in css:
    shutil.copy2(home_backup, home_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing CSS marker. Original restored.")

home_path.write_text(home)
css_path.write_text(css)

print("Home Intelligence visual polish v2 applied successfully.")
print(f"Updated file: {home_path}")
print(f"Backup file:  {home_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Wrapped IntelligencePanel in home-intelligence-panel")
print("- Added scoped CSS for IntelligencePanel visual polish")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No intelligence logic changed.")
