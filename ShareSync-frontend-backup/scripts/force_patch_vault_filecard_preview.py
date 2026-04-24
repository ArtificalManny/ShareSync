from pathlib import Path
import sys

ROOT = Path.cwd()
VAULT_VIEW = ROOT / "src/components/views/VaultView.jsx"

GET_API_ORIGIN_CODE = """function getApiOrigin() {
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
"""

RESOLVE_VAULT_URL_CODE = """function resolveVaultUrl(rawUrl) {
  if (!rawUrl) return '';

  const value = String(rawUrl).trim();
  if (!value) return '';

  const apiOrigin = getApiOrigin();

  if (/^https?:\\/\\/storage\\.sharesync\\.app\\//i.test(value)) {
    return value;
  }

  if (/^https?:\\/\\//i.test(value)) {
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
"""

GET_VAULT_FILE_URL_CODE = """function getVaultFileUrl(file) {
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

FORMAT_VAULT_DATE_CODE = """function formatVaultDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}
"""

FILE_CARD_CODE = """function FileCard({ file }) {
  const [imageFailed, setImageFailed] = useState(false);
  const fileName = file?.originalName || file?.name || 'Untitled file';
  const fileType = getFileType(fileName);
  const style = FILE_ICONS[fileType] || FILE_ICONS.default;
  const Icon = style.icon;
  const rawFileUrl = String(file?.fileUrl || '');
  const fileUrl = getVaultFileUrl(file);
  const isLegacyStorageUrl = /^https?:\\/\\/storage\\.sharesync\\.app\\//i.test(rawFileUrl);
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

      {/* LIGHT MODE CONTRAST FIX: filename + file meta */}
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
    print(f"\n[force_patch_vault_filecard_preview] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def find_function_bounds(source: str, function_name: str):
    signature = f"function {function_name}"
    start = source.find(signature)

    if start == -1:
        return None

    brace_start = source.find("{", start)
    if brace_start == -1:
        return None

    depth = 0
    for index in range(brace_start, len(source)):
        char = source[index]

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1

            if depth == 0:
                return start, index + 1

    return None

def replace_or_insert_function(source: str, function_name: str, code: str, insert_before: str):
    bounds = find_function_bounds(source, function_name)

    if bounds:
        start, end = bounds
        return source[:start] + code + source[end:]

    insert_at = source.find(insert_before)
    if insert_at == -1:
        fail(f"Could not find insertion point `{insert_before}` for missing helper `{function_name}`.")

    return source[:insert_at] + code + "\n\n" + source[insert_at:]

def main():
    print("[force_patch_vault_filecard_preview] starting")

    if not VAULT_VIEW.exists():
        fail(f"Could not find {VAULT_VIEW}")

    source = VAULT_VIEW.read_text(encoding="utf-8")
    original = source

    if "function FileCard" not in source:
        fail("Could not find function FileCard in VaultView.jsx. No changes were written.")

    # Keep this precise: replace helper functions if they exist, otherwise insert them before FileCard.
    source = replace_or_insert_function(source, "getApiOrigin", GET_API_ORIGIN_CODE, "function FileCard")
    source = replace_or_insert_function(source, "resolveVaultUrl", RESOLVE_VAULT_URL_CODE, "function FileCard")
    source = replace_or_insert_function(source, "getVaultFileUrl", GET_VAULT_FILE_URL_CODE, "function FileCard")
    source = replace_or_insert_function(source, "formatVaultDate", FORMAT_VAULT_DATE_CODE, "function FileCard")

    # Replace the entire FileCard safely by function boundary.
    source = replace_or_insert_function(source, "FileCard", FILE_CARD_CODE, "function FolderSection")

    if "href={file.fileUrl}" in source:
        fail("Patch safety check failed: `href={file.fileUrl}` still exists. No changes were written.")

    if "const isLegacyStorageUrl" not in source:
        fail("Patch safety check failed: legacy storage guard was not inserted. No changes were written.")

    if source == original:
        print("[force_patch_vault_filecard_preview] VaultView.jsx already up to date")
        return

    backup = VAULT_VIEW.with_suffix(VAULT_VIEW.suffix + ".bak-force-filecard-preview")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[force_patch_vault_filecard_preview] backup created: {backup}")

    VAULT_VIEW.write_text(source, encoding="utf-8")
    print(f"[force_patch_vault_filecard_preview] patched: {VAULT_VIEW}")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"href=\\{file\\.fileUrl\\}|href=\\{fileUrl\\}|isLegacyStorageUrl|function FileCard|function getVaultFileUrl\" src/components/views/VaultView.jsx")

if __name__ == "__main__":
    main()
