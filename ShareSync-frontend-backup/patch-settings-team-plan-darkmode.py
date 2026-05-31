from pathlib import Path
from datetime import datetime
import shutil

jsx_path = Path("src/pages/Settings.jsx")
css_path = Path("src/index.css")

if not jsx_path.exists():
    raise FileNotFoundError(f"Missing file: {jsx_path}")

if not css_path.exists():
    raise FileNotFoundError(f"Missing file: {css_path}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

jsx_original = jsx_path.read_text()
css_original = css_path.read_text()

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-billing-plan-darkmode-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-billing-plan-darkmode-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_original
css = css_original

required = [
    'import BillingSettings from "../components/settings/BillingSettings";',
    'title="Subscription & Billing"',
    '<BillingSettings />',
]

missing = [item for item in required if item not in jsx]
if missing:
    raise RuntimeError(
        f"Could not verify Settings billing structure. Missing: {missing}. No changes written."
    )

old = '<BillingSettings />'
new = '''<div className="settings-billing-contrast-fix">
              <BillingSettings />
            </div>'''

if "settings-billing-contrast-fix" not in jsx:
    jsx = jsx.replace(old, new, 1)

marker = "SETTINGS BILLING TEAM PLAN DARKMODE v1"

if marker in css:
    start = css.find("/* =========================================================\n   SETTINGS BILLING TEAM PLAN DARKMODE v1")
    end = css.find("/* END SETTINGS BILLING TEAM PLAN DARKMODE v1 */", start)
    if start != -1 and end != -1:
        end += len("/* END SETTINGS BILLING TEAM PLAN DARKMODE v1 */")
        css = css[:start].rstrip() + "\n\n" + css[end:].lstrip()

css_patch = r'''
/* =========================================================
   SETTINGS BILLING TEAM PLAN DARKMODE v1
   Settings > Subscription & Billing:
   fixes low-contrast Team Plan text in dark mode.
   ========================================================= */

.settings-billing-contrast-fix {
  position: relative;
  isolation: isolate;
}

/* Target the plan banner/card without touching Settings logic */
html.dark .settings-billing-contrast-fix [class*="border-amber"],
html.dark .settings-billing-contrast-fix [class*="bg-amber"],
html.dark .settings-billing-contrast-fix [class*="bg-yellow"],
html[data-theme="dark"] .settings-billing-contrast-fix [class*="border-amber"],
html[data-theme="dark"] .settings-billing-contrast-fix [class*="bg-amber"],
html[data-theme="dark"] .settings-billing-contrast-fix [class*="bg-yellow"],
body.dark .settings-billing-contrast-fix [class*="border-amber"],
body.dark .settings-billing-contrast-fix [class*="bg-amber"],
body.dark .settings-billing-contrast-fix [class*="bg-yellow"] {
  background:
    radial-gradient(circle at 8% 0%, rgba(251, 191, 36, 0.34), transparent 38%),
    linear-gradient(135deg, rgba(69, 46, 5, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(251, 191, 36, 0.90) !important;
  color: #f8fafc !important;
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.12) !important;
}

/* Force the Team Plan title to be readable */
html.dark .settings-billing-contrast-fix [class*="border-amber"] h1,
html.dark .settings-billing-contrast-fix [class*="border-amber"] h2,
html.dark .settings-billing-contrast-fix [class*="border-amber"] h3,
html.dark .settings-billing-contrast-fix [class*="border-amber"] h4,
html.dark .settings-billing-contrast-fix [class*="border-amber"] strong,
html.dark .settings-billing-contrast-fix [class*="border-amber"] .font-bold,
html.dark .settings-billing-contrast-fix [class*="border-amber"] .font-semibold,
html.dark .settings-billing-contrast-fix [class*="border-amber"] .font-medium,
html[data-theme="dark"] .settings-billing-contrast-fix [class*="border-amber"] h1,
html[data-theme="dark"] .settings-billing-contrast-fix [class*="border-amber"] h2,
html[data-theme="dark"] .settings-billing-contrast-fix [class*="border-amber"] h3,
html[data-theme="dark"] .settings-billing-contrast-fix [class*="border-amber"] h4,
html[data-theme="dark"] .settings-billing-contrast-fix [class*="border-amber"] strong,
html[data-theme="dark"] .settings-billing-contrast-fix [class*="border-amber"] .font-bold,
html[data-theme="dark"] .settings-billing-contrast-fix [class*="border-amber"] .font-semibold,
html[data-theme="dark"] .settings-billing-contrast-fix [class*="border-amber"] .font-medium,
body.dark .settings-billing-contrast-fix [class*="border-amber"] h1,
body.dark .settings-billing-contrast-fix [class*="border-amber"] h2,
body.dark .settings-billing-contrast-fix [class*="border-amber"] h3,
body.dark .settings-billing-contrast-fix [class*="border-amber"] h4,
body.dark .settings-billing-contrast-fix [class*="border-amber"] strong,
body.dark .settings-billing-contrast-fix [class*="border-amber"] .font-bold,
body.dark .settings-billing-contrast-fix [class*="border-amber"] .font-semibold,
body.dark .settings-billing-contrast-fix [class*="border-amber"] .font-medium {
  color: #ffffff !important;
  opacity: 1 !important;
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.12);
}

/* Keep the price line visible without overpowering the title */
html.dark .settings-billing-contrast-fix [class*="border-amber"] p,
html.dark .settings-billing-contrast-fix [class*="border-amber"] span,
html.dark .settings-billing-contrast-fix [class*="border-amber"] div,
html[data-theme="dark"] .settings-billing-contrast-fix [class*="border-amber"] p,
html[data-theme="dark"] .settings-billing-contrast-fix [class*="border-amber"] span,
html[data-theme="dark"] .settings-billing-contrast-fix [class*="border-amber"] div,
body.dark .settings-billing-contrast-fix [class*="border-amber"] p,
body.dark .settings-billing-contrast-fix [class*="border-amber"] span,
body.dark .settings-billing-contrast-fix [class*="border-amber"] div {
  color: rgba(248, 250, 252, 0.82) !important;
}

/* Preserve the orange crown/icon circle as a strong accent */
html.dark .settings-billing-contrast-fix [class*="bg-orange"],
html[data-theme="dark"] .settings-billing-contrast-fix [class*="bg-orange"],
body.dark .settings-billing-contrast-fix [class*="bg-orange"] {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 14px 28px rgba(249, 115, 22, 0.28) !important;
}

/* END SETTINGS BILLING TEAM PLAN DARKMODE v1 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

for bad in ["onClick={() =", "className={}"]:
    if bad in jsx and bad not in jsx_original:
        jsx_path.write_text(jsx_original)
        css_path.write_text(css_original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

if "settings-billing-contrast-fix" not in jsx or marker not in css:
    jsx_path.write_text(jsx_original)
    css_path.write_text(css_original)
    raise RuntimeError("Patch incomplete. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Settings Team Plan dark-mode contrast patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Wrapped BillingSettings with one scoped class in Settings.jsx")
print("- Added dark-mode CSS for the Team Plan billing card")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No billing logic changed.")
print("No subscription usage logic changed.")
