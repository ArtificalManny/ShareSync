from pathlib import Path

root = Path("src")

needles = [
    "Create New Project",
    "Start building your next big thing",
    "PROJECT BASICS",
    "Smart Start",
]

matches = []

for path in root.rglob("*"):
    if path.suffix not in [".jsx", ".js", ".tsx", ".ts"]:
        continue

    try:
        text = path.read_text()
    except UnicodeDecodeError:
        continue

    if any(needle in text for needle in needles):
        matches.append(path)

if not matches:
    print("❌ No file found containing Create New Project modal text.")
    raise SystemExit(1)

print("✅ Possible Create New Project modal files:")
for i, path in enumerate(matches, start=1):
    print(f"{i}. {path}")

print("\n" + "=" * 90)
print("Relevant snippets:")
print("=" * 90)

for path in matches:
    lines = path.read_text().splitlines()

    interesting_indexes = []
    for idx, line in enumerate(lines):
        if any(needle in line for needle in needles):
            interesting_indexes.append(idx)

    if not interesting_indexes:
        continue

    print(f"\nFILE: {path}")
    print("-" * 90)

    shown_ranges = []

    for idx in interesting_indexes:
        start = max(0, idx - 45)
        end = min(len(lines), idx + 55)

        # Avoid printing identical overlapping blocks too many times.
        overlap = any(start <= prev_end and end >= prev_start for prev_start, prev_end in shown_ranges)
        if overlap:
            continue

        shown_ranges.append((start, end))

        print(f"\n--- lines {start + 1} to {end} ---")
        for line_no in range(start, end):
            print(f"{line_no + 1:04d}: {lines[line_no]}")

print("\n" + "=" * 90)
print("Backdrop candidates across the same files:")
print("=" * 90)

for path in matches:
    lines = path.read_text().splitlines()

    candidates = []
    for idx, line in enumerate(lines):
        if (
            "fixed inset-0" in line
            or "absolute inset-0" in line
            or "backdrop-blur" in line
            or "BackdropFilter" in line
            or "setShow" in line and "false" in line
        ):
            candidates.append(idx)

    if not candidates:
        continue

    print(f"\nFILE: {path}")
    print("-" * 90)

    for idx in candidates:
        start = max(0, idx - 4)
        end = min(len(lines), idx + 8)
        print(f"\n--- around line {idx + 1} ---")
        for line_no in range(start, end):
            print(f"{line_no + 1:04d}: {lines[line_no]}")
