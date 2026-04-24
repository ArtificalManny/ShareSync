from pathlib import Path
import sys

ROOT = Path.cwd()
VAULT_VIEW = ROOT / "src/components/views/VaultView.jsx"

FILE_CARD_CODE = r"""function FileCard({
  file,
  folders = [],
  onRenameFile,
  onMoveFile,
  onDeleteFile,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fileId = file?._id || file?.id;
  const fileName = file?.originalName || file?.name || 'Untitled file';
  const fileType = getFileType(fileName);
  const style = FILE_ICONS[fileType] || FILE_ICONS.default;
  const Icon = style.icon;

  const rawFileUrl = String(file?.fileUrl || '');
  const fileUrl = getVaultFileUrl(file);
  const isLegacyStorageUrl = /^https?:\/\/storage\.sharesync\.app\//i.test(rawFileUrl);

  const currentFolderId = file?.folderId?._id || file?.folderId || '';

  const canPreviewImage =
    fileType === 'image' &&
    Boolean(fileUrl) &&
    !isLegacyStorageUrl &&
    !imageFailed;

  const createdDate = formatVaultDate(file?.createdAt);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleRenameClick = (event) => {
    event.stopPropagation();
    closeMenu();

    const nextName = window.prompt('Rename file', fileName);

    if (!nextName) return;

    const cleanedName = nextName.trim();

    if (!cleanedName || cleanedName === fileName) return;

    onRenameFile?.(file, cleanedName);
  };

  const handleMoveChange = (event) => {
    event.stopPropagation();

    const nextFolderId = event.target.value || null;

    if ((nextFolderId || '') === String(currentFolderId || '')) {
      return;
    }

    closeMenu();
    onMoveFile?.(file, nextFolderId);
  };

  const handleDeleteClick = (event) => {
    event.stopPropagation();
    closeMenu();

    const confirmed = window.confirm(
      `Delete "${fileName}" from this project? This cannot be undone.`
    );

    if (!confirmed) return;

    onDeleteFile?.(file);
  };

  return (
    <div className="group relative p-4 rounded-xl bg-surface-1 border border-white/[0.06] hover:border-white/[0.12] hover:bg-surface-2 transition-all cursor-pointer">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsMenuOpen((value) => !value);
        }}
        className="
          absolute top-2.5 right-2.5 z-20
          w-8 h-8 rounded-lg
          bg-black/35 hover:bg-black/55 text-white
          opacity-0 group-hover:opacity-100 focus:opacity-100
          flex items-center justify-center
          transition-all
        "
        title="File actions"
        aria-label={`Actions for ${fileName}`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isMenuOpen ? (
        <div
          className="
            absolute top-11 right-2.5 z-30 w-48
            rounded-xl border border-slate-200 dark:border-white/[0.08]
            bg-white dark:bg-[#141418]
            shadow-xl shadow-slate-900/10 dark:shadow-black/30
            overflow-hidden
          "
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleRenameClick}
            className="
              w-full px-3 py-2.5 text-left text-sm
              text-slate-700 dark:text-zinc-200
              hover:bg-slate-50 dark:hover:bg-white/[0.06]
              transition-colors
            "
          >
            Rename
          </button>

          <div className="px-3 py-2.5 border-t border-slate-100 dark:border-white/[0.06]">
            <label className="block text-[11px] uppercase tracking-wide font-semibold text-slate-500 dark:text-zinc-500 mb-1.5">
              Move to
            </label>

            <select
              value={currentFolderId || ''}
              onChange={handleMoveChange}
              className="
                w-full rounded-lg border border-slate-200 dark:border-white/[0.08]
                bg-white dark:bg-[#101014]
                px-2 py-2 text-xs
                text-slate-800 dark:text-zinc-100
                outline-none focus:ring-2 focus:ring-violet-500/30
              "
            >
              <option value="">Project Root</option>
              {folders.map((folder) => (
                <option key={folder?._id || folder?.id} value={folder?._id || folder?.id}>
                  {folder?.name || 'Untitled folder'}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleDeleteClick}
            className="
              w-full px-3 py-2.5 text-left text-sm
              text-red-600 dark:text-red-400
              hover:bg-red-50 dark:hover:bg-red-500/10
              border-t border-slate-100 dark:border-white/[0.06]
              transition-colors
            "
          >
            Delete
          </button>
        </div>
      ) : null}

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
    print(f"\n[rescue_vaultview_filecard_action_menu] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[rescue_vaultview_filecard_action_menu] starting")

    if not VAULT_VIEW.exists():
        fail(f"Could not find {VAULT_VIEW}")

    source = VAULT_VIEW.read_text(encoding="utf-8")
    original = source

    old_import = "import { getProjectVault, createFolder, uploadVaultFile } from '../../api/vault';"
    new_import = "import { getProjectVault, createFolder, uploadVaultFile, renameVaultFile, moveVaultFile, deleteVaultFile } from '../../api/vault';"

    if old_import in source:
        source = source.replace(old_import, new_import, 1)
        print("[rescue_vaultview_filecard_action_menu] added vault action API imports")

    folder_start = source.find("function FolderSection")
    if folder_start == -1:
        fail("Could not find `function FolderSection`. No changes were written.")

    candidate_starts = [
        source.find("function FileCard"),
        source.find("\n) {"),
        source.find("const [imageFailed, setImageFailed]"),
    ]

    valid_starts = [
        index for index in candidate_starts
        if index != -1 and index < folder_start
    ]

    if not valid_starts:
        fail("Could not find FileCard or malformed FileCard fragment before FolderSection.")

    start = min(valid_starts)

    if source[start] == "\n":
        start += 1

    source = source[:start] + FILE_CARD_CODE + "\n\n" + source[folder_start:]
    print("[rescue_vaultview_filecard_action_menu] replaced broken FileCard section")

    danger_slice = source[start:source.find("function FolderSection")]
    if "\n) {" in danger_slice:
        fail("Safety check failed: malformed `) {` still exists before FolderSection. No changes were written.")

    if "function FileCard({" not in source:
        fail("Safety check failed: FileCard signature missing. No changes were written.")

    if "href={file.fileUrl}" in source:
        fail("Safety check failed: raw href={file.fileUrl} still exists. No changes were written.")

    if "isMenuOpen" not in source or "Move to" not in source or "Delete" not in source:
        fail("Safety check failed: action menu markers missing. No changes were written.")

    backup = VAULT_VIEW.with_suffix(VAULT_VIEW.suffix + ".bak-rescue-action-menu-syntax")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[rescue_vaultview_filecard_action_menu] backup created: {backup}")

    VAULT_VIEW.write_text(source, encoding="utf-8")
    print(f"[rescue_vaultview_filecard_action_menu] patched: {VAULT_VIEW}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  sed -n '320,430p' src/components/views/VaultView.jsx")
    print("  rg -n \"function FileCard|\\) \\{|isMenuOpen|Move to|Delete|href=\\{fileUrl\\}|href=\\{file\\.fileUrl\\}\" src/components/views/VaultView.jsx")

if __name__ == "__main__":
    main()
