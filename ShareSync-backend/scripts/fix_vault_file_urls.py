from pathlib import Path
import sys

ROOT = Path.cwd()
VAULT_SERVICE = ROOT / "src/vault/vault.service.ts"

def fail(message):
    print(f"\n[fix_vault_file_urls] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[fix_vault_file_urls] starting backend vault URL patch")

    if not VAULT_SERVICE.exists():
        fail(f"Could not find {VAULT_SERVICE}")

    source = VAULT_SERVICE.read_text(encoding="utf-8")
    original = source

    old_line = "    const mockFileUrl = `https://storage.sharesync.app/${projectId}/${Date.now()}-${file.originalname}`;\n"

    new_block = """    // IMPORTANT:
    // Multer already saved the uploaded file to /uploads using file.filename.
    // Do not store a fake external storage domain here. The frontend can resolve
    // this relative URL against the backend origin for preview/download.
    const storedFilename = file.filename || file.originalname;
    const fileUrl = `/uploads/${storedFilename}`;
"""

    if old_line in source:
        source = source.replace(old_line, new_block, 1)
        print("[fix_vault_file_urls] replaced fake storage.sharesync.app URL with /uploads URL")
    elif "const fileUrl = `/uploads/${storedFilename}`;" in source:
        print("[fix_vault_file_urls] vault URL logic already appears patched")
    else:
        fail(
            "Could not find the exact mockFileUrl line in vault.service.ts. "
            "No changes were written. Search manually for storage.sharesync.app."
        )

    old_save = "      fileUrl: mockFileUrl,"
    new_save = "      fileUrl,"

    if old_save in source:
        source = source.replace(old_save, new_save, 1)
        print("[fix_vault_file_urls] updated saved fileUrl field")
    elif new_save in source:
        print("[fix_vault_file_urls] saved fileUrl field already appears patched")
    else:
        fail(
            "Could not find `fileUrl: mockFileUrl,` in vault.service.ts. "
            "No changes were written."
        )

    if source == original:
        print("[fix_vault_file_urls] vault.service.ts already up to date")
        return

    backup = VAULT_SERVICE.with_suffix(VAULT_SERVICE.suffix + ".bak-vault-file-urls")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[fix_vault_file_urls] backup created: {backup}")

    VAULT_SERVICE.write_text(source, encoding="utf-8")
    print(f"[fix_vault_file_urls] patched: {VAULT_SERVICE}")

    print("")
    print("[fix_vault_file_urls] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"storage\\.sharesync\\.app|fileUrl|/uploads\" src/vault/vault.service.ts")

if __name__ == "__main__":
    main()
