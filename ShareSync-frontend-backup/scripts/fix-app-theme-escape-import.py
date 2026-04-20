from pathlib import Path
import shutil
import sys

APP = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup/src/App.jsx")
BACKUP_DIR = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup/.chatgpt-backups")
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

if not APP.exists():
    print(f"❌ App.jsx not found: {APP}", file=sys.stderr)
    sys.exit(1)

text = APP.read_text(encoding="utf-8")
original = text

target_import = 'import "./styles/theme-escape-hatch.css";'

if target_import in text:
    print("ℹ️ App.jsx already imports theme-escape-hatch.css")
    sys.exit(0)

anchor = 'import "./styles/status-colors.css";'
if anchor not in text:
    print(f"❌ Could not find anchor: {anchor}", file=sys.stderr)
    sys.exit(1)

backup_file = BACKUP_DIR / "App.jsx.before-theme-escape-import.bak"
shutil.copy2(APP, backup_file)

text = text.replace(anchor, anchor + "\n" + target_import, 1)
APP.write_text(text, encoding="utf-8")

print(f"✅ Patched {APP}")
print(f"✅ Backup saved to {backup_file}")
print("")
print("Verify with:")
print('grep -n \'status-colors.css\\|theme-escape-hatch.css\' /Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup/src/App.jsx')
