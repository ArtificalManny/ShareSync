from pathlib import Path
from datetime import datetime
import re

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-dedupe-home-realtime-helpers-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

HELPERS = [
    "toHomeDateKey",
    "wasProjectShippedTodayForHome",
    "isProjectCompletedForHomeMission",
    "getProjectLogoFieldsForHome",
    "toFiniteHomeNumber",
    "getMissionReadinessScore",
]

def find_matching_brace(src, open_index):
    depth = 0
    in_single = False
    in_double = False
    in_template = False
    escape = False

    for i in range(open_index, len(src)):
        ch = src[i]

        if escape:
            escape = False
            continue

        if ch == "\\":
            escape = True
            continue

        if in_single:
            if ch == "'":
                in_single = False
            continue

        if in_double:
            if ch == '"':
                in_double = False
            continue

        if in_template:
            if ch == "`":
                in_template = False
            continue

        if ch == "'":
            in_single = True
            continue

        if ch == '"':
            in_double = True
            continue

        if ch == "`":
            in_template = True
            continue

        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i

    return -1

def line_start_for(src, index):
    return src.rfind("\n", 0, index) + 1

def find_function_blocks(src, name):
    matches = []
    pattern = re.compile(rf"\bfunction\s+{re.escape(name)}\s*\(")

    for match in pattern.finditer(src):
        start = line_start_for(src, match.start())
        open_brace = src.find("{", match.end())
        if open_brace == -1:
            continue

        close_brace = find_matching_brace(src, open_brace)
        if close_brace == -1:
            continue

        end = close_brace + 1

        # Include trailing semicolon if present.
        if end < len(src) and src[end] == ";":
            end += 1

        # Include one following blank line for cleanliness.
        while end < len(src) and src[end] in "\r\n":
            end += 1

        matches.append((start, end))

    return matches

all_removals = []

for helper in HELPERS:
    blocks = find_function_blocks(text, helper)

    if len(blocks) > 1:
        # Keep the latest helper implementation, remove earlier duplicates.
        blocks_sorted = sorted(blocks, key=lambda item: item[0])
        removals = blocks_sorted[:-1]
        all_removals.extend(removals)
        print(f"✅ {helper}: found {len(blocks)} declarations, removing {len(removals)} older duplicate(s).")
    else:
        print(f"✅ {helper}: {len(blocks)} declaration(s), no duplicate removal needed.")

# Remove from bottom to top so indexes stay valid.
for start, end in sorted(all_removals, key=lambda item: item[0], reverse=True):
    text = text[:start] + text[end:]

path.write_text(text)

print("")
print("✅ Duplicate Home realtime helper declarations removed.")
print("✅ Kept the newest helper implementations.")
print("")
print("Inspect with:")
print("rg -n \"function (toHomeDateKey|wasProjectShippedTodayForHome|isProjectCompletedForHomeMission|getProjectLogoFieldsForHome|toFiniteHomeNumber|getMissionReadinessScore)\" src/hooks/useHomeRealtime.js")
