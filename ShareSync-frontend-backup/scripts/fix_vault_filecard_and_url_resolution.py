from pathlib import Path
import sys

ROOT = Path.cwd()
VAULT_VIEW = ROOT / "src/components/views/VaultView.jsx"

REPLACEMENT_BLOCK = r"""function getApiOrigin() {
  const rawBase =
    import.meta?.env?.VITE_API_URL ||
    import.meta?.env?.VITE_API_BASE_URL ||
    import.meta?.env?.VITE_BACKEND_URL ||
    '';

  if (rawBase) {
    return String(rawBase)
      .replace(/\/api\/?$/, '')
      .replace(/\/$/, '');
  }

  // Safe local-dev fallback:
  // Vite is running on localhost:54693, but uploaded files are served by Nest.
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return 'http://localhost:3000';
  }

  return '';
}

function resolveVaultUrl(rawUrl) {
  if (!rawUrl) return '';

  const value = String(rawUrl).trim();
  if (!value) return '';

  const apiOrigin = getApiOrigin();

  // Legacy broken records. These were generated before the backend URL fix.
  if (/^https?:\/\/storage\.sharesync\.app\//i.test(value)) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

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

function formatVaultDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

function FileCard({ file }) {
  const [imageFailed, setImageFailed] = useState(false);
  const fileName = file?.originalName || file?.name || 'Untitled file';
  const fileType = getFileType(fileName);
  const style = FILE_ICONS[fileType] || FILE_ICONS.default;
  const Icon = style.icon;

  const rawFileUrl = String(file?.fileUrl || '');
  const fileUrl = getVaultFileUrl(file);
  const isLegacyStorageUrl = /^https?:\/\/storage\.sharesync\.app\//i.test(rawFileUrl);

  const canPreviewImage =
    fileType === 'image' &&
    Boolean(fileUrl) &&
    !isLegacyStorageUrl &&
    !imageFailed;

  const createdDate = formatVaultDate(file?.createdAt);

  return (
    <div className="group p-4 rounded-xl bg-surface-1 border border-white/[0.06] hover:border-white/[0.12] hover:bg-surface-2 transition-all cursor-pointer">
      <div
        className={`
          w-full aspect-square rounded-lg flex items-center justify-center mb-3
          relative overflow-hidden
          ${canPreviewImage ? 'bg-slate-100 dark:bg-surface-2' : style.bg}
        `}
      >
        {canPreviewImage ? (
          <img
            src={fileUrl}
            alt={fileName}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Icon className={`w-10 h-10 ${style.color}`} />
        )}

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
          {isLegacyStorageUrl ? (
            <span className="px-2 py-1 rounded-md bg-white/10 text-white text-xs text-center">
              Re-upload needed
            </span>
          ) : fileUrl ? (
            <>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Open preview"
                aria-label={`Open ${fileName}`}
              >
                <Eye className="w-5 h-5" />
              </a>

              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                download={fileName}
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Download file"
                aria-label={`Download ${fileName}`}
              >
                <Download className="w-5 h-5" />
              </a>
            </>
          ) : (
            <span className="px-2 py-1 rounded-md bg-white/10 text-white text-xs">
              No preview
            </span>
          )}
        </div>
      </div>

      <div>
        <h4
          className="font-medium text-slate-900 dark:text-text-primary text-sm truncate mb-1"
          title={fileName}
        >
          {fileName}
        </h4>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-text-tertiary">
          <span>{formatBytes(file?.sizeInBytes || file?.size || 0)}</span>
          {createdDate ? (
            <>
              <span>•</span>
              <span>{createdDate}</span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
"""

def fail(message):
    print(f"\n[fix_vault_filecard_and_url_resolution] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[fix_vault_filecard_and_url_resolution] starting")

    if not VAULT_VIEW.exists():
        fail(f"Could not find {VAULT_VIEW}")

    source = VAULT_VIEW.read_text(encoding="utf-8")
    original = source

    folder_section_index = source.find("function FolderSection")
    if folder_section_index == -1:
        fail("Could not find `function FolderSection`. No changes were written.")

    candidate_starts = [
        source.find("function getApiOrigin"),
        source.find("function resolveVaultUrl"),
        source.find("function getVaultFileUrl"),
        source.find("function formatVaultDate"),
        source.find("function FileCard"),
        source.find("\n) {"),
    ]

    valid_starts = [
        index for index in candidate_starts
        if index != -1 and index < folder_section_index
    ]

    if not valid_starts:
        fail("Could not locate the helper/FileCard block before FolderSection. No changes were written.")

    start = min(valid_starts)

    # If the malformed block starts with a newline before `) {`, trim from the `) {` itself.
    if source[start] == "\n":
        start += 1

    patched = source[:start] + REPLACEMENT_BLOCK + "\n\n" + source[folder_section_index:]

    danger_slice = patched[start:patched.find("function FolderSection")]
    if "\n) {" in danger_slice:
        fail("Safety check failed: malformed `) {` still exists before FolderSection. No changes were written.")

    if "function FileCard({ file }) {" not in patched:
        fail("Safety check failed: FileCard signature missing. No changes were written.")

    if "href={file.fileUrl}" in patched:
        fail("Safety check failed: raw href={file.fileUrl} still exists. No changes were written.")

    backup = VAULT_VIEW.with_suffix(VAULT_VIEW.suffix + ".bak-final-vault-filecard-url-fix")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[fix_vault_filecard_and_url_resolution] backup created: {backup}")

    VAULT_VIEW.write_text(patched, encoding="utf-8")
    print(f"[fix_vault_filecard_and_url_resolution] patched: {VAULT_VIEW}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"function FileCard|href=\\{fileUrl\\}|href=\\{file\\.fileUrl\\}|isLegacyStorageUrl|storage\\.sharesync\\.app|getApiOrigin\" src/components/views/VaultView.jsx")

if __name__ == "__main__":
    main()
