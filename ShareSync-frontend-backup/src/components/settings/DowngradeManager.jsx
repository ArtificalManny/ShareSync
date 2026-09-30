// openshare-downgrade-manager-v1
//
// Owner-facing downgrade retention planner.
//
// This UI never deletes customer data and never changes billing lifecycle
// state. The backend remains authoritative for ownership, membership,
// limits, and allowed retained selections.

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Check,
  Folder,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  getDowngradeProjectSelection,
  updateDowngradeProjectSelection,
  getDowngradeMemberSelection,
  updateDowngradeMemberSelection,
} from "../../api/subscriptions";


function normalizeIds(values) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) =>
          String(value || "").trim()
        )
        .filter(Boolean)
    )
  ).sort();
}


function sameIds(left, right) {
  const a = normalizeIds(left);
  const b = normalizeIds(right);

  return (
    a.length === b.length &&
    a.every(
      (value, index) =>
        value === b[index]
    )
  );
}


function errorMessage(error, fallback) {
  const raw =
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message;

  if (Array.isArray(raw)) {
    return (
      raw
        .filter(Boolean)
        .join(" ") ||
      fallback
    );
  }

  return (
    String(raw || fallback).trim() ||
    fallback
  );
}


function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(date);
}


function getLifecycleInfo(subscription) {
  const state = String(
    subscription?.downgradeState || ""
  )
    .trim()
    .toUpperCase();

  const cancelAt =
    subscription?.cancelAt ||
    subscription?.downgradeEffectiveAt ||
    null;

  const graceEndsAt =
    subscription?.downgradeGraceEndsAt ||
    null;

  if (state.includes("RESTRICT")) {
    return {
      active: true,
      title: "Free limits are active",
      detail:
        "Your saved choices now determine which over-limit projects remain writable and which members remain active.",
      date: "",
    };
  }

  if (state.includes("GRACE")) {
    return {
      active: true,
      title: "Downgrade grace period",
      detail:
        "You can continue adjusting these choices until the grace period ends.",
      date: formatDate(graceEndsAt),
    };
  }

  if (
    state.includes("SCHEDULE") ||
    state.includes("CANCEL") ||
    cancelAt
  ) {
    return {
      active: true,
      title: "Downgrade scheduled",
      detail:
        "Your paid access continues through the paid period. These choices prepare the workspace for Free.",
      date: formatDate(cancelAt),
    };
  }

  return {
    active: false,
    title: "Downgrade protection",
    detail:
      "Choose what should remain active if this workspace moves to Free.",
    date: "",
  };
}


function SelectionBadge({
  active,
  activeLabel,
  inactiveLabel,
}) {
  return (
    <span
      className={
        "inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] " +
        (
          active
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-zinc-400"
        )
      }
    >
      {active
        ? activeLabel
        : inactiveLabel}
    </span>
  );
}


function SaveButton({
  saving,
  disabled,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-violet-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {saving
        ? "Saving..."
        : children}
    </button>
  );
}


export default function DowngradeManager({
  subscription = null,
  isPremium = false,
  forceShow = false,
}) {
  const [
    projectData,
    setProjectData,
  ] = useState(null);

  const [
    memberData,
    setMemberData,
  ] = useState(null);

  const [
    selectedProjectIds,
    setSelectedProjectIds,
  ] = useState([]);

  const [
    selectedMemberIds,
    setSelectedMemberIds,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    projectSaving,
    setProjectSaving,
  ] = useState(false);

  const [
    memberSaving,
    setMemberSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    projectMessage,
    setProjectMessage,
  ] = useState("");

  const [
    memberMessage,
    setMemberMessage,
  ] = useState("");


  const applyProjectData =
    useCallback((next) => {
      const safe = next || {};

      setProjectData(safe);

      setSelectedProjectIds(
        normalizeIds(
          safe.retainedProjectIds
        )
      );
    }, []);


  const applyMemberData =
    useCallback((next) => {
      const safe = next || {};

      setMemberData(safe);

      setSelectedMemberIds(
        normalizeIds(
          safe.retainedMemberUserIds
        )
      );
    }, []);


  const loadSelections =
    useCallback(
      async ({
        manual = false,
      } = {}) => {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const [
            projects,
            members,
          ] = await Promise.all([
            getDowngradeProjectSelection(),
            getDowngradeMemberSelection(),
          ]);

          applyProjectData(projects);
          applyMemberData(members);
        } catch (loadError) {
          setError(
            errorMessage(
              loadError,
              "Could not load downgrade choices."
            )
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        applyMemberData,
        applyProjectData,
      ]
    );


  // openshare-downgrade-lifecycle-sync-v1
  //
  // BillingSettings refreshes subscription state independently. Keep the
  // retention picker synchronized when a cancellation, grace transition,
  // restriction, or resume changes the downgrade lifecycle while this
  // component remains mounted.
  const lifecycleRefreshKey =
    useMemo(
      () =>
        [
          subscription?.plan,
          subscription?.status,
          subscription?.downgradeState,
          subscription?.downgradeTargetPlan,
          subscription?.cancelAt,
          subscription?.downgradeEffectiveAt,
          subscription?.downgradeGraceEndsAt,
        ]
          .map((value) =>
            String(value || "")
          )
          .join("|"),
      [
        subscription?.plan,
        subscription?.status,
        subscription?.downgradeState,
        subscription?.downgradeTargetPlan,
        subscription?.cancelAt,
        subscription?.downgradeEffectiveAt,
        subscription?.downgradeGraceEndsAt,
      ]
    );


  useEffect(() => {
    loadSelections();
  }, [
    loadSelections,
    lifecycleRefreshKey,
  ]);


  const lifecycle =
    useMemo(
      () =>
        getLifecycleInfo(
          subscription
        ),
      [subscription]
    );


  const showManager =
    Boolean(
      forceShow ||
      isPremium ||
      lifecycle.active ||
      projectData?.overProjectLimit ||
      memberData?.overMemberLimit
    );


  const projectDirty =
    useMemo(
      () =>
        !sameIds(
          selectedProjectIds,
          projectData?.retainedProjectIds
        ),
      [
        selectedProjectIds,
        projectData?.retainedProjectIds,
      ]
    );


  const memberDirty =
    useMemo(
      () =>
        !sameIds(
          selectedMemberIds,
          memberData?.retainedMemberUserIds
        ),
      [
        selectedMemberIds,
        memberData?.retainedMemberUserIds,
      ]
    );


  const toggleProject =
    useCallback(
      (projectId) => {
        setProjectMessage("");

        setSelectedProjectIds(
          (current) => {
            if (
              current.includes(
                projectId
              )
            ) {
              return current.filter(
                (id) =>
                  id !== projectId
              );
            }

            const limit =
              Number(
                projectData?.projectLimit
              );

            if (
              Number.isFinite(limit) &&
              limit !== -1 &&
              current.length >= limit
            ) {
              setProjectMessage(
                `Free allows up to ${limit} retained projects.`
              );

              return current;
            }

            return [
              ...current,
              projectId,
            ];
          }
        );
      },
      [
        projectData?.projectLimit,
      ]
    );


  const toggleMember =
    useCallback(
      (memberUserId) => {
        setMemberMessage("");

        setSelectedMemberIds(
          (current) => {
            if (
              current.includes(
                memberUserId
              )
            ) {
              return current.filter(
                (id) =>
                  id !== memberUserId
              );
            }

            const rawLimit =
              memberData
                ?.selectableMemberLimit;

            const limit =
              rawLimit === null ||
              rawLimit === undefined
                ? null
                : Number(rawLimit);

            if (
              limit !== null &&
              Number.isFinite(limit) &&
              limit !== -1 &&
              current.length >= limit
            ) {
              setMemberMessage(
                `Free includes the owner plus up to ${limit} additional active member${limit === 1 ? "" : "s"}.`
              );

              return current;
            }

            return [
              ...current,
              memberUserId,
            ];
          }
        );
      },
      [
        memberData
          ?.selectableMemberLimit,
      ]
    );


  const saveProjects =
    useCallback(async () => {
      if (
        projectSaving ||
        !projectDirty
      ) {
        return;
      }

      setProjectSaving(true);
      setProjectMessage("");
      setError("");

      try {
        const next =
          await updateDowngradeProjectSelection(
            selectedProjectIds
          );

        applyProjectData(next);

        setProjectMessage(
          "Project choices saved."
        );
      } catch (saveError) {
        setProjectMessage(
          errorMessage(
            saveError,
            "Could not save project choices."
          )
        );
      } finally {
        setProjectSaving(false);
      }
    }, [
      applyProjectData,
      projectDirty,
      projectSaving,
      selectedProjectIds,
    ]);


  const saveMembers =
    useCallback(async () => {
      if (
        memberSaving ||
        !memberDirty
      ) {
        return;
      }

      setMemberSaving(true);
      setMemberMessage("");
      setError("");

      try {
        const next =
          await updateDowngradeMemberSelection(
            selectedMemberIds
          );

        applyMemberData(next);

        setMemberMessage(
          "Member choices saved."
        );
      } catch (saveError) {
        setMemberMessage(
          errorMessage(
            saveError,
            "Could not save member choices."
          )
        );
      } finally {
        setMemberSaving(false);
      }
    }, [
      applyMemberData,
      memberDirty,
      memberSaving,
      selectedMemberIds,
    ]);


  if (
    !loading &&
    !showManager
  ) {
    return null;
  }


  return (
    <section
      data-openshare-downgrade-manager="true"
      className="overflow-hidden rounded-3xl border border-violet-200/80 bg-gradient-to-br from-white via-violet-50/40 to-fuchsia-50/40 shadow-sm dark:border-violet-400/20 dark:from-white/[0.05] dark:via-violet-500/[0.07] dark:to-fuchsia-500/[0.06]"
    >
      <div className="border-b border-violet-100/80 p-5 dark:border-white/[0.07]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">
              <ShieldCheck className="h-4 w-4" />
              Downgrade safety
            </div>

            <h3 className="mt-2 text-lg font-black text-slate-950 dark:text-white">
              Keep control of what stays active
            </h3>

            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-600 dark:text-zinc-300">
              Nothing is deleted when your plan changes. Projects outside your
              Free allowance become read-only, and members outside the Free
              allowance become inactive. Upgrading restores access immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadSelections({
                manual: true,
              })
            }
            disabled={
              refreshing ||
              loading
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white px-3.5 py-2 text-xs font-black text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-400/20 dark:bg-white/[0.05] dark:text-violet-200"
          >
            <RefreshCw
              className={
                "h-3.5 w-3.5 " +
                (
                  refreshing
                    ? "animate-spin"
                    : ""
                )
              }
            />
            Refresh
          </button>
        </div>

        {lifecycle.active && (
          <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 dark:border-amber-400/20 dark:bg-amber-500/[0.08]">
            <div className="text-xs font-black text-amber-800 dark:text-amber-200">
              {lifecycle.title}
              {lifecycle.date
                ? ` · ${lifecycle.date}`
                : ""}
            </div>

            <div className="mt-1 text-xs font-semibold leading-relaxed text-amber-700/90 dark:text-amber-200/80">
              {lifecycle.detail}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/[0.08] dark:text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-5">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-zinc-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading downgrade choices...
          </div>
        </div>
      ) : (
        <div className="grid gap-5 p-5 xl:grid-cols-2">

          <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-violet-600 dark:text-violet-300" />

                  <h4 className="text-sm font-black text-slate-950 dark:text-white">
                    Projects
                  </h4>
                </div>

                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  {projectData?.projectLimit === -1
                    ? "Unlimited on the destination plan."
                    : `${projectData?.ownedProjectCount ?? 0} owned · Free allows ${projectData?.projectLimit ?? 0}.`}
                </p>
              </div>

              {projectData?.selectionComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <Check className="h-3 w-3" />
                  Ready
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  Choose {projectData?.remainingSelections ?? 0}
                </span>
              )}
            </div>

            {!projectData?.overProjectLimit ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold leading-relaxed text-emerald-700 dark:bg-emerald-500/[0.08] dark:text-emerald-300">
                All owned projects fit within the Free allowance. No project
                selection is required.
              </div>
            ) : (
              <>
                <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                  {(projectData?.projects || []).map(
                    (project) => {
                      const projectId =
                        String(
                          project?.id || ""
                        );

                      const selected =
                        selectedProjectIds.includes(
                          projectId
                        );

                      return (
                        <button
                          key={projectId}
                          type="button"
                          onClick={() =>
                            toggleProject(
                              projectId
                            )
                          }
                          aria-pressed={selected}
                          className={
                            "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition " +
                            (
                              selected
                                ? "border-emerald-300 bg-emerald-50/80 dark:border-emerald-400/25 dark:bg-emerald-500/[0.08]"
                                : "border-slate-200 bg-slate-50/80 hover:border-violet-300 hover:bg-violet-50/60 dark:border-white/[0.07] dark:bg-white/[0.03]"
                            )
                          }
                        >
                          <span
                            className={
                              "grid h-8 w-8 shrink-0 place-items-center rounded-xl " +
                              (
                                selected
                                  ? "bg-emerald-600 text-white"
                                  : "bg-white text-slate-400 shadow-sm dark:bg-white/[0.06] dark:text-zinc-400"
                              )
                            }
                          >
                            {selected ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Folder className="h-4 w-4" />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-black text-slate-900 dark:text-white">
                              {project?.name ||
                                "Untitled Project"}
                            </span>

                            <span className="mt-0.5 block text-[11px] font-semibold text-slate-500 dark:text-zinc-500">
                              {project?.isArchived
                                ? "Archived"
                                : project?.status ||
                                  "Project"}
                            </span>
                          </span>

                          <SelectionBadge
                            active={selected}
                            activeLabel="Writable"
                            inactiveLabel="Read-only"
                          />
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                    {selectedProjectIds.length}
                    {" / "}
                    {projectData?.projectLimit ?? 0}
                    {" selected"}
                  </div>

                  <SaveButton
                    onClick={saveProjects}
                    saving={projectSaving}
                    disabled={
                      projectSaving ||
                      !projectDirty
                    }
                  >
                    Save project choices
                  </SaveButton>
                </div>

                {projectMessage && (
                  <p className="mt-2 text-xs font-bold text-violet-700 dark:text-violet-300">
                    {projectMessage}
                  </p>
                )}
              </>
            )}
          </div>


          <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-300" />

                  <h4 className="text-sm font-black text-slate-950 dark:text-white">
                    Workspace members
                  </h4>
                </div>

                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  {memberData?.memberLimit === -1
                    ? "Unlimited on the destination plan."
                    : `${memberData?.acceptedWorkspaceMemberCount ?? 1} total · Free allows ${memberData?.memberLimit ?? 0}, including you.`}
                </p>

                {memberData?.ownerConsumesSlot && (
                  <p className="mt-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                    Free includes you plus up to{" "}
                    {memberData?.selectableMemberLimit ?? 0} additional member
                    {(memberData?.selectableMemberLimit ?? 0) === 1
                      ? ""
                      : "s"}.
                  </p>
                )}
              </div>

              {memberData?.selectionComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <Check className="h-3 w-3" />
                  Ready
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  Choose {memberData?.remainingSelections ?? 0}
                </span>
              )}
            </div>

            {!memberData?.overMemberLimit ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold leading-relaxed text-emerald-700 dark:bg-emerald-500/[0.08] dark:text-emerald-300">
                Everyone currently fits within the Free member allowance. No
                member selection is required.
              </div>
            ) : (
              <>
                <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                  {(memberData?.members || []).map(
                    (member) => {
                      const userId =
                        String(
                          member?.userId || ""
                        );

                      const selected =
                        selectedMemberIds.includes(
                          userId
                        );

                      const displayName =
                        String(
                          member?.displayName ||
                          member?.username ||
                          member?.email ||
                          "Member"
                        ).trim();

                      const secondary =
                        String(
                          member?.username
                            ? `@${member.username}`
                            : member?.email ||
                              ""
                        ).trim();

                      const avatar =
                        String(
                          member?.profilePicture ||
                          ""
                        ).trim();

                      const initials =
                        displayName
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map(
                            (part) =>
                              part[0]?.toUpperCase()
                          )
                          .join("") ||
                        "M";

                      return (
                        <button
                          key={userId}
                          type="button"
                          onClick={() =>
                            toggleMember(
                              userId
                            )
                          }
                          aria-pressed={selected}
                          className={
                            "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition " +
                            (
                              selected
                                ? "border-emerald-300 bg-emerald-50/80 dark:border-emerald-400/25 dark:bg-emerald-500/[0.08]"
                                : "border-slate-200 bg-slate-50/80 hover:border-violet-300 hover:bg-violet-50/60 dark:border-white/[0.07] dark:bg-white/[0.03]"
                            )
                          }
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-black text-white">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-black text-slate-900 dark:text-white">
                              {displayName}
                            </span>

                            <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-500 dark:text-zinc-500">
                              {secondary ||
                                `${member?.projectIds?.length || 0} project${member?.projectIds?.length === 1 ? "" : "s"}`}
                            </span>
                          </span>

                          <SelectionBadge
                            active={selected}
                            activeLabel="Active"
                            inactiveLabel="Inactive"
                          />
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                    {selectedMemberIds.length}
                    {" / "}
                    {memberData?.selectableMemberLimit ?? 0}
                    {" additional members selected"}
                  </div>

                  <SaveButton
                    onClick={saveMembers}
                    saving={memberSaving}
                    disabled={
                      memberSaving ||
                      !memberDirty
                    }
                  >
                    Save member choices
                  </SaveButton>
                </div>

                {memberMessage && (
                  <p className="mt-2 text-xs font-bold text-violet-700 dark:text-violet-300">
                    {memberMessage}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
