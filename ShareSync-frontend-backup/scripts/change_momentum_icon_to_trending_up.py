from pathlib import Path
from datetime import datetime
import re

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

backup = path.with_suffix(f".jsx.bak-before-momentum-trending-up-icon-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)

# 1) Ensure TrendingUp is imported from lucide-react
lucide_match = re.search(r'import\s*\{([\s\S]*?)\}\s*from\s*["\']lucide-react["\'];', text)

if not lucide_match:
    raise SystemExit("❌ Could not find lucide-react import block in ProjectHome.jsx.")

imports = lucide_match.group(1)

if "TrendingUp" not in imports:
    new_imports = imports.rstrip() + ",\n  TrendingUp\n"
    text = text[:lucide_match.start(1)] + new_imports + text[lucide_match.end(1):]
    print("✅ Added TrendingUp import.")
else:
    print("ℹ️ TrendingUp already imported.")

# 2) Find MomentumCard only
start = text.find("function MomentumCard(")
if start == -1:
    raise SystemExit("❌ Could not find function MomentumCard(")

next_function = text.find("\nfunction ", start + 1)
next_const = text.find("\nconst ", start + 1)

candidates = [x for x in [next_function, next_const] if x != -1]
end = min(candidates) if candidates else len(text)

block = text[start:end]

# 3) Replace the card header icon inside MomentumCard
# Handles Gauge, Zap, Activity, or another simple Lucide icon in the Momentum header.
pattern = re.compile(
    r'<(?:Gauge|Zap|Activity|Radio|Signal|LineChart|BarChart3|TrendingUp)\s+className="w-4 h-4 text-violet-500"\s*/>'
)

match = pattern.search(block)

if not match:
    raise SystemExit(
        "❌ Could not find the MomentumCard header icon.\n"
        "Run:\n"
        "rg -n \"function MomentumCard|w-4 h-4 text-violet-500|Momentum\" src/pages/ProjectHome.jsx -C 16"
    )

old_icon = match.group(0)
new_icon = '<TrendingUp className="w-4 h-4 text-violet-500" />'

block = block[:match.start()] + new_icon + block[match.end():]
text = text[:start] + block + text[end:]

path.write_text(text)

print("")
print("✅ Momentum icon changed to TrendingUp.")
print("Old:", old_icon)
print("New:", new_icon)
print("✅ Backup created:", backup)
print("")
print("Inspect:")
print('rg -n "function MomentumCard|TrendingUp|Gauge|Zap|Momentum" src/pages/ProjectHome.jsx -C 12')
