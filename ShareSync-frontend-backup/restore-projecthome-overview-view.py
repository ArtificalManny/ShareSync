from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

current = path.read_text()
original = current

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
new_backup = path.with_suffix(path.suffix + f".backup-before-overview-restore-{stamp}")
shutil.copy2(path, new_backup)

def fail(message):
    path.write_text(original)
    raise RuntimeError(message + f"\nOriginal restored. Backup kept at: {new_backup}")

if "function OverviewView(" in current:
    print("OverviewView already exists. No changes needed.")
    raise SystemExit(0)

backup_candidates = sorted(
    list(path.parent.glob("ProjectHome.jsx.backup-proof-view-polish-*")) +
    list(path.parent.glob("ProjectHome.jsx.backup-*")),
    key=lambda p: p.stat().st_mtime,
    reverse=True,
)

if not backup_candidates:
    fail("Could not find a ProjectHome.jsx backup to restore OverviewView from.")

source_backup = backup_candidates[0]
backup_text = source_backup.read_text()

def extract_function(source, name):
    signature = f"function {name}("
    start = source.find(signature)

    if start == -1:
        return None

    brace_start = source.find("{", start)
    if brace_start == -1:
        return None

    depth = 0
    state = "normal"
    escape = False
    i = brace_start

    while i < len(source):
        ch = source[i]
        nxt = source[i + 1] if i + 1 < len(source) else ""

        if state == "line_comment":
            if ch == "\n":
                state = "normal"

        elif state == "block_comment":
            if ch == "*" and nxt == "/":
                state = "normal"
                i += 1

        elif state == "single_quote":
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == "'":
                state = "normal"

        elif state == "double_quote":
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                state = "normal"

        elif state == "template":
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == "`":
                state = "normal"

        else:
            if ch == "/" and nxt == "/":
                state = "line_comment"
                i += 1
            elif ch == "/" and nxt == "*":
                state = "block_comment"
                i += 1
            elif ch == "'":
                state = "single_quote"
            elif ch == '"':
                state = "double_quote"
            elif ch == "`":
                state = "template"
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return source[start:i + 1].rstrip() + "\n\n"

        i += 1

    return None

overview_block = extract_function(backup_text, "OverviewView")

if not overview_block:
    fail(f"Could not extract OverviewView from backup: {source_backup}")

insert_markers = [
    "function ProofMetricTile(",
    "function ProofSummaryCard(",
    "function ProofSignalsPreview(",
    "function ProofView(",
    "// ═══════════════════════════════════════════════════════════════════════════════\n// MAIN COMPONENT",
]

insert_at = -1

for marker in insert_markers:
    insert_at = current.find(marker)
    if insert_at != -1:
        break

if insert_at == -1:
    fail("Could not find a safe place to reinsert OverviewView.")

current = current[:insert_at] + overview_block + current[insert_at:]

if "function OverviewView(" not in current:
    fail("OverviewView restore failed.")

if "Proof Ledger" not in current:
    fail("Proof Ledger polish appears missing; refusing to write partial file.")

path.write_text(current)

print("OverviewView restored successfully.")
print(f"Updated file: {path}")
print(f"Current-file backup: {new_backup}")
print(f"Restored OverviewView from: {source_backup}")
print("")
print("Changed only:")
print("- Restored missing OverviewView function")
print("- Kept the newer Proof Ledger / ProofView changes")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No routes changed.")
