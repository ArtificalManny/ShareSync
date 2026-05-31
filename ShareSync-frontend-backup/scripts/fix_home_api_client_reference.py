from pathlib import Path
from datetime import datetime

path = Path("src/api/home.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-fix-client-reference-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# Case 1: home.js already imports api from ./client, so use api.post instead of client.post
if "import api from './client'" in text or 'import api from "./client"' in text:
    text = text.replace("client.post(`/projects/${projectId}/complete`, payload)", "api.post(`/projects/${projectId}/complete`, payload)")
    print("✅ Found existing api import. Replaced client.post(...) with api.post(...).")

# Case 2: home.js has no client/api import, add client import
elif "from './client'" not in text and 'from "./client"' not in text:
    lines = text.splitlines()
    insert_at = 0

    # Put import after leading comments, before first non-comment code
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("//") or stripped == "":
            continue
        insert_at = i
        break

    lines.insert(insert_at, "import client from './client';")
    text = "\n".join(lines) + "\n"
    print("✅ Added import client from './client';")

# Case 3: another named/default import exists; safest is to add client import unless already present
elif "import client from './client'" not in text and 'import client from "./client"' not in text:
    lines = text.splitlines()
    insert_at = 0

    for i, line in enumerate(lines):
        if line.startswith("import "):
            insert_at = i + 1

    lines.insert(insert_at, "import client from './client';")
    text = "\n".join(lines) + "\n"
    print("✅ Added client import after existing imports.")

if "client.post(`/projects/${projectId}/complete`, payload)" in text and "import client from './client'" not in text and 'import client from "./client"' not in text:
    raise SystemExit("❌ Safety check failed: client.post remains but client import is missing.")

if "api.post(`/projects/${projectId}/complete`, payload)" in text and ("import api from './client'" not in text and 'import api from "./client"' not in text):
    raise SystemExit("❌ Safety check failed: api.post exists but api import is missing.")

path.write_text(text)

print("✅ home.js client reference fixed.")
print("")
print("Inspect with:")
print("sed -n '1,30p' src/api/home.js")
print("rg -n \"tryShipProject|client.post|api.post|Project ship failed\" src/api/home.js -C 8")
