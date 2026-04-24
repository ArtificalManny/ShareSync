from pathlib import Path
import sys

ROOT = Path.cwd()
VAULT_VIEW = ROOT / "src/components/views/VaultView.jsx"

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
    print(f"\n[rescue_vault_filecard_syntax] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[rescue_vault_filecard_syntax] starting")

    if not VAULT_VIEW.exists():
        fail(f"Could not find {VAULT_VIEW}")

    source = VAULT_VIEW.read_text(encoding="utf-8")
    original = source

    folder_section_index = source.find("function FolderSection")
    if folder_section_index == -1:
        fail("Could not find `function FolderSection`. No changes were written.")

    filecard_index = source.find("function FileCard")
    malformed_index = source.find("\n) {")
    image_failed_index = source.find("const [imageFailed, setImageFailed]")

    if filecard_index != -1 and filecard_index < folder_section_index:
        start = filecard_index
        print("[rescue_vault_filecard_syntax] found existing FileCard start")
    elif malformed_index != -1 and malformed_index < folder_section_index:
        start = malformed_index + 1
        print("[rescue_vault_filecard_syntax] found malformed `) {` FileCard start")
    elif image_failed_index != -1 and image_failed_index < folder_section_index:
        line_start = source.rfind("\n", 0, image_failed_index)
        start = line_start + 1
        print("[rescue_vault_filecard_syntax] found imageFailed FileCard body start")
    else:
        fail(
            "Could not locate FileCard or malformed FileCard body before FolderSection. "
            "No changes were written."
        )

    source = source[:start] + FILE_CARD_CODE + "\n\n" + source[folder_section_index:]

    if "\n) {" in source[source.find("function formatBytes"):source.find("function FolderSection")]:
        fail("Safety check failed: malformed `) {` still exists before FolderSection. No changes were written.")

    if "function FileCard({ file }) {" not in source:
        fail("Safety check failed: repaired FileCard signature was not inserted. No changes were written.")

    backup = VAULT_VIEW.with_suffix(VAULT_VIEW.suffix + ".bak-rescue-filecard-syntax")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[rescue_vault_filecard_syntax] backup created: {backup}")

    VAULT_VIEW.write_text(source, encoding="utf-8")
    print(f"[rescue_vault_filecard_syntax] patched: {VAULT_VIEW}")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  sed -n '180,300p' src/components/views/VaultView.jsx")
    print("  rg -n \"function FileCard|href=\\{fileUrl\\}|href=\\{file\\.fileUrl\\}|isLegacyStorageUrl|\\) \\{\" src/components/views/VaultView.jsx")

if __name__ == "__main__":
    main()
