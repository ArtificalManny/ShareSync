from pathlib import Path

path = Path("src/pages/Home.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/pages/Home.jsx")

text = path.read_text()
lines = text.splitlines()

needles = [
    "Daily Pulse",
    "daily pulse",
    "Take 30 seconds",
    "pulse",
    "Pulse",
]

hits = []

for i, line in enumerate(lines):
    if any(needle in line for needle in needles):
        hits.append(i)

if not hits:
    print("✅ No Daily Pulse text found in Home.jsx.")
    raise SystemExit(0)

print("✅ Found possible Daily Pulse references in Home.jsx:")
print()

shown = []

for idx in hits:
    start = max(0, idx - 18)
    end = min(len(lines), idx + 28)

    if any(start <= old_end and end >= old_start for old_start, old_end in shown):
        continue

    shown.append((start, end))

    print("=" * 90)
    print(f"Lines {start + 1} to {end}")
    print("=" * 90)

    for line_no in range(start, end):
        print(f"{line_no + 1:04d}: {lines[line_no]}")

    print()
