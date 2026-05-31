from pathlib import Path

ROOT = Path("src")
NEEDLES = [
    "Suggested Projects & Missions",
    "Suggested Projects",
    "Missions",
    "handleShip",
    "Ship</",
    ">Ship<",
    "shipProject",
    "project-branding",
    "logoUrl",
    "ProjectAvatar",
]

def show_window(path, line_no, before=12, after=18):
    lines = path.read_text(errors="ignore").splitlines()
    start = max(0, line_no - before - 1)
    end = min(len(lines), line_no + after)
    print("\n" + "=" * 100)
    print(f"{path}:{line_no}")
    print("=" * 100)
    for i in range(start, end):
        marker = ">>" if i + 1 == line_no else "  "
        print(f"{marker} {i+1:04d}: {lines[i]}")

matches = []

for path in ROOT.rglob("*"):
    if path.suffix not in {".js", ".jsx", ".ts", ".tsx"}:
        continue
    if ".bak" in path.name:
        continue

    text = path.read_text(errors="ignore")
    for needle in NEEDLES:
        if needle in text:
            for idx, line in enumerate(text.splitlines(), start=1):
                if needle in line:
                    matches.append((path, idx, needle))
                    break

seen = set()
for path, line_no, needle in matches:
    key = (str(path), line_no)
    if key in seen:
        continue
    seen.add(key)
    print(f"\nFOUND `{needle}` in {path}:{line_no}")
    show_window(path, line_no)

print("\nDONE. Paste the most relevant output around the component that renders `Suggested Projects & Missions`.")
