// src/components/roadmap/MilestoneFileReferences.jsx

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Search,
  X,
} from "lucide-react";
import {
  addMilestoneFileReference,
  removeMilestoneFileReference,
} from "../../api/milestones";
import {
  fetchProjectFilesForReference,
} from "../../api/taskApi";

function normalizeId(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return String(
    value?._id ||
      value?.id ||
      value?.toString?.() ||
      ""
  );
}

function normalizeReference(value) {
  if (!value) return null;

  const fileId = normalizeId(
    value.fileId ||
      value._id ||
      value.id
  );

  if (!fileId) return null;

  return {
    fileId,
    fileName: String(
      value.fileName ||
        value.name ||
        value.originalName ||
        "Project file"
    ),
    fileUrl: String(
      value.fileUrl ||
        value.url ||
        ""
    ),
    fileType: String(
      value.fileType ||
        value.mimeType ||
        value.type ||
        ""
    ),
    fileSize: Number(
      value.fileSize ??
        value.size ??
        0
    ),
  };
}

function normalizeReferenceList(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map(normalizeReference)
    .filter(Boolean);
}

function formatFileSize(value) {
  const bytes = Number(value || 0);

  if (
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return `${(
    bytes /
    (1024 * 1024 * 1024)
  ).toFixed(2)} GB`;
}

function resolveFileUrl(value) {
  const url = String(
    value || ""
  ).trim();

  if (!url) return "";

  if (
    /^https?:\/\//i.test(url) ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  const backendBase = String(
    import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      ""
  )
    .trim()
    .replace(/\/api\/?$/i, "")
    .replace(/\/$/, "");

  if (!backendBase) {
    return url;
  }

  return `${backendBase}${
    url.startsWith("/") ? "" : "/"
  }${url}`;
}

function getErrorMessage(
  error,
  fallback
) {
  const value =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback;

  if (Array.isArray(value)) {
    return value.join(" • ");
  }

  return typeof value === "string"
    ? value
    : fallback;
}

export default function MilestoneFileReferences({
  milestoneId,
  projectId,
  initialReferences = [],
  editable = true,
}) {
  const normalizedMilestoneId =
    normalizeId(milestoneId);

  const normalizedProjectId =
    normalizeId(projectId);

  const [
    linkedFiles,
    setLinkedFiles,
  ] = useState(() =>
    normalizeReferenceList(
      initialReferences
    )
  );

  const [
    pickerOpen,
    setPickerOpen,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    projectFiles,
    setProjectFiles,
  ] = useState([]);

  const [
    loadingFiles,
    setLoadingFiles,
  ] = useState(false);

  const [
    linkingFileId,
    setLinkingFileId,
  ] = useState("");

  const [
    removingFileId,
    setRemovingFileId,
  ] = useState("");

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  useEffect(() => {
    setLinkedFiles(
      normalizeReferenceList(
        initialReferences
      )
    );
  }, [initialReferences]);

  useEffect(() => {
    if (
      !pickerOpen ||
      !normalizedProjectId
    ) {
      return undefined;
    }

    let cancelled = false;

    const timer = window.setTimeout(
      async () => {
        setLoadingFiles(true);
        setLoadError("");

        try {
          const files =
            await fetchProjectFilesForReference(
              normalizedProjectId,
              {
                search,
                limit: 50,
              }
            );

          if (!cancelled) {
            setProjectFiles(
              Array.isArray(files)
                ? files
                : []
            );
          }
        } catch (error) {
          if (!cancelled) {
            setProjectFiles([]);
            setLoadError(
              getErrorMessage(
                error,
                "Failed to load project Files"
              )
            );
          }
        } finally {
          if (!cancelled) {
            setLoadingFiles(false);
          }
        }
      },
      250
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    pickerOpen,
    normalizedProjectId,
    search,
  ]);

  const linkedFileIds = useMemo(
    () =>
      new Set(
        linkedFiles.map(
          (file) => file.fileId
        )
      ),
    [linkedFiles]
  );

  const availableFiles = useMemo(
    () =>
      projectFiles.filter((file) => {
        const fileId = normalizeId(file);

        const fileKind = String(
          file?.type || ""
        ).toLowerCase();

        const fileStatus = String(
          file?.status || ""
        ).toLowerCase();

        return (
          fileId &&
          !linkedFileIds.has(fileId) &&
          fileKind !== "folder" &&
          fileStatus !== "deleted" &&
          file?.isArchived !== true
        );
      }),
    [
      linkedFileIds,
      projectFiles,
    ]
  );

  const refreshRoadmap = () => {
    window.dispatchEvent(
      new CustomEvent(
        "milestones:refresh"
      )
    );
  };

  const handleLink = async (file) => {
    const fileId = normalizeId(file);

    if (
      !normalizedMilestoneId ||
      !fileId
    ) {
      return;
    }

    setLinkingFileId(fileId);
    setActionError("");

    try {
      const updated =
        await addMilestoneFileReference(
          normalizedMilestoneId,
          fileId
        );

      if (
        Array.isArray(
          updated?.fileReferences
        )
      ) {
        setLinkedFiles(
          normalizeReferenceList(
            updated.fileReferences
          )
        );
      } else {
        const reference =
          normalizeReference(file);

        if (reference) {
          setLinkedFiles(
            (current) => [
              ...current,
              reference,
            ]
          );
        }
      }

      setProjectFiles((current) =>
        current.filter(
          (item) =>
            normalizeId(item) !== fileId
        )
      );

      refreshRoadmap();
    } catch (error) {
      setActionError(
        getErrorMessage(
          error,
          "Failed to link project File"
        )
      );
    } finally {
      setLinkingFileId("");
    }
  };

  const handleRemove = async (
    fileId
  ) => {
    if (
      !normalizedMilestoneId ||
      !fileId
    ) {
      return;
    }

    setRemovingFileId(fileId);
    setActionError("");

    try {
      const updated =
        await removeMilestoneFileReference(
          normalizedMilestoneId,
          fileId
        );

      if (
        Array.isArray(
          updated?.fileReferences
        )
      ) {
        setLinkedFiles(
          normalizeReferenceList(
            updated.fileReferences
          )
        );
      } else {
        setLinkedFiles((current) =>
          current.filter(
            (file) =>
              file.fileId !== fileId
          )
        );
      }

      refreshRoadmap();
    } catch (error) {
      setActionError(
        getErrorMessage(
          error,
          "Failed to remove project File"
        )
      );
    } finally {
      setRemovingFileId("");
    }
  };

  if (
    !editable &&
    linkedFiles.length === 0
  ) {
    return null;
  }

  return (
    <div
      className="
        mt-4 rounded-2xl
        border border-slate-200/80
        bg-slate-50/80 p-3
        shadow-sm shadow-cyan-100/40
        dark:border-white/[0.12]
        dark:bg-slate-950/55
        dark:shadow-inner
        dark:shadow-black/20
      "
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <div className="
        flex items-center
        justify-between gap-3
      ">
        <div className="
          flex min-w-0
          items-center gap-2
        ">
          <FileText className="
            h-3.5 w-3.5
            text-cyan-600
            dark:text-cyan-300
          " />

          <span className="
            text-[10px] font-bold
            uppercase tracking-wider
            text-slate-500
            dark:text-zinc-400
          ">
            Files
          </span>

          <span className="
            rounded-full bg-white
            px-2 py-0.5
            text-[10px] font-bold
            text-slate-500
            ring-1 ring-slate-200
            dark:bg-white/[0.08]
            dark:text-zinc-300
            dark:ring-white/[0.12]
          ">
            {linkedFiles.length}
          </span>
        </div>

        {editable ? (
          <button
            type="button"
            disabled={
              !normalizedMilestoneId ||
              !normalizedProjectId
            }
            onClick={() => {
              setPickerOpen(
                (open) => !open
              );
              setActionError("");
            }}
            className="
              inline-flex items-center
              gap-1.5 rounded-xl
              border border-cyan-200
              bg-cyan-50 px-2.5 py-1.5
              text-[11px] font-bold
              text-cyan-700 transition
              hover:bg-cyan-100
              disabled:cursor-not-allowed
              disabled:opacity-50
              dark:border-cyan-300/30
              dark:bg-cyan-500/15
              dark:text-cyan-100
              dark:hover:bg-cyan-500/25
            "
          >
            {pickerOpen ? (
              <X className="h-3 w-3" />
            ) : (
              <Link2 className="h-3 w-3" />
            )}

            {pickerOpen
              ? "Close"
              : "Link project file"}
          </button>
        ) : null}
      </div>

      {linkedFiles.length > 0 ? (
        <div className="mt-3 space-y-2">
          {linkedFiles.map((file) => {
            const fileUrl =
              resolveFileUrl(
                file.fileUrl
              );

            const size =
              formatFileSize(
                file.fileSize
              );

            return (
              <div
                key={file.fileId}
                className="
                  flex min-w-0
                  items-center gap-2
                  rounded-xl
                  border border-slate-200
                  bg-white p-2.5
                  dark:border-white/[0.10]
                  dark:bg-white/[0.05]
                "
              >
                <FileText className="
                  h-4 w-4 shrink-0
                  text-cyan-600
                  dark:text-cyan-200
                " />

                <div className="
                  min-w-0 flex-1
                ">
                  <p className="
                    truncate text-xs
                    font-semibold
                    text-slate-800
                    dark:text-white
                  ">
                    {file.fileName}
                  </p>

                  <p className="
                    truncate text-[10px]
                    text-slate-500
                    dark:text-zinc-400
                  ">
                    Project file
                    {size
                      ? ` • ${size}`
                      : ""}
                  </p>
                </div>

                {fileUrl ? (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Open File"
                    className="
                      inline-flex h-7 w-7
                      shrink-0 items-center
                      justify-center rounded-lg
                      text-slate-500 transition
                      hover:bg-slate-100
                      hover:text-cyan-700
                      dark:text-zinc-400
                      dark:hover:bg-white/[0.08]
                      dark:hover:text-cyan-200
                    "
                  >
                    <ExternalLink className="
                      h-3.5 w-3.5
                    " />
                  </a>
                ) : null}

                {editable ? (
                  <button
                    type="button"
                    title="Remove File reference"
                    disabled={
                      removingFileId ===
                      file.fileId
                    }
                    onClick={() =>
                      handleRemove(
                        file.fileId
                      )
                    }
                    className="
                      inline-flex h-7 w-7
                      shrink-0 items-center
                      justify-center rounded-lg
                      text-slate-400 transition
                      hover:bg-red-50
                      hover:text-red-600
                      disabled:cursor-wait
                      disabled:opacity-50
                      dark:text-zinc-500
                      dark:hover:bg-red-500/15
                      dark:hover:text-red-200
                    "
                  >
                    {removingFileId ===
                    file.fileId ? (
                      <Loader2 className="
                        h-3.5 w-3.5
                        animate-spin
                      " />
                    ) : (
                      <X className="
                        h-3.5 w-3.5
                      " />
                    )}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="
          mt-2 text-[11px]
          text-slate-500
          dark:text-zinc-400
        ">
          No project Files linked.
        </p>
      )}

      {actionError ? (
        <p className="
          mt-2 text-[11px]
          font-medium text-red-600
          dark:text-red-300
        ">
          {actionError}
        </p>
      ) : null}

      {pickerOpen && editable ? (
        <div className="
          mt-3 rounded-xl
          border border-cyan-200/80
          bg-white p-2.5
          dark:border-cyan-300/20
          dark:bg-slate-950/80
        ">
          <div className="relative">
            <Search className="
              pointer-events-none
              absolute left-2.5 top-1/2
              h-3.5 w-3.5
              -translate-y-1/2
              text-slate-400
            " />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search project Files..."
              className="
                w-full rounded-xl
                border border-slate-200
                bg-slate-50 py-2
                pl-8 pr-3 text-xs
                text-slate-700 outline-none
                placeholder:text-slate-400
                focus:border-cyan-300
                focus:ring-2
                focus:ring-cyan-200/60
                dark:border-white/[0.12]
                dark:bg-white/[0.05]
                dark:text-white
                dark:placeholder:text-zinc-500
              "
            />
          </div>

          {loadingFiles ? (
            <div className="
              flex items-center
              justify-center gap-2
              py-5 text-xs
              text-slate-500
              dark:text-zinc-400
            ">
              <Loader2 className="
                h-4 w-4 animate-spin
              " />
              Loading Files…
            </div>
          ) : loadError ? (
            <p className="
              py-4 text-center
              text-xs font-medium
              text-red-600
              dark:text-red-300
            ">
              {loadError}
            </p>
          ) : availableFiles.length > 0 ? (
            <div className="
              mt-2 max-h-48
              space-y-1.5 overflow-y-auto
              overscroll-contain
            ">
              {availableFiles.map(
                (file) => {
                  const fileId =
                    normalizeId(file);

                  const fileName =
                    String(
                      file?.name ||
                        file?.originalName ||
                        "Project file"
                    );

                  const size =
                    formatFileSize(
                      file?.size
                    );

                  return (
                    <button
                      key={fileId}
                      type="button"
                      disabled={
                        linkingFileId ===
                        fileId
                      }
                      onClick={() =>
                        handleLink(file)
                      }
                      className="
                        flex w-full
                        items-center gap-2
                        rounded-xl
                        border border-transparent
                        px-2.5 py-2
                        text-left transition
                        hover:border-cyan-200
                        hover:bg-cyan-50
                        disabled:cursor-wait
                        disabled:opacity-60
                        dark:hover:border-cyan-300/20
                        dark:hover:bg-cyan-500/10
                      "
                    >
                      <FileText className="
                        h-4 w-4 shrink-0
                        text-cyan-600
                        dark:text-cyan-200
                      " />

                      <span className="
                        min-w-0 flex-1
                      ">
                        <span className="
                          block truncate
                          text-xs font-semibold
                          text-slate-700
                          dark:text-white
                        ">
                          {fileName}
                        </span>

                        <span className="
                          block truncate
                          text-[10px]
                          text-slate-500
                          dark:text-zinc-400
                        ">
                          {size ||
                            file?.mimeType ||
                            file?.fileType ||
                            "Project file"}
                        </span>
                      </span>

                      {linkingFileId ===
                      fileId ? (
                        <Loader2 className="
                          h-4 w-4 shrink-0
                          animate-spin
                          text-cyan-600
                        " />
                      ) : (
                        <Link2 className="
                          h-4 w-4 shrink-0
                          text-slate-400
                        " />
                      )}
                    </button>
                  );
                }
              )}
            </div>
          ) : (
            <p className="
              py-5 text-center
              text-xs text-slate-500
              dark:text-zinc-400
            ">
              No available project Files found.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
