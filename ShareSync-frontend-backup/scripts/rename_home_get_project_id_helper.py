from pathlib import Path
from datetime import datetime
import re

path = Path("src/pages/Home.jsx")

if not path.exists():
    raise SystemExit(f"❌ Missing file: {path}")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-rename-home-get-project-id-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

def find_function_blocks(source, function_name):
    needle = f"function {function_name}("
    blocks = []
    search_from = 0

    while True:
        start = source.find(needle, search_from)
        if start == -1:
            break

        open_brace = source.find("{", start)
        if open_brace == -1:
            break

        depth = 0
        end = None

        for i in range(open_brace, len(source)):
            char = source[i]

            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    end = i + 1

                    # Include following blank lines/newline for clean removal.
                    while end < len(source) and source[end] in "\n\r":
                        end += 1
                    break

        if end is None:
            break

        blocks.append((start, end))
        search_from = end

    return blocks

blocks = find_function_blocks(text, "getProjectId")

if not blocks:
    print("⚠️ No `function getProjectId(...)` block found in Home.jsx.")
    print("Will only update call sites if needed.")
else:
    # Remove duplicate function blocks after the first one.
    for start, end in reversed(blocks[1:]):
        text = text[:start] + text[end:]

    # Rename the remaining Home-local helper.
    text = text.replace("function getProjectId(", "function getHomeProjectId(", 1)

# Update Home.jsx call sites to use the renamed helper.
text = re.sub(r"\bgetProjectId\s*\(", "getHomeProjectId(", text)

# Safety checks.
if "function getProjectId(" in text:
    raise SystemExit("❌ Safety check failed: `function getProjectId` still exists in Home.jsx. No changes written.")

if "getHomeProjectId(" not in text:
    raise SystemExit("❌ Safety check failed: `getHomeProjectId` was not created/used. No changes written.")

path.write_text(text)

print("✅ Home.jsx getProjectId collision fixed.")
print("✅ Local helper renamed to getHomeProjectId.")
print("✅ Home.jsx call sites updated.")
print("✅ Backend untouched.")
print("")
print("Inspect with:")
print('rg -n "\\bgetProjectId\\b|\\bgetHomeProjectId\\b" src/pages/Home.jsx -C 4')
