from pathlib import Path
from datetime import datetime

path = Path("src/components/views/VaultView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/VaultView.jsx")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-vault-visual-polish-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

def replace_between(source, start_marker, end_marker, replacement):
    start = source.find(start_marker)
    if start == -1:
        raise SystemExit(f"❌ Could not find start marker: {start_marker}")

    end = source.find(end_marker, start)
    if end == -1:
        raise SystemExit(f"❌ Could not find end marker after {start_marker}: {end_marker}")

    return source[:start] + replacement + source[end:]

new_file_card = r'''function FileCard({
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
    <div className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_28px_70px_rgba(124,58,237,0.16)] dark:border-white/[0.08] dark:bg-white/[0.045] dark:shadow-black/25 dark:hover:border-violet-400/25">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-400/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100 dark:bg-violet-500/10" />

      <button
        type="button"
        on-opacity duration-300 group-hover:opacity-100 dark:bg-violet-500/10" />

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsMenuOpen((value) => !value);
        }}
        className="
          absolute right-4 top-4 z-20
          flex h-9 w-9 items-center justify-center rounded-2xl
          border border-white/70 bg-white/85 text-slate-600
          opacity-0 shadow-lg shadow-slate-900/10 backdrop-blur-xl
          transition-all hover:-translate-y-0.5 hover:text-slate-950
          group-hover:opacity-100 focus:opacity-100
          dark:border-white/[0.1] dark:bg-black/35 dark:text-white
          dark:hover:bg-black/55
        "
        title="File actions"
        aria-label={`Actions for ${fileName}`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isMenuOpen ? (
        <div
          className="
            absolute right-4 top-14 z-30 w-52
            overflow-hidden rounded-2xl border border-slate-200
            bg-white shadow-2xl shadow-slate-900/15
            dark:border-white/[0.08] dark:bg-[#141418] dark:shadow-black/40
          "
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleRenameClick}
            className="
              w-full px-4 py-3 text-left text-sm font-semibold
              text-slate-700 transition-colors hover:bg-slate-50
              dark:text-zinc-200 dark:hover:bg-white/[0.06]
            "
          >
            Rename
          </button>

          <div className="border-t border-slate-100 px-4 py-3 dark:border-white/[0.06]">
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
              Move to
            </label>

            <select
              value={currentFolderId || ''}
              onChange={handleMoveChange}
              className="
                w-full rounded-xl border border-slate-200 bg-white
                px-3 py-2 text-xs font-semibold text-slate-800 outline-none
                focus:ring-2 focus:ring-violet-500/30
                dark:border-white/[0.08] dark:bg-[#101014] dark:text-zinc-100
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
              w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-semibold
              text-red-600 transition-colors hover:bg-red-50
              dark:border-white/[0.06] dark:text-red-400 dark:hover:bg-red-500/10
            "
          >
            Delete
          </button>
        </div>
      ) : null}

      <div
        className={`
          relative mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.35rem]
          border border-slate-200/80 shadow-inner
          ${canPreviewImage ? 'bg-slate-100 dark:bg-white/[0.04]' : `${style.bg} bg-opacity-80`}
        `}
      >
        {canPreviewImage ? (
          <img
            src={fileUrl}
            alt={fileName}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-white/60 bg-white/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.06]">
            <Icon className={`h-10 w-10 ${style.color}`} />
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-black/35 dark:text-zinc-200">
          {fileType}
        </div>

        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/70 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
          {isLegacyStorageUrl ? (
            <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-center text-xs font-bold text-white">
              Re-upload needed
            </span>
          ) : fileUrl ? (
            <>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition-all hover:-translate-y-0.5 hover:bg-white/20"
                title="Open preview"
                aria-label={`Open ${fileName}`}
              >
                <Eye className="h-5 w-5" />
              </a>

              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                download={fileName}
                onClick={(e) => e.stopPropagation()}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition-all hover:-translate-y-0.5 hover:bg-white/20"
                title="Download file"
                aria-label={`Download ${fileName}`}
              >
                <Download className="h-5 w-5" />
              </a>
            </>
          ) : (
            <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white">
              No preview
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <h4
          className="mb-2 truncate text-sm font-black text-slate-950 dark:text-white"
          title={fileName}
        >
          {fileName}
        </h4>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/[0.06]">
            {formatBytes(file?.sizeInBytes || file?.size || 0)}
          </span>

          {createdDate ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/[0.06]">
              {createdDate}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}


'''

new_folder_section = r'''function FolderSection({ folder, files, folders, viewMode, isExpanded, onToggle, onRenameFile, onMoveFile, onDeleteFile }) {
  const folderName = folder?.name || 'Untitled folder';
  const isPrivate = folder?.accessLevel === 'private';

  return (
    <div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/75 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-black/25">
      <button
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.04]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600 shadow-sm dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
            <Folder className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-base font-black text-slate-950 dark:text-white">
                {folderName}
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-zinc-400">
                {files.length} file{files.length === 1 ? '' : 's'}
              </span>

              {isPrivate ? (
                <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                  Private
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
              Organized project assets and supporting files.
            </p>
          </div>
        </div>

        <ChevronRight
          className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-200 dark:text-zinc-500 ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </button>
      
      {isExpanded && files.length > 0 && (
        <div className="border-t border-slate-200/70 p-5 dark:border-white/[0.08]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {files.map(file => (
              <FileCard
                key={file._id}
                file={file}
                folders={folders}
                onRenameFile={onRenameFile}
                onMoveFile={onMoveFile}
                onDeleteFile={onDeleteFile}
              />
            ))}
          </div>
        </div>
      )}

      {isExpanded && files.length === 0 && (
        <div className="border-t border-slate-200/70 p-5 dark:border-white/[0.08]">
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center dark:border-white/[0.08] dark:bg-white/[0.03]">
            <Archive className="mx-auto mb-3 h-8 w-8 text-slate-400 dark:text-zinc-500" />
            <p className="text-sm font-black text-slate-700 dark:text-zinc-200">
              Folder is empty
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-zinc-500">
              Move files here or upload new assets into this folder.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

'''

text = replace_between(
    text,
    "function FileCard({",
    "\n\nfunction FolderSection(",
    new_file_card
)

text = replace_between(
    text,
    "function FolderSection(",
    "\n\nexport default function VaultView",
    new_folder_section + "\n\n"
)

return_start = text.find("  return (\n", text.find("export default function VaultView"))
if return_start == -1:
    raise SystemExit("❌ Could not find VaultView return block.")

return_end_marker = "\n  );\n}"
return_end = text.rfind(return_end_marker)
if return_end == -1 or return_end < return_start:
    raise SystemExit("❌ Could not find VaultView return end.")

return_end += len(return_end_marker)

new_return = r'''  return (
    <div className="relative mx-auto max-w-[1500px] px-4 py-8 pb-32 sm:px-6 lg:px-10">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[2rem] bg-white/60 backdrop-blur-xl dark:bg-slate-950/50">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xl dark:border-white/[0.08] dark:bg-[#111113]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            <span className="text-sm font-black text-slate-700 dark:text-zinc-200">
              Loading vault...
            </span>
          </div>
        </div>
      )}

      <section className="relative mb-8 overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111113]/90 dark:shadow-black/30">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10" />
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/10" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl border border-violet-200 bg-white text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:bg-white/[0.06] dark:text-violet-200">
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
              <Archive className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                  Project Vault
                </h2>

                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                  File Command
                </span>

                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200">
                  Live Assets
                </span>
              </div>

              <p className="max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-zinc-400">
                Store, organize, preview, and move project assets from one clear source of truth.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:min-w-[420px]">
            <div className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.05]">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                Files
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {data.files.length}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm dark:border-amber-400/20 dark:bg-amber-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-200">
                Folders
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {data.folders.length}
              </div>
            </div>

            <div className="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-4 shadow-sm dark:border-cyan-400/20 dark:bg-cyan-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
                Visible
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {filteredFiles.length}
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-7 rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-950 dark:text-white">
                  Storage Intelligence
                </h3>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {Math.round(usagePercentage)}% Used
                </span>
              </div>

              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                Using {formatBytes(data.storage.usedBytes)} of {formatBytes(data.storage.limitBytes)}
              </p>
            </div>

            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-black text-violet-700 transition-all hover:-translate-y-0.5 hover:bg-violet-100 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/20"
            >
              Upgrade Plan
            </button>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner dark:bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                usagePercentage > 90
                  ? 'bg-gradient-to-r from-red-500 to-rose-500'
                  : usagePercentage > 75
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                    : 'bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400'
              }`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </div>
      </section>

      <section className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex flex-col group">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="relative z-10 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30"
            >
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </button>

            <div
              className="absolute -bottom-1.5 left-2 right-2 h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
              title={`${formatBytes(data.storage.usedBytes)} / ${formatBytes(data.storage.limitBytes)} used`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usagePercentage > 90
                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                    : usagePercentage > 75
                      ? 'bg-amber-400'
                      : 'bg-white/70'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-200 dark:hover:border-amber-400/20 dark:hover:bg-amber-500/10"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Folder</span>
          </button>
        </div>

        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.05]">
          <Search className="h-4 w-4 flex-shrink-0 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full min-w-[220px] bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-zinc-500 lg:w-72"
          />
        </div>
      </section>
      
      <section className="relative">
        {rootFiles.length > 0 && (
          <div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-black/25">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700 dark:text-zinc-200">
                    Project Root
                  </h3>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-zinc-400">
                    {rootFiles.length} file{rootFiles.length === 1 ? '' : 's'}
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Top-level files available to the project.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {rootFiles.map(file => (
                <FileCard
                  key={file._id}
                  file={file}
                  folders={data.folders}
                  onRenameFile={handleRenameFile}
                  onMoveFile={handleMoveFile}
                  onDeleteFile={handleDeleteFile}
                />
              ))}
            </div>
          </div>
        )}

        {data.folders.map(folder => (
          <FolderSection
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
          />
        ))}

        {!loading && data.folders.length === 0 && data.files.length === 0 && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {[
                { label: 'Documents', emoji: '📄', desc: 'Specs, notes, guides', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-500' },
                { label: 'Design', emoji: '🎨', desc: 'Mockups, wireframes', bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-500' },
                { label: 'Media', emoji: '🎬', desc: 'Images, videos, audio', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-500' },
                { label: 'Code', emoji: '💻', desc: 'Scripts, configs, exports', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-500' },
              ].map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setIsFolderModalOpen(true)}
                  className={`rounded-[1.75rem] ${cat.bg} border border-dashed ${cat.border} p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl`}
                >
                  <div className="mb-3 text-4xl">{cat.emoji}</div>
                  <h4 className={`mb-1 text-sm font-black ${cat.text}`}>{cat.label}</h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">{cat.desc}</p>
                </button>
              ))}
            </div>

            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035]">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-violet-200 bg-violet-50 text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                <Archive className="h-8 w-8" />
              </div>

              <h3 className="mb-2 text-xl font-black text-slate-950 dark:text-white">
                Vault is empty
              </h3>

              <p className="mx-auto mb-6 max-w-md text-sm font-medium leading-6 text-slate-600 dark:text-zinc-400">
                Upload files or create folders to organize your assets securely.
              </p>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Upload className="h-4 w-4" />
                Upload first file
              </button>
            </div>
          </div>
        )}
      </section>

      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onCreate={handleCreateFolder}
      />
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadFile}
        folders={data.folders}
      />
      {isUpgradeModalOpen ? (
        <PricingModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      ) : null}
    </div>
  );
}'''

text = text[:return_start] + new_return + text[return_end:]

path.write_text(text)

print("")
print("✅ Vault/Files visuals polished.")
print("✅ Preserved file upload, folder creation, rename, move, delete, previews, search, and pricing modal logic.")
print("✅ Backup created:", backup)
print("")
print("Inspect:")
print('rg -n "Project Vault|Storage Intelligence|File Command|Live Assets|function FileCard|function FolderSection" src/components/views/VaultView.jsx -C 8')
