from pathlib import Path
import re

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

backup = path.with_suffix(".jsx.bak-before-fix-active-goals-livetasks-prop")
backup.write_text(text)

changed = 0

# 1) Add liveTasks to OverviewView's destructured props.
pattern = r"(function\s+OverviewView\s*\(\s*\{)(.*?)(\}\s*\)\s*\{)"
match = re.search(pattern, text, flags=re.S)

if not match:
    raise SystemExit("❌ Could not find OverviewView function signature.")

props = match.group(2)

if "liveTasks" not in props:
    # Prefer placing it after projectOnlineCount if that prop exists.
    if "projectOnlineCount = 0," in props:
        props = props.replace(
            "projectOnlineCount = 0,",
            "projectOnlineCount = 0,\n  liveTasks = [],",
            1,
        )
    else:
        props = props + "\n  liveTasks = [],"
    text = text[:match.start(2)] + props + text[match.end(2):]
    changed += 1
    print("✅ Added liveTasks = [] to OverviewView props.")
else:
    print("ℹ️ OverviewView already has liveTasks in props.")

# 2) Pass liveTasks into the OverviewView render.
overview_pattern = r"(<OverviewView\b[\s\S]*?projectOnlineCount=\{projectOnlineCount\})([\s\S]*?\/>)"
match = re.search(overview_pattern, text)

if not match:
    raise SystemExit("❌ Could not find the OverviewView render block with projectOnlineCount.")

block = match.group(0)

if "liveTasks={liveTasks}" not in block:
    new_block = block.replace(
        "projectOnlineCount={projectOnlineCount}",
        "projectOnlineCount={projectOnlineCount}\n              liveTasks={liveTasks}",
        1,
    )
    text = text[:match.start()] + new_block + text[match.end():]
    changed += 1
    print("✅ Passed liveTasks={liveTasks} into OverviewView.")
else:
    print("ℹ️ OverviewView already receives liveTasks.")

path.write_text(text)

print("")
print(f"✅ liveTasks reference fixed. Changes: {changed}")
print(f"✅ Backup created: {backup}")
print("")
print("Inspect:")
print('rg -n "function OverviewView|liveTasks = \\[\\]|liveTasks=\\{liveTasks\\}|buildProjectActiveGoals" src/pages/ProjectHome.jsx -C 10')
