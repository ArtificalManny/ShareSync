from pathlib import Path
from datetime import datetime
import shutil
import re

path = Path("src/features/flow/FlowBoard.jsx")

if not path.exists():
    raise RuntimeError(f"Missing file: {path}")

original = path.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"{path}.backup-before-board-to-flow-labels-{timestamp}")
shutil.copy2(path, backup)

updated = original
changes = []

def sub_once(pattern, repl, label):
    global updated
    next_text, count = re.subn(pattern, repl, updated, count=1, flags=re.DOTALL)
    if count:
        updated = next_text
        changes.append(label)
    else:
        print(f"Warning: skipped {label}")

def sub_all(pattern, repl, label):
    global updated
    next_text, count = re.subn(pattern, repl, updated, flags=re.DOTALL)
    if count:
        updated = next_text
        changes.append(f"{label} ({count})")
    else:
        print(f"Warning: skipped {label}")

# User-visible / accessibility labels only.
sub_once(
    r'aria-label="Project board"',
    'aria-label="Project flow"',
    "aria label: Project board -> Project flow"
)

sub_once(
    r'(<div className="text-sm font-black text-slate-950 dark:text-white">\s*)Board(\s*</div>)',
    r'\1Flow\2',
    "empty/no-project title: Board -> Flow"
)

sub_once(
    r'(<h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">\s*)Board(\s*</h2>)',
    r'\1Flow\2',
    "main header: Board -> Flow"
)

sub_once(
    r'(\s*)Live Board(\s*</span>)',
    r'\1Live Flow\2',
    "pill: Live Board -> Live Flow"
)

sub_once(
    r'(\s*)Board failed to load(\s*</div>)',
    r'\1Flow failed to load\2',
    "error title: Board failed to load -> Flow failed to load"
)

sub_once(
    r'(\s*)Your board is empty\.(\s*</h3>)',
    r'\1Your flow is empty.\2',
    "empty state: Your board is empty -> Your flow is empty"
)

if not changes:
    raise RuntimeError(
        "No label changes were made. Original file left untouched. "
        f"Backup kept at: {backup}"
    )

# Safety checks: these must remain untouched.
required_markers = [
    "export default function FlowBoard",
    "useFlowTasks",
    "FlowColumn",
    "moveTaskOptimistic",
    "addTask",
    "FLOW_STATUSES",
]

for marker in required_markers:
    if marker not in updated:
        path.write_text(original)
        raise RuntimeError(
            f"Safety check failed: missing {marker}. Original restored. "
            f"Backup kept at: {backup}"
        )

path.write_text(updated)

print("FlowBoard visible labels renamed successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
for item in changes:
    print(f"- {item}")
print("")
print("Kept intact:")
print("- FlowBoard component name")
print("- CSS class names")
print("- useFlowTasks")
print("- FlowColumn rendering")
print("- drag/drop logic")
print("- task loading/move/add logic")
