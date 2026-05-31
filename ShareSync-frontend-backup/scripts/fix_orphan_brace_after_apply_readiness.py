from pathlib import Path
from datetime import datetime

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-fix-orphan-apply-readiness-brace-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

start_marker = "function applyReadinessToMission("
next_marker = "function toPriorityMissions("

start = text.find(start_marker)
end_marker_pos = text.find(next_marker)

if start == -1:
    raise SystemExit("❌ Could not find applyReadinessToMission(). No changes written.")

if end_marker_pos == -1:
    raise SystemExit("❌ Could not find toPriorityMissions(). No changes written.")

block = text[start:end_marker_pos]

# Common bad leftover caused by replacing a function body:
# function applyReadinessToMission(...) { ... }
#   };
# }
# function toPriorityMissions(...)
bad_patterns = [
    "\n  };\n}\n\n",
    "\n};\n}\n\n",
    "\n  };\n\n",
]

fixed_block = block

for bad in bad_patterns:
    if bad in fixed_block:
        fixed_block = fixed_block.replace(bad, "\n\n", 1)
        print(f"✅ Removed orphan pattern: {bad!r}")
        break
else:
    print("⚠️ No standard orphan brace pattern found. Trying line-based cleanup...")

    lines = fixed_block.splitlines()
    cleaned = []
    removed = False

    for i, line in enumerate(lines):
        stripped = line.strip()

        # Remove one standalone orphan `};` after the real function return block.
        if not removed and stripped == "};":
            remaining = "\n".join(lines[i + 1:])
            if "function toPriorityMissions(" not in remaining:
                cleaned.append(line)
                continue

            removed = True
            print(f"✅ Removed orphan standalone `}};` near applyReadinessToMission at block line {i + 1}.")
            continue

        cleaned.append(line)

    fixed_block = "\n".join(cleaned) + ("\n" if block.endswith("\n") else "")

    if not removed:
        print("⚠️ Could not find an obvious orphan `};`. No line-based removal made.")

updated = text[:start] + fixed_block + text[end_marker_pos:]

# Safety checks
if updated.count("function applyReadinessToMission(") != 1:
    raise SystemExit("❌ Safety check failed: applyReadinessToMission count is not 1. No changes written.")

if updated.count("function toPriorityMissions(") != 1:
    raise SystemExit("❌ Safety check failed: toPriorityMissions count is not 1. No changes written.")

path.write_text(updated)

print("")
print("✅ Syntax cleanup complete.")
print("")
print("Inspect with:")
print("nl -ba src/hooks/useHomeRealtime.js | sed -n '620,650p'")
print("npm run build")
