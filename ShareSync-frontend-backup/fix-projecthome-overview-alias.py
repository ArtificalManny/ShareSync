from pathlib import Path
from datetime import datetime
import shutil
import re

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

text = path.read_text()
original = text

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-before-overview-alias-{stamp}")
shutil.copy2(path, backup)

def fail(message):
    path.write_text(original)
    raise RuntimeError(message + f"\nOriginal restored. Backup kept at: {backup}")

def has_component_decl(source, name):
    patterns = [
        rf"\bfunction\s+{re.escape(name)}\s*\(",
        rf"\bconst\s+{re.escape(name)}\s*=",
        rf"\blet\s+{re.escape(name)}\s*=",
        rf"\bvar\s+{re.escape(name)}\s*=",
    ]
    return any(re.search(pattern, source) for pattern in patterns)

if has_component_decl(text, "OverviewView"):
    print("OverviewView already exists. No changes needed.")
    print(f"Backup kept at: {backup}")
    raise SystemExit(0)

if not has_component_decl(text, "CommandView"):
    fail(
        "Could not find CommandView either. I do not want to guess the replacement component."
    )

alias_block = """
// Legacy route/tab compatibility:
// The project overview route still asks for OverviewView in some places.
// The redesigned first screen is now CommandView, so OverviewView safely aliases to it.
function OverviewView(props) {
  return <CommandView {...props} />;
}

"""

insert_markers = [
    "export default function ProjectHome",
    "function ProjectHome",
    "// ═══════════════════════════════════════════════════════════════════════════════\n// MAIN COMPONENT",
]

insert_at = -1
used_marker = None

for marker in insert_markers:
    insert_at = text.find(marker)
    if insert_at != -1:
        used_marker = marker
        break

if insert_at == -1:
    fail("Could not find a safe top-level insertion point before ProjectHome.")

text = text[:insert_at] + alias_block + text[insert_at:]

if not has_component_decl(text, "OverviewView"):
    fail("OverviewView alias was not inserted correctly.")

if "return <CommandView {...props} />;" not in text:
    fail("OverviewView alias does not point to CommandView correctly.")

path.write_text(text)

print("ProjectHome OverviewView alias applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Inserted before marker:")
print(f"- {used_marker}")
print("")
print("Changed only:")
print("- Added a small OverviewView compatibility alias")
print("- OverviewView now renders CommandView")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No routes changed.")
print("No styling changed.")
