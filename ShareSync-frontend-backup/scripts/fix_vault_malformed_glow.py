from pathlib import Path

path = Path("src/components/views/VaultView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/VaultView.jsx")

lines = path.read_text().splitlines()

fixed = False
next_lines = []

i = 0
while i < len(lines):
    current = lines[i].strip()
    next_line = lines[i + 1].strip() if i + 1 < len(lines) else ""
    third_line = lines[i + 2].strip() if i + 2 < len(lines) else ""

    if (
        current == "<button"
        and next_line == 'type="button"'
        and "on-opacity duration-300 group-hover:opacity-100 dark:bg-violet-500/10" in third_line
    ):
        indent = lines[i][: len(lines[i]) - len(lines[i].lstrip())]

        next_lines.append(
            indent
            + '<div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-400/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-violet-500/10" />'
        )

        i += 3
        fixed = True
        continue

    next_lines.append(lines[i])
    i += 1

if not fixed:
    raise SystemExit(
        "❌ Could not find the malformed glow block. Run: nl -ba src/components/views/VaultView.jsx | sed -n '185,210p'"
    )

path.write_text("\n".join(next_lines) + "\n")

print("✅ Fixed malformed decorative glow JSX.")
print("✅ Replaced accidental <button> with a proper decorative <div />.")
print("")
print("Inspect:")
print("nl -ba src/components/views/VaultView.jsx | sed -n '188,208p'")
