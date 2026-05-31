from pathlib import Path
from datetime import datetime
import re

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

backup = path.with_suffix(f".jsx.bak-before-momentum-card-gauge-icon-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)

# Gauge already appears in your lucide import list in ProjectHome.jsx.
# This only changes the Momentum card header icon, not every Zap icon on the page.
start = text.find("function MomentumCard(")
if start == -1:
    raise SystemExit("❌ Could not find function MomentumCard(")

end = text.find("function ", start + 1)
if end == -1:
    end = len(text)

block = text[start:end]

old = '<Zap className="w-4 h-4 text-violet-500" />'
new = '<Gauge className="w-4 h-4 text-violet-500" />'

if old not in block:
    raise SystemExit(
        "❌ Could not find the MomentumCard Zap icon. Run:\n"
        "rg -n \"function MomentumCard|Zap className|Gauge className|Momentum\" src/pages/ProjectHome.jsx -C 12"
    )

block = block.replace(old, new, 1)
text = text[:start] + block + text[end:]

path.write_text(text)

print("✅ Momentum card icon changed: Zap → Gauge")
print("✅ Only the MomentumCard header icon was changed.")
print("✅ Backup created:", backup)
print("")
print("Inspect:")
print('rg -n "function MomentumCard|Gauge className|Zap className|Momentum" src/pages/ProjectHome.jsx -C 12')
