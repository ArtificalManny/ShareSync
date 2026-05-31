from pathlib import Path
import re

root = Path("src")
patterns = [
    "Start working",
    ">Start<",
    "Start</",
    "label: \"Start\"",
    "label: 'Start'",
    "Start",
]

files = []
for path in root.rglob("*"):
    if path.suffix not in [".jsx", ".tsx", ".js", ".ts"]:
        continue

    text = path.read_text(errors="ignore")

    if any(pattern in text for pattern in patterns):
        files.append(path)

print("Possible Start button files:")
print("────────────────────────────")

for path in files:
    text = path.read_text(errors="ignore")
    lines = text.splitlines()

    hits = []
    for i, line in enumerate(lines, start=1):
        if "Start" in line or "start" in line:
            hits.append(i)

    if not hits:
        continue

    print(f"\nFILE: {path}")
    for hit in hits[:8]:
        start = max(1, hit - 8)
        end = min(len(lines), hit + 12)

        print(f"\n--- context around line {hit} ---")
        for n in range(start, end + 1):
            marker = ">>" if n == hit else "  "
            print(f"{marker} {n}: {lines[n-1]}")
