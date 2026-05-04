from pathlib import Path
import re

path = Path("src/App.jsx")
text = path.read_text()

# Add import if missing.
if "GoogleCallback" not in text:
    # Prefer placing near other page imports.
    lines = text.splitlines()
    insert_idx = None

    for i, line in enumerate(lines):
        if "from './pages/Login" in line or 'from "./pages/Login' in line:
            insert_idx = i + 1
            break

    if insert_idx is None:
        for i, line in enumerate(lines):
            if line.startswith("import ") and "from " in line:
                insert_idx = i + 1

    if insert_idx is None:
        raise SystemExit("Could not find import section in App.jsx.")

    lines.insert(insert_idx, 'import GoogleCallback from "./pages/GoogleCallback.jsx";')
    text = "\n".join(lines) + "\n"

# Add route if missing.
if 'path="/auth/google/callback"' not in text:
    route = '              <Route path="/auth/google/callback" element={<GoogleCallback />} />'

    anchors = [
        '              <Route path="/login"',
        '              <Route path="/register"',
        '              <Route path="/landing"',
    ]

    inserted = False
    for anchor in anchors:
        idx = text.find(anchor)
        if idx != -1:
            line_start = text.rfind("\n", 0, idx)
            text = text[:line_start + 1] + route + "\n" + text[line_start + 1:]
            inserted = True
            break

    if not inserted:
        raise SystemExit("Could not find route anchor in App.jsx.")

path.write_text(text)
print("Ensured /auth/google/callback route in App.jsx")
