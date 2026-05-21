from pathlib import Path
import json
import shutil
from datetime import datetime

path = Path("package.json")

if not path.exists():
    raise SystemExit("❌ package.json not found. Run this from ShareSync-backend.")

backup = path.with_suffix(f".json.bak-before-fix-start-dev-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(path, backup)
print(f"✅ Backup created: {backup}")

pkg = json.loads(path.read_text())
scripts = pkg.setdefault("scripts", {})

print("Current scripts:")
for key in ["start", "start:dev", "start:debug", "start:prod", "build"]:
    if key in scripts:
        print(f"  {key}: {scripts[key]}")

for key, value in list(scripts.items()):
    if isinstance(value, str):
        value = value.replace("node dist/main ", "node dist/main.js ")
        value = value.replace("node dist/main\"", "node dist/main.js\"")
        value = value.replace("node dist/main'", "node dist/main.js'")
        if value.strip() == "node dist/main":
            value = "node dist/main.js"
        scripts[key] = value

# Force sane defaults for this project
scripts["start:dev"] = "nest start --watch"
scripts["start:prod"] = "node dist/main.js"

path.write_text(json.dumps(pkg, indent=2) + "\n")

print("")
print("✅ package.json scripts patched.")
print("")
print("Updated scripts:")
for key in ["start", "start:dev", "start:debug", "start:prod", "build"]:
    if key in scripts:
        print(f"  {key}: {scripts[key]}")
