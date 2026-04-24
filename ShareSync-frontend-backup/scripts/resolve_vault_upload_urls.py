from pathlib import Path
import sys

ROOT = Path.cwd()
VAULT_VIEW = ROOT / "src/components/views/VaultView.jsx"

def fail(message):
    print(f"\n[resolve_vault_upload_urls] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[resolve_vault_upload_urls] starting VaultView URL resolver patch")

    if not VAULT_VIEW.exists():
        fail(f"Could not find {VAULT_VIEW}")

    source = VAULT_VIEW.read_text(encoding="utf-8")
    original = source

    old_helper = """function getVaultFileUrl(file) {
  return (
    file?.fileUrl ||
    file?.url ||
    file?.downloadUrl ||
    file?.secureUrl ||
    file?.publicUrl ||
    ''
  );
}
"""

    new_helper = """function getApiOrigin() {
  const rawBase =
    import.meta?.env?.VITE_API_URL ||
    import.meta?.env?.VITE_API_BASE_URL ||
    import.meta?.env?.VITE_BACKEND_URL ||
    '';

  if (!rawBase) return '';

  return String(rawBase)
    .replace(/\\/api\\/?$/, '')
    .replace(/\\/$/, '');
}

function resolveVaultUrl(rawUrl) {
  if (!rawUrl) return '';

  const value = String(rawUrl).trim();
  if (!value) return '';

  if (/^https?:\\/\\//i.test(value)) {
    return value;
  }

  const apiOrigin = getApiOrigin();

  if (value.startsWith('/uploads/')) {
    return apiOrigin ? `${apiOrigin}${value}` : value;
  }

  if (value.startsWith('uploads/')) {
    return apiOrigin ? `${apiOrigin}/${value}` : `/${value}`;
  }

  return value;
}

function getVaultFileUrl(file) {
  return resolveVaultUrl(
    file?.fileUrl ||
    file?.url ||
    file?.downloadUrl ||
    file?.secureUrl ||
    file?.publicUrl ||
    ''
  );
}
"""

    if old_helper in source:
        source = source.replace(old_helper, new_helper, 1)
        print("[resolve_vault_upload_urls] replaced getVaultFileUrl with backend-aware resolver")
    elif "function resolveVaultUrl(rawUrl)" in source:
        print("[resolve_vault_upload_urls] URL resolver already appears present")
    else:
        fail(
            "Could not find the exact getVaultFileUrl helper. "
            "No changes were written. Search manually for `function getVaultFileUrl`."
        )

    if source == original:
        print("[resolve_vault_upload_urls] VaultView.jsx already up to date")
        return

    backup = VAULT_VIEW.with_suffix(VAULT_VIEW.suffix + ".bak-vault-url-resolver")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[resolve_vault_upload_urls] backup created: {backup}")

    VAULT_VIEW.write_text(source, encoding="utf-8")
    print(f"[resolve_vault_upload_urls] patched: {VAULT_VIEW}")

    print("")
    print("[resolve_vault_upload_urls] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  git diff -- src/components/views/VaultView.jsx")

if __name__ == "__main__":
    main()
