from pathlib import Path

roots = [Path("src")]
matches = []

for root in roots:
    for path in root.rglob("*"):
        if path.suffix not in [".jsx", ".tsx", ".js", ".ts"]:
            continue
        if any(part in {"node_modules", "dist", ".git"} for part in path.parts):
            continue

        text = path.read_text(errors="ignore")
        if "Start" not in text and "onStart" not in text and "start" not in text:
            continue

        lines = text.splitlines()
        for i, line in enumerate(lines, start=1):
            if "Start" in line or "onStart" in line or "stack-task-action" in line:
                matches.append((path, i, line.strip()))

print(f"Found {len(matches)} possible matches:")
print("")

for path, line_no, line in matches[:120]:
    print(f"{path}:{line_no}: {line}")

print("")
print("Next: paste this output into ChatGPT.")
