from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/components/views/VaultView.jsx")

if not path.exists():
    raise RuntimeError(f"Missing file: {path}")

original = path.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"{path}.backup-before-files-heading-{timestamp}")
shutil.copy2(path, backup)

updated = original

# Change the visible hero heading only.
updated = updated.replace(
    """<h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                  Project Vault
                </h2>""",
    """<h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                  Files
                </h2>"""
)

# Optional: make empty/loading language match the Files tab without touching API/component names.
updated = updated.replace("Loading vault...", "Loading files...")
updated = updated.replace("Vault is empty", "No files yet")

# Safety checks: do NOT rename working internals.
required_markers = [
    "export default function VaultView",
    "getProjectVault",
    "uploadVaultFile",
    "createFolder",
    "renameVaultFile",
    "moveVaultFile",
    "deleteVaultFile",
]

for marker in required_markers:
    if marker not in updated:
        path.write_text(original)
        raise RuntimeError(
            f"Safety check failed: missing {marker}. Original restored. Backup kept at: {backup}"
        )

for forbidden in [
    "FilesView",
    "getProjectFiles",
    "uploadFileFile",
    "loadFiles = async",
]:
    if forbidden in updated:
        path.write_text(original)
        raise RuntimeError(
            f"Unsafe internal rename detected: {forbidden}. Original restored. Backup kept at: {backup}"
        )

if updated == original:
    raise RuntimeError(f"No matching Project Vault heading found. No changes written. Backup kept at: {backup}")

path.write_text(updated)

print("Files heading applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Project Vault heading -> Files")
print("- Loading vault -> Loading files")
print("- Vault is empty -> No files yet")
print("")
print("Kept intact:")
print("- VaultView component name")
print("- vault API helpers")
print("- upload/folder/storage logic")
print("- Files route/tab")
