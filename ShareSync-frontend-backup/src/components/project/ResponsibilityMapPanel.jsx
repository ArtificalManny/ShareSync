import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  CircleDot,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  Users,
  X,
} from "lucide-react";

import {
  createProjectResponsibility,
  getProjectResponsibilities,
  updateProjectResponsibility,
} from "../../api/responsibilityMap";

import { useAuth } from "../../context/AuthContext";

function normalizeId(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value).trim();
  }

  return normalizeId(
    value?.userId ||
      value?.user ||
      value?.memberId ||
      value?.member ||
      value?._id ||
      value?.id
  );
}

function memberLabel(value) {
  if (!value) {
    return "Project member";
  }

  if (typeof value === "string") {
    return "Project member";
  }

  const firstName =
    value?.firstName ||
    value?.user?.firstName ||
    value?.userId?.firstName ||
    "";

  const lastName =
    value?.lastName ||
    value?.user?.lastName ||
    value?.userId?.lastName ||
    "";

  const fullName = [
    firstName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const direct =
    value?.displayName ||
    value?.name ||
    value?.fullName ||
    fullName ||
    value?.username ||
    value?.email;

  if (direct) {
    return String(direct);
  }

  const nested =
    value?.user ||
    value?.userId ||
    value?.member ||
    value?.memberId;

  if (
    nested &&
    nested !== value
  ) {
    return memberLabel(nested);
  }

  return "Project member";
}

function getErrorMessage(error) {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong.";

  if (Array.isArray(message)) {
    return message.join(" ");
  }

  return String(message);
}

function buildMemberDirectory({
  project,
  members,
  user,
  ownerName,
}) {
  const directory =
    new Map();

  const add = (
    value,
    preferredLabel = ""
  ) => {
    const id =
      normalizeId(value);

    if (!id) return;

    const label =
      String(
        preferredLabel ||
          memberLabel(value) ||
          ""
      ).trim();

    const existing =
      directory.get(id);

    if (
      !existing ||
      existing ===
        "Project member"
    ) {
      directory.set(
        id,
        label &&
          label !==
            "Project member"
          ? label
          : existing ||
              "Project member"
      );
    }

    if (
      value &&
      typeof value === "object"
    ) {
      [
        value?.userId,
        value?.user,
        value?.memberId,
        value?.member,
      ].forEach((nested) => {
        if (
          nested &&
          nested !== value
        ) {
          add(
            nested,
            preferredLabel
          );
        }
      });
    }
  };

  add(user);

  if (
    Array.isArray(members)
  ) {
    members.forEach(
      (member) => add(member)
    );
  }

  for (
    const collection of [
      project?.members,
      project?.teamMembers,
      project?.participants,
      project?.collaborators,
    ]
  ) {
    if (
      Array.isArray(collection)
    ) {
      collection.forEach(
        (member) => add(member)
      );
    }
  }

  [
    project?.owner,
    project?.ownerId,
    project?.createdBy,
    project?.createdById,
  ].forEach((candidate) => {
    add(
      candidate,
      ownerName
    );
  });

  return directory;
}

function getProjectOwnerIds(
  project
) {
  const ids =
    new Set();

  [
    project?.owner,
    project?.ownerId,
    project?.createdBy,
    project?.createdById,
  ].forEach((candidate) => {
    const id =
      normalizeId(candidate);

    if (id) {
      ids.add(id);
    }
  });

  return ids;
}

function coverageMeta(value) {
  switch (value) {
    case "covered":
      return {
        label: "Covered",
        icon: CheckCircle2,
        classes:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
      };

    case "fragile":
      return {
        label: "Fragile",
        icon: AlertTriangle,
        classes:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
      };

    default:
      return {
        label: "Unowned",
        icon: UserRoundX,
        classes:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
      };
  }
}

function criticalityMeta(value) {
  switch (value) {
    case "high":
      return {
        label: "High",
        classes:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
      };

    case "low":
      return {
        label: "Low",
        classes:
          "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400",
      };

    default:
      return {
        label: "Medium",
        classes:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
      };
  }
}

function blankForm() {
  return {
    title: "",
    description: "",
    category: "",
    criticality: "medium",
    ownerId: "",
    backupOwnerId: "",
  };
}

function formFromItem(item) {
  return {
    title:
      item?.title || "",
    description:
      item?.description || "",
    category:
      item?.category || "",
    criticality:
      item?.criticality ||
      "medium",
    ownerId:
      normalizeId(
        item?.ownerId
      ),
    backupOwnerId:
      normalizeId(
        item?.backupOwnerId
      ),
  };
}

function SummaryTile({
  label,
  value,
  icon: Icon,
  classes,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-white/[0.08] dark:bg-[#17171b]">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${classes}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <div className="text-lg font-black leading-none text-slate-900 dark:text-white">
            {value}
          </div>

          <div className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-zinc-500">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResponsibilityCard({
  item,
  currentUserId,
  projectOwnerIds,
  nameForId,
  readOnly,
  busyId,
  onEdit,
  onStatusChange,
}) {
  const id =
    normalizeId(item);

  const ownerId =
    normalizeId(
      item?.ownerId
    );

  const backupOwnerId =
    normalizeId(
      item?.backupOwnerId
    );

  const creatorId =
    normalizeId(
      item?.createdBy
    );

  const archived =
    item?.status ===
    "archived";

  const canManage =
    Boolean(currentUserId) &&
    (
      currentUserId ===
        creatorId ||
      projectOwnerIds.has(
        currentUserId
      )
    );

  const canEditDetails =
    Boolean(currentUserId) &&
    (
      canManage ||
      currentUserId ===
        ownerId
    );

  const coverage =
    coverageMeta(
      item?.coverageState
    );

  const CoverageIcon =
    coverage.icon;

  const criticality =
    criticalityMeta(
      item?.criticality
    );

  const busy =
    busyId === id;

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm dark:bg-[#17171b] ${
        item?.highExposure
          ? "border-rose-200 dark:border-rose-500/25"
          : "border-slate-200 dark:border-white/[0.08]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="min-w-0 truncate text-sm font-black text-slate-900 dark:text-white">
              {item?.title ||
                "Responsibility"}
            </h4>

            {item?.category ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
                {item.category}
              </span>
            ) : null}
          </div>

          {item?.description ? (
            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-zinc-300">
              {item.description}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${criticality.classes}`}
          >
            {criticality.label}
          </span>

          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${coverage.classes}`}
          >
            <CoverageIcon className="h-3 w-3" />
            {coverage.label}
          </span>

          {archived ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
              <Archive className="h-3 w-3" />
              Archived
            </span>
          ) : null}
        </div>
      </div>

      {item?.highExposure ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.07] dark:text-rose-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

          <span>
            <strong>
              High exposure.
            </strong>{" "}
            This high-criticality responsibility is not fully covered.
          </span>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/[0.07] dark:bg-white/[0.025]">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-zinc-500">
            <UserRoundCheck className="h-3.5 w-3.5" />
            Primary owner
          </div>

          <div className="mt-1.5 text-sm font-bold text-slate-800 dark:text-zinc-200">
            {ownerId
              ? nameForId(
                  ownerId
                )
              : "Unassigned"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/[0.07] dark:bg-white/[0.025]">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-zinc-500">
            <Users className="h-3.5 w-3.5" />
            Backup owner
          </div>

          <div className="mt-1.5 text-sm font-bold text-slate-800 dark:text-zinc-200">
            {backupOwnerId
              ? nameForId(
                  backupOwnerId
                )
              : "None"}
          </div>
        </div>
      </div>

      {!readOnly &&
      (canEditDetails ||
        canManage) ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {canEditDetails ? (
            <button
              type="button"
              onClick={() =>
                onEdit(
                  item,
                  canManage
                )
              }
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          ) : null}

          {canManage ? (
            <button
              type="button"
              onClick={() =>
                onStatusChange(
                  item,
                  archived
                    ? "active"
                    : "archived"
                )
              }
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : archived ? (
                <RefreshCw className="h-3.5 w-3.5" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}

              {archived
                ? "Reopen"
                : "Archive"}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function ResponsibilityModal({
  mode,
  item,
  form,
  setForm,
  participantOptions,
  canManage,
  saving,
  error,
  onClose,
  onSubmit,
}) {
  const editing =
    mode === "edit";

  const ownerSelected =
    Boolean(form.ownerId);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#17171b]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 dark:border-white/[0.08] dark:bg-[#17171b]">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {editing
                ? "Edit responsibility"
                : "Add responsibility"}
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              Make standing ownership visible before it becomes a blind spot.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 p-5"
        >
          <div>
            <label className="text-xs font-black uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">
              Responsibility
            </label>

            <input
              value={form.title}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    title:
                      event.target.value,
                  })
                )
              }
              maxLength={140}
              required
              placeholder="e.g. Production reliability"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    description:
                      event.target.value,
                  })
                )
              }
              maxLength={1200}
              rows={4}
              placeholder="What ongoing area is this person responsible for?"
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-black uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">
                Category
              </label>

              <input
                value={form.category}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      category:
                        event.target.value,
                    })
                  )
                }
                maxLength={80}
                placeholder="Operations"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">
                Criticality
              </label>

              <select
                value={form.criticality}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      criticality:
                        event.target.value,
                    })
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#1f1f24] dark:text-white"
              >
                <option value="low">
                  Low
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="high">
                  High
                </option>
              </select>
            </div>
          </div>

          {canManage ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-black uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">
                  Primary owner
                </label>

                <select
                  value={form.ownerId}
                  onChange={(event) => {
                    const ownerId =
                      event.target.value;

                    setForm(
                      (current) => ({
                        ...current,
                        ownerId,
                        backupOwnerId:
                          ownerId
                            ? (
                                current.backupOwnerId ===
                                ownerId
                                  ? ""
                                  : current.backupOwnerId
                              )
                            : "",
                      })
                    );
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#1f1f24] dark:text-white"
                >
                  <option value="">
                    Unassigned
                  </option>

                  {participantOptions.map(
                    (option) => (
                      <option
                        key={option.id}
                        value={option.id}
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">
                  Backup owner
                </label>

                <select
                  value={
                    form.backupOwnerId
                  }
                  disabled={
                    !ownerSelected
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        backupOwnerId:
                          event.target.value,
                      })
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#1f1f24] dark:text-white"
                >
                  <option value="">
                    None
                  </option>

                  {participantOptions
                    .filter(
                      (option) =>
                        option.id !==
                        form.ownerId
                    )
                    .map(
                      (option) => (
                        <option
                          key={
                            option.id
                          }
                          value={
                            option.id
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      )
                    )}
                </select>
              </div>
            </div>
          ) : editing ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-500 dark:border-white/[0.07] dark:bg-white/[0.025] dark:text-zinc-400">
              You can maintain the responsibility details. Ownership and archive controls stay with the responsibility creator or project owner.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-300">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                !form.title.trim()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl !bg-violet-600 px-4 py-2.5 text-sm font-black !text-white shadow-sm transition hover:!bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor:
                  "#7c3aed",
                color:
                  "#ffffff",
                WebkitTextFillColor:
                  "#ffffff",
              }}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}

              {editing
                ? "Save changes"
                : "Add responsibility"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResponsibilityMapPanel({
  projectId,
  project = null,
  members = [],
  ownerName = "",
  readOnly = false,
}) {
  const { user } =
    useAuth();

  const [
    responsibilities,
    setResponsibilities,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    panelError,
    setPanelError,
  ] = useState("");

  const [
    modalMode,
    setModalMode,
  ] = useState("");

  const [
    editingItem,
    setEditingItem,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState(
    blankForm()
  );

  const [
    modalError,
    setModalError,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    busyId,
    setBusyId,
  ] = useState("");

  const [
    showArchived,
    setShowArchived,
  ] = useState(false);

  const currentUserId =
    normalizeId(user);

  const memberDirectory =
    useMemo(
      () =>
        buildMemberDirectory({
          project,
          members,
          user,
          ownerName,
        }),
      [
        project,
        members,
        user,
        ownerName,
      ]
    );

  const projectOwnerIds =
    useMemo(
      () =>
        getProjectOwnerIds(
          project
        ),
      [project]
    );

  const nameForId =
    useCallback(
      (value) => {
        const id =
          normalizeId(value);

        if (!id) {
          return "Project member";
        }

        return (
          memberDirectory.get(id) ||
          "Project member"
        );
      },
      [memberDirectory]
    );

  const participantOptions =
    useMemo(
      () =>
        Array.from(
          memberDirectory.entries()
        )
          .filter(
            ([id]) =>
              Boolean(id)
          )
          .map(
            ([id, label]) => ({
              id,
              label:
                label ||
                "Project member",
            })
          )
          .sort(
            (a, b) =>
              a.label.localeCompare(
                b.label
              )
          ),
      [memberDirectory]
    );

  const load =
    useCallback(
      async () => {
        if (!projectId) {
          setResponsibilities([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        setPanelError("");

        try {
          const data =
            await getProjectResponsibilities(
              projectId
            );

          setResponsibilities(
            Array.isArray(data)
              ? data
              : []
          );
        } catch (error) {
          setPanelError(
            getErrorMessage(error)
          );
        } finally {
          setLoading(false);
        }
      },
      [projectId]
    );

  useEffect(() => {
    void load();
  }, [load]);

  const activeItems =
    useMemo(
      () =>
        responsibilities.filter(
          (item) =>
            item?.status !==
            "archived"
        ),
      [responsibilities]
    );

  const archivedItems =
    useMemo(
      () =>
        responsibilities.filter(
          (item) =>
            item?.status ===
            "archived"
        ),
      [responsibilities]
    );

  const counts =
    useMemo(
      () => {
        const covered =
          activeItems.filter(
            (item) =>
              item?.coverageState ===
              "covered"
          ).length;

        const fragile =
          activeItems.filter(
            (item) =>
              item?.coverageState ===
              "fragile"
          ).length;

        const unowned =
          activeItems.filter(
            (item) =>
              item?.coverageState ===
              "unowned"
          ).length;

        return {
          total:
            activeItems.length,
          covered,
          fragile,
          unowned,
        };
      },
      [activeItems]
    );

  const replaceItem =
    useCallback(
      (nextItem) => {
        const nextId =
          normalizeId(
            nextItem
          );

        setResponsibilities(
          (current) =>
            current.map(
              (item) =>
                normalizeId(item) ===
                nextId
                  ? nextItem
                  : item
            )
        );
      },
      []
    );

  const openCreate =
    useCallback(
      () => {
        setEditingItem(null);
        setForm(
          blankForm()
        );
        setModalError("");
        setModalMode("create");
      },
      []
    );

  const openEdit =
    useCallback(
      (
        item,
        canManage
      ) => {
        setEditingItem({
          ...item,
          __canManage:
            canManage,
        });

        setForm(
          formFromItem(item)
        );

        setModalError("");
        setModalMode("edit");
      },
      []
    );

  const closeModal =
    useCallback(
      () => {
        if (saving) return;

        setModalMode("");
        setEditingItem(null);
        setModalError("");
      },
      [saving]
    );

  const submitModal =
    useCallback(
      async (event) => {
        event.preventDefault();

        const title =
          form.title.trim();

        if (!title) {
          setModalError(
            "Responsibility title is required."
          );
          return;
        }

        setSaving(true);
        setModalError("");

        try {
          const descriptive = {
            title,
            description:
              form.description.trim(),
            category:
              form.category.trim(),
            criticality:
              form.criticality,
          };

          if (
            modalMode ===
            "create"
          ) {
            const created =
              await createProjectResponsibility(
                projectId,
                {
                  ...descriptive,
                  ownerId:
                    form.ownerId ||
                    null,
                  backupOwnerId:
                    form.ownerId
                      ? (
                          form.backupOwnerId ||
                          null
                        )
                      : null,
                }
              );

            setResponsibilities(
              (current) => [
                created,
                ...current,
              ]
            );
          } else {
            const id =
              normalizeId(
                editingItem
              );

            const updates = {
              ...descriptive,
            };

            if (
              editingItem
                ?.__canManage
            ) {
              updates.ownerId =
                form.ownerId ||
                null;

              updates.backupOwnerId =
                form.ownerId
                  ? (
                      form.backupOwnerId ||
                      null
                    )
                  : null;
            }

            const updated =
              await updateProjectResponsibility(
                projectId,
                id,
                updates
              );

            replaceItem(
              updated
            );
          }

          setModalMode("");
          setEditingItem(null);
          setForm(
            blankForm()
          );
        } catch (error) {
          setModalError(
            getErrorMessage(error)
          );
        } finally {
          setSaving(false);
        }
      },
      [
        editingItem,
        form,
        modalMode,
        projectId,
        replaceItem,
      ]
    );

  const changeStatus =
    useCallback(
      async (
        item,
        status
      ) => {
        const id =
          normalizeId(item);

        if (!id) return;

        setBusyId(id);
        setPanelError("");

        try {
          const updated =
            await updateProjectResponsibility(
              projectId,
              id,
              {
                status,
              }
            );

          replaceItem(
            updated
          );
        } catch (error) {
          setPanelError(
            getErrorMessage(error)
          );
        } finally {
          setBusyId("");
        }
      },
      [
        projectId,
        replaceItem,
      ]
    );

  const canCreate =
    !readOnly &&
    Boolean(projectId) &&
    Boolean(currentUserId);

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#17171b]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />

          <div className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
            Loading Responsibility Map…
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.02] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Responsibility Map
                </h3>

                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  Make ownership visible and expose where responsibility is missing or fragile.
                </p>
              </div>
            </div>
          </div>

          {canCreate ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl !bg-violet-600 px-3.5 py-2.5 text-xs font-black !text-white shadow-sm transition hover:!bg-violet-700"
              style={{
                backgroundColor:
                  "#7c3aed",
                color:
                  "#ffffff",
                WebkitTextFillColor:
                  "#ffffff",
              }}
            >
              <Plus className="h-4 w-4" />
              Add responsibility
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryTile
            label="Responsibilities"
            value={counts.total}
            icon={ShieldCheck}
            classes="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
          />

          <SummaryTile
            label="Covered"
            value={counts.covered}
            icon={CheckCircle2}
            classes="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
          />

          <SummaryTile
            label="Fragile"
            value={counts.fragile}
            icon={AlertTriangle}
            classes="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
          />

          <SummaryTile
            label="Unowned"
            value={counts.unowned}
            icon={UserRoundX}
            classes="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
          />
        </div>

        {panelError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-300">
            {panelError}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {activeItems.length ? (
            activeItems.map(
              (item) => (
                <ResponsibilityCard
                  key={
                    normalizeId(
                      item
                    )
                  }
                  item={item}
                  currentUserId={
                    currentUserId
                  }
                  projectOwnerIds={
                    projectOwnerIds
                  }
                  nameForId={
                    nameForId
                  }
                  readOnly={
                    readOnly
                  }
                  busyId={
                    busyId
                  }
                  onEdit={
                    openEdit
                  }
                  onStatusChange={
                    changeStatus
                  }
                />
              )
            )
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center dark:border-white/10 dark:bg-[#17171b]">
              <UserRound className="mx-auto h-6 w-6 text-slate-300 dark:text-zinc-600" />

              <div className="mt-2 text-sm font-bold text-slate-700 dark:text-zinc-300">
                No responsibilities mapped yet.
              </div>

              <div className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
                Add the ongoing areas the team cannot afford to leave ambiguous.
              </div>
            </div>
          )}
        </div>

        {archivedItems.length ? (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/[0.07]">
            <button
              type="button"
              onClick={() =>
                setShowArchived(
                  (value) => !value
                )
              }
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
            >
              <Archive className="h-3.5 w-3.5" />

              {showArchived
                ? "Hide archived"
                : `Show archived (${archivedItems.length})`}
            </button>

            {showArchived ? (
              <div className="mt-3 space-y-3">
                {archivedItems.map(
                  (item) => (
                    <ResponsibilityCard
                      key={
                        normalizeId(
                          item
                        )
                      }
                      item={
                        item
                      }
                      currentUserId={
                        currentUserId
                      }
                      projectOwnerIds={
                        projectOwnerIds
                      }
                      nameForId={
                        nameForId
                      }
                      readOnly={
                        readOnly
                      }
                      busyId={
                        busyId
                      }
                      onEdit={
                        openEdit
                      }
                      onStatusChange={
                        changeStatus
                      }
                    />
                  )
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {modalMode ? (
        <ResponsibilityModal
          mode={modalMode}
          item={editingItem}
          form={form}
          setForm={setForm}
          participantOptions={
            participantOptions
          }
          canManage={
            modalMode ===
              "create" ||
            Boolean(
              editingItem
                ?.__canManage
            )
          }
          saving={saving}
          error={modalError}
          onClose={closeModal}
          onSubmit={submitModal}
        />
      ) : null}
    </>
  );
}
