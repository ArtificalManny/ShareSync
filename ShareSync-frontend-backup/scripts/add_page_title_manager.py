from pathlib import Path

path = Path("src/App.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/App.jsx")

text = path.read_text()
backup = path.with_suffix(".jsx.bak-before-page-title-manager")
backup.write_text(text)

changed = False

import_line = 'import PageTitleManager from "./components/seo/PageTitleManager";\n'

if import_line not in text:
    lines = text.splitlines(True)
    insert_at = 0

    for i, line in enumerate(lines):
        if line.startswith("import "):
            insert_at = i + 1

    lines.insert(insert_at, import_line)
    text = "".join(lines)
    changed = True
    print("✅ Added PageTitleManager import.")
else:
    print("ℹ️ PageTitleManager import already exists.")

if "<PageTitleManager />" not in text:
    if "<Routes" in text:
        text = text.replace("<Routes", "<PageTitleManager />\n      <Routes", 1)
        changed = True
        print("✅ Inserted PageTitleManager before Routes.")
    else:
        print("⚠️ Could not find <Routes in App.jsx. Add <PageTitleManager /> manually inside your Router.")
else:
    print("ℹ️ PageTitleManager already rendered.")

path.write_text(text)

print("")
print("✅ Backup created:", backup)
print("✅ Done." if changed else "✅ No changes needed.")
print("")
print("Inspect:")
print("rg -n \"PageTitleManager|Routes|BrowserRouter\" src/App.jsx -C 4")
