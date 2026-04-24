from pathlib import Path
import sys

ROOT = Path.cwd()
VAULT_VIEW = ROOT / "src/components/views/VaultView.jsx"

def fail(message):
    print(f"\n[apply_vault_preview_and_url_resolver] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[apply_vault_preview_and_url_resolver] starting")

    if not VAULT_VIEW.exists():
        fail(f"Could not find {VAULT_VIEW}")

    source = VAULT_VIEW.read_text(encoding="utf-8")
    original = source

    helper_anchor = """function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

"""

    helper_insert = """function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getApiOrigin() {
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

"""

    if "function getVaultFileUrl(file)" not in source:
        if helper_anchor not in source:
            fail("Could not find formatBytes helper anchor. No changes were written.")
        source = source.replace(helper_anchor, helper_insert, 1)
        print("[apply_vault_preview_and_url_resolver] added URL resolver helpers")
    else:
        print("[apply_vault_preview_and_url_resolver] URL resolver helper already present")

    old_file_card = """function FileCard({ file }) {
  const fileType = getFileType(file.originalName);
  const style = FILE_ICONS[fileType];
  const Icon = style.icon;
  
  return (
    <div className="group p-4 rounded-xl bg-surface-1 border border-white/[0.06] hover:border-white/[0.12] hover:bg-surface-2 transition-all cursor-pointer">
      <div className={`w-full aspect-square rounded-lg ${style.bg} flex items-center justify-center mb-3 relative overflow-hidden`}>
        <Icon className={`w-10 h-10 ${style.color}`} />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
          <a href={file.fileUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* LIGHT MODE CONTRAST FIX: filename + file meta */}
      <div>
        <h4
          className="font-medium text-slate-900 dark:text-text-primary text-sm truncate mb-1"
          title={file.originalName}
        >
          {file.originalName}
        </h4>
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-text-tertiary">
          <span>{formatBytes(file.sizeInBytes)}</span>
          <span>•</span>
          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
"""

    new_file_card = """function FileCard({ file }) {
  const [imageFailed, setImageFailed] = useState(false);
  const fileName = file?.originalName || file?.name || 'Untitled file';
  const fileType = getFileType(fileName);
  const style = FILE_ICONS[fileType] || FILE_ICONS.default;
  const Icon = style.icon;
  const fileUrl = getVaultFileUrl(file);
  const isLegacyStorageUrl = /^https?:\\/\\/storage\\.sharesync\\.app\\//i.test(String(file?.fileUrl || ''));
  const canPreviewImage = fileType === 'image' && Boolean(fileUrl) && !isLegacyStorageUrl && !imageFailed;
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

    if old_file_card in source:
        source = source.replace(old_file_card, new_file_card, 1)
        print("[apply_vault_preview_and_url_resolver] replaced old FileCard")
    elif "const isLegacyStorageUrl" in source:
        print("[apply_vault_preview_and_url_resolver] FileCard already appears patched")
    else:
        fail("Could not find exact old FileCard block. No changes were written.")

    if source == original:
        print("[apply_vault_preview_and_url_resolver] no changes needed")
        return

    backup = VAULT_VIEW.with_suffix(VAULT_VIEW.suffix + ".bak-preview-url-resolver")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[apply_vault_preview_and_url_resolver] backup created: {backup}")

    VAULT_VIEW.write_text(source, encoding="utf-8")
    print(f"[apply_vault_preview_and_url_resolver] patched: {VAULT_VIEW}")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"getVaultFileUrl|isLegacyStorageUrl|href=\\{fileUrl\\}|href=\\{file\\.fileUrl\\}\" src/components/views/VaultView.jsx")

if __name__ == "__main__":
    main()
