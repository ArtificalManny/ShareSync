from pathlib import Path
import re

path = Path("src/api/focusEngine.js")

if not path.exists():
    raise SystemExit("src/api/focusEngine.js not found.")

text = path.read_text()

# Remove/disable the dangerous fallback that says:
# [API] Priorities empty. Falling back to general active tasks...
# The goal: fresh accounts should see an empty state, not another user's/global tasks.

patterns = [
    re.compile(
        r'''
        if\s*\(\s*[^)]*\.length\s*===\s*0\s*\)\s*\{\s*
        console\.log\(\s*["'`]🟢\s*\[API\]\s*Priorities\s+empty\.\s+Falling\s+back\s+to\s+general\s+active\s+tasks\.\.\.["'`]\s*\)\s*;?
        .*?
        \}
        ''',
        re.DOTALL | re.VERBOSE,
    ),
    re.compile(
        r'''
        if\s*\(\s*[^)]*\.length\s*===\s*0\s*\)\s*\{\s*
        console\.warn\(\s*["'`]\[API\]\s*Priorities\s+empty\.\s+Falling\s+back\s+to\s+general\s+active\s+tasks\.\.\.["'`]\s*\)\s*;?
        .*?
        \}
        ''',
        re.DOTALL | re.VERBOSE,
    ),
]

changed = False

for pattern in patterns:
    new_text, count = pattern.subn(
        '''if (priorities.length === 0) {
    // Home must stay scoped to the logged-in user.
    // Do not fall back to general/global active tasks.
    return [];
  }''',
        text,
        count=1,
    )

    if count:
        text = new_text
        changed = True
        break

if not changed:
    # Safer fallback: direct string replacement around the log message.
    target = "Priorities empty. Falling back to general active tasks"
    if target not in text:
        raise SystemExit("Could not find the global fallback log line. Run rg output and inspect focusEngine.js.")

    lines = text.splitlines()
    hit = next(i for i, line in enumerate(lines) if target in line)

    print("Found fallback log near line", hit + 1)
    print("Manual patch needed. Showing surrounding code:")
    for i in range(max(0, hit - 12), min(len(lines), hit + 35)):
        print(f"{i+1:04d}: {lines[i]}")

    raise SystemExit("Stopped before making unsafe edit.")

path.write_text(text)
print("✅ Disabled focusEngine global active-task fallback.")
