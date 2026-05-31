from pathlib import Path
from datetime import datetime
import shutil
import re

root = Path(".")
index_path = root / "index.html"
icons_dir = root / "public" / "icons"

if not index_path.exists():
    raise FileNotFoundError("Missing index.html. Run this from the frontend project root.")

icons_dir.mkdir(parents=True, exist_ok=True)

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
index_backup = index_path.with_suffix(index_path.suffix + f".backup-tab-icon-{stamp}")
shutil.copy2(index_path, index_backup)

favicon_svg = icons_dir / "openshare-favicon.svg"
safari_mask_svg = icons_dir / "safari-pinned-tab.svg"

favicon_svg.write_text(r'''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <defs>
    <radialGradient id="plate" cx="35%" cy="25%" r="75%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.98"/>
      <stop offset="45%" stop-color="#F5F3FF" stop-opacity="0.92"/>
      <stop offset="78%" stop-color="#ECFEFF" stop-opacity="0.78"/>
      <stop offset="100%" stop-color="#EEF2FF" stop-opacity="0.62"/>
    </radialGradient>

    <linearGradient id="orbit" x1="12" y1="10" x2="52" y2="54">
      <stop offset="0%" stop-color="#A855F7"/>
      <stop offset="48%" stop-color="#7C3AED"/>
      <stop offset="76%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#2DD4BF"/>
    </linearGradient>

    <linearGradient id="signal" x1="18" y1="34" x2="46" y2="30">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="55%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#2DD4BF"/>
    </linearGradient>

    <filter id="glow" x="-45%" y="-45%" width="190%" height="190%">
      <feGaussianBlur stdDeviation="2.6" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="
          0 0 0 0 0.486
          0 0 0 0 0.227
          0 0 0 0 0.929
          0 0 0 .45 0"
        result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <circle cx="32" cy="32" r="28" fill="url(#plate)"/>
  <path
    d="M47.2 13.8 A24 24 0 1 1 21 12"
    stroke="url(#orbit)"
    stroke-width="7"
    stroke-linecap="round"
    stroke-linejoin="round"
    filter="url(#glow)"
  />
  <path
    d="M20 34 C25 26.5 29.4 26.5 32 32 C34.6 37.5 39 37.5 44 30"
    stroke="url(#signal)"
    stroke-width="4"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <circle cx="47.2" cy="13.8" r="4.2" fill="#2DD4BF" filter="url(#glow)"/>
  <circle cx="47.2" cy="13.8" r="8.6" fill="#2DD4BF" opacity="0.16"/>
</svg>
''')

safari_mask_svg.write_text(r'''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path
    d="M47.2 13.8 A24 24 0 1 1 21 12"
    stroke="black"
    stroke-width="7"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M20 34 C25 26.5 29.4 26.5 32 32 C34.6 37.5 39 37.5 44 30"
    stroke="black"
    stroke-width="4"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <circle cx="47.2" cy="13.8" r="4.2" fill="black"/>
</svg>
''')

html = index_path.read_text()

new_icons_block = '''    <!-- Icons -->
    <link rel="icon" type="image/svg+xml" href="/icons/openshare-favicon.svg?v=openshare-2" />
    <link rel="icon" href="/favicon.ico?v=openshare-2" sizes="any" />
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png?v=openshare-2" />
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png?v=openshare-2" />
    <link rel="icon" type="image/png" href="/icon-192.png?v=openshare-2" sizes="192x192" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png?v=openshare-2" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=openshare-2" />
    <link rel="mask-icon" href="/icons/safari-pinned-tab.svg?v=openshare-2" color="#7c3aed" />'''

pattern = re.compile(
    r'    <!-- Icons -->\n.*?(?=\n\n    <!-- iOS Splash Screens)',
    re.DOTALL
)

if not pattern.search(html):
    raise RuntimeError("Could not find the Icons block in index.html. No changes written.")

html = pattern.sub(new_icons_block, html)

# Update old ShareSync apple title while we are here.
html = html.replace(
    '<meta name="apple-mobile-web-app-title" content="ShareSync" />',
    '<meta name="apple-mobile-web-app-title" content="OpenShare" />'
)

index_path.write_text(html)

print("OpenShare tab icon installed successfully.")
print(f"Updated file: {index_path}")
print(f"Backup file:  {index_backup}")
print(f"Created file: {favicon_svg}")
print(f"Created file: {safari_mask_svg}")
print("")
print("Changed only:")
print("- Added a new OpenShare SVG favicon for Chrome/Safari tabs")
print("- Updated index.html icon links with cache-busting")
print("- Updated Safari pinned-tab mask icon")
print("- Changed apple mobile app title from ShareSync to OpenShare")
print("")
print("No React component logic changed.")
print("No backend files touched.")
