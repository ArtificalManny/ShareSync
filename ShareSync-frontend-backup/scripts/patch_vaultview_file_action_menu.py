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
    print(f"\n[patch_vaultview_file_action_menu] ERROR: {message}\n", file=sys.stderr)
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

def main():
    print("[patch_vaultview_file_action_menu] starting")

    if not VAULT_VIEW.exists():
        fail(f"Could not find {VAULT_VIEW}")

    source = VAULT_VIEW.read_text(encoding="utf-8")
    original = source

    old_import = "import { getProjectVault, createFolder, uploadVaultFile } from '../../api/vault';"
    new_import = "import { getProjectVault, createFolder, uploadVaultFile, renameVaultFile, moveVaultFile, deleteVaultFile } from '../../api/vault';"

    if old_import in source:
        source = source.replace(old_import, new_import, 1)
        print("[patch_vaultview_file_action_menu] added vault action API imports")
    elif "renameVaultFile" in source and "moveVaultFile" in source and "deleteVaultFile" in source:
        print("[patch_vaultview_file_action_menu] vault action API imports already appear present")
    else:
        fail("Could not find vault API import anchor. No changes were written.")

    file_card_bounds = find_function_bounds(source, "FileCard")

    if not file_card_bounds:
        fail("Could not locate FileCard function bounds. No changes were written.")

    source = source[:file_card_bounds[0]] + FILE_CARD_CODE + source[file_card_bounds[1]:]
    print("[patch_vaultview_file_action_menu] replaced FileCard with action-menu version")

    old_folder_signature = "function FolderSection({ folder, files, viewMode, isExpanded, onToggle }) {"
    new_folder_signature = "function FolderSection({ folder, files, folders, viewMode, isExpanded, onToggle, onRenameFile, onMoveFile, onDeleteFile }) {"

    if old_folder_signature in source:
        source = source.replace(old_folder_signature, new_folder_signature, 1)
        print("[patch_vaultview_file_action_menu] expanded FolderSection props")
    elif "function FolderSection({ folder, files, folders" in source:
        print("[patch_vaultview_file_action_menu] FolderSection props already appear expanded")
    else:
        fail("Could not find FolderSection signature. No changes were written.")

    old_folder_filecard = "{files.map(file => <FileCard key={file._id} file={file} />)}"
    new_folder_filecard = """{files.map(file => (
            <FileCard
              key={file._id}
              file={file}
              folders={folders}
              onRenameFile={onRenameFile}
              onMoveFile={onMoveFile}
              onDeleteFile={onDeleteFile}
            />
          ))}"""

    if old_folder_filecard in source:
        source = source.replace(old_folder_filecard, new_folder_filecard, 1)
        print("[patch_vaultview_file_action_menu] wired FileCard inside folders")
    elif "onRenameFile={onRenameFile}" in source and "onMoveFile={onMoveFile}" in source:
        print("[patch_vaultview_file_action_menu] Folder FileCard wiring already appears present")
    else:
        fail("Could not find folder FileCard map. No changes were written.")

    handler_anchor = """  const handleUploadFile = async (file, folderId) => {
    try {
      await uploadVaultFile(projectId, folderId, file);
      toast?.({ title: "File uploaded successfully", variant: "success" });
      loadVault();
    } catch (err) {
      // ✅ CATCH HTTP 402 - Trigger Upgrade Modal
      if (err.response?.status === 402) {
        setIsUpgradeModalOpen(true);
      } else {
        toast?.({ title: "Upload failed", description: err.message, variant: "error" });
      }
    }
  };

"""

    handlers_to_insert = """  const handleUploadFile = async (file, folderId) => {
    try {
      await uploadVaultFile(projectId, folderId, file);
      toast?.({ title: "File uploaded successfully", variant: "success" });
      loadVault();
    } catch (err) {
      // ✅ CATCH HTTP 402 - Trigger Upgrade Modal
      if (err.response?.status === 402) {
        setIsUpgradeModalOpen(true);
      } else {
        toast?.({ title: "Upload failed", description: err.message, variant: "error" });
      }
    }
  };

  const handleRenameFile = async (file, originalName) => {
    const fileId = file?._id || file?.id;

    if (!fileId) {
      toast?.({ title: "Rename failed", description: "File ID is missing.", variant: "error" });
      return;
    }

    try {
      await renameVaultFile(fileId, originalName);
      toast?.({ title: "File renamed", variant: "success" });
      await loadVault();
    } catch (err) {
      toast?.({
        title: "Rename failed",
        description: err?.response?.data?.message || err?.message || "Unable to rename file.",
        variant: "error",
      });
    }
  };

  const handleMoveFile = async (file, folderId) => {
    const fileId = file?._id || file?.id;

    if (!fileId) {
      toast?.({ title: "Move failed", description: "File ID is missing.", variant: "error" });
      return;
    }

    try {
      await moveVaultFile(fileId, folderId || null);
      toast?.({ title: folderId ? "File moved" : "File moved to Project Root", variant: "success" });
      await loadVault();
    } catch (err) {
      toast?.({
        title: "Move failed",
        description: err?.response?.data?.message || err?.message || "Unable to move file.",
        variant: "error",
      });
    }
  };

  const handleDeleteFile = async (file) => {
    const fileId = file?._id || file?.id;

    if (!fileId) {
      toast?.({ title: "Delete failed", description: "File ID is missing.", variant: "error" });
      return;
    }

    try {
      await deleteVaultFile(fileId);
      toast?.({ title: "File deleted", variant: "success" });
      await loadVault();
    } catch (err) {
      toast?.({
        title: "Delete failed",
        description: err?.response?.data?.message || err?.message || "Unable to delete file.",
        variant: "error",
      });
    }
  };

"""

    if "const handleRenameFile = async" not in source:
        if handler_anchor not in source:
            fail("Could not find handleUploadFile anchor. No changes were written.")

        source = source.replace(handler_anchor, handlers_to_insert, 1)
        print("[patch_vaultview_file_action_menu] added rename/move/delete handlers")
    else:
        print("[patch_vaultview_file_action_menu] rename/move/delete handlers already appear present")

    old_root_filecard = "{rootFiles.map(file => <FileCard key={file._id} file={file} />)}"
    new_root_filecard = """{rootFiles.map(file => (
                <FileCard
                  key={file._id}
                  file={file}
                  folders={data.folders}
                  onRenameFile={handleRenameFile}
                  onMoveFile={handleMoveFile}
                  onDeleteFile={handleDeleteFile}
                />
              ))}"""

    if old_root_filecard in source:
        source = source.replace(old_root_filecard, new_root_filecard, 1)
        print("[patch_vaultview_file_action_menu] wired root FileCard actions")
    elif "folders={data.folders}" in source and "onDeleteFile={handleDeleteFile}" in source:
        print("[patch_vaultview_file_action_menu] root FileCard wiring already appears present")
    else:
        fail("Could not find root FileCard map. No changes were written.")

    old_folder_section = """          <FolderSection
            key={folder._id}
            folder={folder}
            files={filteredFiles.filter(f => f.folderId === folder._id)}
            isExpanded={expandedFolders.includes(folder._id)}
            onToggle={() =>
              setExpandedFolders(prev =>
                prev.includes(folder._id)
                  ? prev.filter(id => id !== folder._id)
                  : [...prev, folder._id]
              )
            }
          />"""

    new_folder_section = """          <FolderSection
            key={folder._id}
            folder={folder}
            folders={data.folders}
            files={filteredFiles.filter(f => f.folderId === folder._id)}
            isExpanded={expandedFolders.includes(folder._id)}
            onRenameFile={handleRenameFile}
            onMoveFile={handleMoveFile}
            onDeleteFile={handleDeleteFile}
            onToggle={() =>
              setExpandedFolders(prev =>
                prev.includes(folder._id)
                  ? prev.filter(id => id !== folder._id)
                  : [...prev, folder._id]
              )
            }
          />"""

    if old_folder_section in source:
        source = source.replace(old_folder_section, new_folder_section, 1)
        print("[patch_vaultview_file_action_menu] wired FolderSection actions")
    elif "onRenameFile={handleRenameFile}" in source and "folders={data.folders}" in source:
        print("[patch_vaultview_file_action_menu] FolderSection action wiring already appears present")
    else:
        fail("Could not find FolderSection usage block. No changes were written.")

    required_markers = [
        "renameVaultFile",
        "moveVaultFile",
        "deleteVaultFile",
        "isMenuOpen",
        "handleRenameFile",
        "handleMoveFile",
        "handleDeleteFile",
        "Move to",
        "Delete",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    backup = VAULT_VIEW.with_suffix(VAULT_VIEW.suffix + ".bak-file-action-menu")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[patch_vaultview_file_action_menu] backup created: {backup}")

    VAULT_VIEW.write_text(source, encoding="utf-8")
    print(f"[patch_vaultview_file_action_menu] patched: {VAULT_VIEW}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"renameVaultFile|moveVaultFile|deleteVaultFile|isMenuOpen|handleRenameFile|handleMoveFile|handleDeleteFile|Move to|Delete\" src/components/views/VaultView.jsx")
    print("  git diff -- src/components/views/VaultView.jsx")

if __name__ == "__main__":
    main()
