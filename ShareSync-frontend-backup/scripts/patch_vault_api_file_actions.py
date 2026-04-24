from pathlib import Path
import sys

ROOT = Path.cwd()
VAULT_API = ROOT / "src/api/vault.js"

VAULT_API_CODE = """import client from './client';

export const getProjectVault = async (projectId) => {
  const response = await client.get(`/vault/project/${projectId}`);
  return response.data?.data;
};

export const createFolder = async (projectId, name, isPrivate) => {
  const response = await client.post('/vault/folders', {
    projectId,
    name,
    accessLevel: isPrivate ? 'private' : 'public',
  });
  return response.data?.data;
};

export const uploadVaultFile = async (projectId, folderId, file) => {
  const formData = new FormData();
  formData.append('projectId', projectId);
  if (folderId) formData.append('folderId', folderId);
  formData.append('file', file);

  const response = await client.post('/vault/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data?.data;
};

export const renameVaultFile = async (fileId, originalName) => {
  const response = await client.patch(`/vault/files/${fileId}`, {
    originalName,
  });
  return response.data?.data;
};

export const moveVaultFile = async (fileId, folderId) => {
  const response = await client.patch(`/vault/files/${fileId}/move`, {
    folderId: folderId || null,
  });
  return response.data?.data;
};

export const deleteVaultFile = async (fileId) => {
  const response = await client.delete(`/vault/files/${fileId}`);
  return response.data;
};

export default {
  getProjectVault,
  createFolder,
  uploadVaultFile,
  renameVaultFile,
  moveVaultFile,
  deleteVaultFile,
};
"""

def fail(message):
    print(f"\\n[patch_vault_api_file_actions] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[patch_vault_api_file_actions] starting")

    if not VAULT_API.exists():
        fail(f"Could not find {VAULT_API}")

    original = VAULT_API.read_text(encoding="utf-8")

    required_existing = [
        "export const getProjectVault",
        "export const createFolder",
        "export const uploadVaultFile",
    ]

    for marker in required_existing:
        if marker not in original:
            fail(
                f"Expected existing API function marker not found: {marker}. "
                "No changes were written."
            )

    if (
        "export const renameVaultFile" in original and
        "export const moveVaultFile" in original and
        "export const deleteVaultFile" in original
    ):
        print("[patch_vault_api_file_actions] vault API file actions already exist")
        return

    backup = VAULT_API.with_suffix(VAULT_API.suffix + ".bak-file-actions")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[patch_vault_api_file_actions] backup created: {backup}")

    VAULT_API.write_text(VAULT_API_CODE, encoding="utf-8")
    print(f"[patch_vault_api_file_actions] patched: {VAULT_API}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  sed -n '1,220p' src/api/vault.js")
    print("  git diff -- src/api/vault.js")

if __name__ == "__main__":
    main()
