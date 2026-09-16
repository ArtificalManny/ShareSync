import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Archive,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";

import {
  createProjectDecision,
  getProjectDecisions,
  updateProjectDecision,
} from "../../api/decisions";

function normalizeId(value) {
  if (!value) return "";

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return normalizeId(
    value?._id ||
      value?.id ||
      value?.userId ||
      value?.user
  );
}

function formatDecisionDate(value) {
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

function formatDecisionDateTime(value) {
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
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}

function getErrorMessage(error) {
  const raw =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Decision Log could not be updated.";

  return Array.isArray(raw)
    ? raw.join(" ")
    : String(raw);
}

function DecisionStatusBadge({
  status,
}) {
  const superseded =
    status === "superseded";

  if (superseded) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-400">
        <Archive className="h-3 w-3" />
        Superseded
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
      <CheckCircle2 className="h-3 w-3" />
      Active
    </span>
  );
}

function SourceBadge({
  decision,
}) {
  const sourceType =
    String(
      decision?.sourceType ||
        "project"
    ).toLowerCase();

  if (sourceType === "move") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-600 dark:text-violet-300">
        <Link2 className="h-3 w-3" />
        From Move
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
      <FileText className="h-3 w-3" />
      Project decision
    </span>
  );
}

function DecisionRow({
  item,
  expanded = false,
  readOnly = false,
  busyId = "",
  onSupersede,
}) {
  const id =
    normalizeId(item);

  const superseded =
    item?.status === "superseded";

  return (
    <article
      className={[
        "rounded-2xl border p-4 transition",
        superseded
          ? "border-slate-200 bg-slate-50/75 opacity-80 dark:border-white/[0.07] dark:bg-white/[0.025]"
          : "border-slate-200/90 bg-white/90 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="min-w-0 truncate text-sm font-black text-slate-900 dark:text-white">
              {item?.title ||
                "Untitled decision"}
            </h4>

            <DecisionStatusBadge
              status={item?.status}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
              <Clock3 className="h-3 w-3" />
              {formatDecisionDate(
                item?.decidedAt ||
                  item?.createdAt
              ) || "Recently"}
            </span>

            <SourceBadge
              decision={item}
            />
          </div>
        </div>
      </div>

      <p
        className={[
          "mt-3 text-sm leading-6 text-slate-700 dark:text-zinc-200",
          expanded
            ? ""
            : "line-clamp-2",
        ].join(" ")}
      >
        {item?.decision ||
          "No outcome recorded."}
      </p>

      {expanded &&
      item?.rationale ? (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 dark:border-white/[0.06] dark:bg-black/10">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
            Rationale
          </div>

          <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-zinc-300">
            {item.rationale}
          </p>
        </div>
      ) : null}

      {expanded ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
          <div className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
            {formatDecisionDateTime(
              item?.decidedAt ||
                item?.createdAt
            )}
          </div>

          {!readOnly &&
          !superseded ? (
            <button
              type="button"
              onClick={() =>
                onSupersede?.(item)
              }
              disabled={
                busyId === id
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08]"
            >
              {busyId === id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}

              Mark superseded
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function DecisionLogPanel({
  projectId,
  readOnly = false,
} = {}) {
  const [
    decisions,
    setDecisions,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    accessDenied,
    setAccessDenied,
  ] = useState(false);

  const [modal, setModal] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [busyId, setBusyId] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [
    decisionText,
    setDecisionText,
  ] = useState("");

  const [
    rationale,
    setRationale,
  ] = useState("");

  const loadDecisions =
    useCallback(async () => {
      if (!projectId) {
        setDecisions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setAccessDenied(false);

      try {
        const result =
          await getProjectDecisions(
            projectId
          );

        setDecisions(
          Array.isArray(result)
            ? result
            : []
        );
      } catch (loadError) {
        const status = Number(
          loadError?.response?.status ||
            loadError?.response?.data
              ?.statusCode ||
            0
        );

        if (
          status === 401 ||
          status === 403
        ) {
          setAccessDenied(true);
          setError(
            "Decision Log is available to project members."
          );
        } else {
          setError(
            getErrorMessage(loadError)
          );
        }
      } finally {
        setLoading(false);
      }
    }, [projectId]);

  useEffect(() => {
    loadDecisions();
  }, [loadDecisions]);

  const sortedDecisions =
    useMemo(() => {
      return [
        ...(Array.isArray(decisions)
          ? decisions
          : []),
      ].sort((a, b) => {
        const aTime =
          new Date(
            a?.decidedAt ||
              a?.createdAt ||
              0
          ).getTime() || 0;

        const bTime =
          new Date(
            b?.decidedAt ||
              b?.createdAt ||
              0
          ).getTime() || 0;

        return bTime - aTime;
      });
    }, [decisions]);

  const preview =
    sortedDecisions.slice(0, 3);

  const activeCount =
    sortedDecisions.filter(
      (item) =>
        item?.status !==
        "superseded"
    ).length;

  const resetForm = () => {
    setTitle("");
    setDecisionText("");
    setRationale("");
  };

  const closeModal = () => {
    if (saving) return;

    setModal("");
    setError("");
  };

  const openCreate = () => {
    if (readOnly) return;

    resetForm();
    setError("");
    setModal("create");
  };

  const handleCreate =
    async (event) => {
      event?.preventDefault?.();

      const cleanTitle =
        title.trim();

      const cleanDecision =
        decisionText.trim();

      if (!cleanTitle) {
        setError(
          "Give this decision a short title."
        );
        return;
      }

      if (!cleanDecision) {
        setError(
          "Record what was actually decided."
        );
        return;
      }

      setSaving(true);
      setError("");

      try {
        const created =
          await createProjectDecision(
            projectId,
            {
              title: cleanTitle,
              decision:
                cleanDecision,
              rationale:
                rationale.trim(),
              sourceType:
                "project",
            }
          );

        setDecisions(
          (current) => [
            created,
            ...(Array.isArray(
              current
            )
              ? current
              : []),
          ]
        );

        resetForm();
        setModal("");
      } catch (createError) {
        setError(
          getErrorMessage(
            createError
          )
        );
      } finally {
        setSaving(false);
      }
    };

  const handleSupersede =
    async (item) => {
      if (readOnly) return;

      const decisionId =
        normalizeId(item);

      if (!decisionId) {
        return;
      }

      setBusyId(decisionId);
      setError("");

      try {
        const updated =
          await updateProjectDecision(
            projectId,
            decisionId,
            {
              status:
                "superseded",
            }
          );

        setDecisions(
          (current) =>
            (
              Array.isArray(current)
                ? current
                : []
            ).map((candidate) =>
              normalizeId(
                candidate
              ) === decisionId
                ? updated
                : candidate
            )
        );
      } catch (updateError) {
        setError(
          getErrorMessage(
            updateError
          )
        );
      } finally {
        setBusyId("");
      }
    };

  return (
    <>
      {/* openshare-decision-log-modal-layout-v2 */}
      <style>{`
        [data-decision-log-primary="true"] {
          background: linear-gradient(
            90deg,
            #7c3aed 0%,
            #a855f7 52%,
            #c026d3 100%
          ) !important;
          background-color: #7c3aed !important;
          color: #ffffff !important;
          border-color: transparent !important;
          opacity: 1 !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        [data-decision-log-primary="true"] span,
        [data-decision-log-primary="true"] svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        [data-decision-log-primary="true"]:hover:not(:disabled) {
          filter: brightness(1.04);
        }

        [data-decision-log-primary="true"]:disabled {
          background: #e2e8f0 !important;
          background-image: none !important;
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
          cursor: not-allowed !important;
          opacity: 1 !important;
        }

        [data-decision-log-primary="true"]:disabled svg {
          color: #94a3b8 !important;
          stroke: #94a3b8 !important;
        }

        .dark [data-decision-log-primary="true"]:disabled {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #71717a !important;
          -webkit-text-fill-color: #71717a !important;
        }

        .dark [data-decision-log-primary="true"]:disabled svg {
          color: #71717a !important;
          stroke: #71717a !important;
        }
      `}</style>

      <section
        data-decision-log-panel="true"
        className="mb-8 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_18px_55px_rgba(15,23,42,0.07)] dark:border-white/[0.08] dark:bg-[#111113]/90 dark:shadow-none"
      >
        <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400" />

        <div className="p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                  <BookOpen className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
                      Decision Log
                    </h3>

                    {!loading ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
                        {activeCount} active
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
                    Durable choices and the reasoning behind them.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={
                  loadDecisions
                }
                disabled={loading}
                aria-label="Refresh Decision Log"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:bg-white/[0.08]"
              >
                <RefreshCw
                  className={[
                    "h-4 w-4",
                    loading
                      ? "animate-spin"
                      : "",
                  ].join(" ")}
                />
              </button>

              {sortedDecisions.length >
              0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setModal("all");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : null}

              {!readOnly && !accessDenied ? (
                <button
                  type="button"
                  onClick={
                    openCreate
                  }
                  data-decision-log-primary="true"
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black shadow-sm transition"
                >
                  <Plus className="h-4 w-4" />
                  Record decision
                </button>
              ) : null}
            </div>
          </div>

          {error &&
          !modal ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 dark:border-white/[0.08] dark:bg-white/[0.025]">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading decisions…
              </div>
            </div>
          ) : preview.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-8 text-center dark:border-white/[0.08] dark:bg-white/[0.025]">
              <BookOpen className="h-6 w-6 text-slate-300 dark:text-zinc-600" />

              <h4 className="mt-3 text-sm font-black text-slate-800 dark:text-zinc-100">
                No decisions recorded yet
              </h4>

              <p className="mt-1 max-w-md text-xs leading-5 text-slate-500 dark:text-zinc-400">
                Record the important choices that future collaborators should not have to rediscover.
              </p>

              {!readOnly && !accessDenied ? (
                <button
                  type="button"
                  onClick={
                    openCreate
                  }
                  data-decision-log-primary="true"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition"
                >
                  <Plus className="h-4 w-4" />
                  Record first decision
                </button>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 grid gap-3 lg:grid-cols-3">
              {preview.map(
                (item, index) => (
                  <DecisionRow
                    key={
                      normalizeId(item) ||
                      `decision-${index}`
                    }
                    item={item}
                    readOnly={readOnly}
                  />
                )
              )}
            </div>
          )}
        </div>
      </section>

      {modal ? (
        <div
          className="fixed inset-0 z-[180] flex items-start justify-center overflow-y-auto bg-slate-950/55 px-4 pb-6 pt-[88px] backdrop-blur-sm md:pt-[96px]"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className={[
              "flex max-h-[calc(100vh-120px)] w-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111113]",
              modal === "all"
                ? "max-w-4xl"
                : "max-w-2xl",
            ].join(" ")}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-white/[0.07]">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500">
                  Decision Log
                </div>

                <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
                  {modal === "all"
                    ? "Project decisions"
                    : "Record decision"}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modal === "create" ? (
              <form
                onSubmit={handleCreate}
                className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6"
              >
                {error ? (
                  <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                    {error}
                  </div>
                ) : null}

                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                    Decision title
                  </span>

                  <input
                    value={title}
                    onChange={(event) =>
                      setTitle(
                        event.target.value
                      )
                    }
                    maxLength={300}
                    disabled={saving}
                    autoFocus
                    placeholder="Use Render for production hosting"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-white"
                  />
                </label>

                <label className="mt-5 block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                    What was decided?
                  </span>

                  <textarea
                    value={
                      decisionText
                    }
                    onChange={(event) =>
                      setDecisionText(
                        event.target.value
                      )
                    }
                    maxLength={5000}
                    rows={4}
                    disabled={saving}
                    placeholder="Record the actual outcome, not just the topic that was discussed."
                    className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-zinc-100"
                  />
                </label>

                <label className="mt-5 block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                    Why?
                    <span className="ml-2 normal-case tracking-normal text-slate-400">
                      Optional
                    </span>
                  </span>

                  <textarea
                    value={rationale}
                    onChange={(event) =>
                      setRationale(
                        event.target.value
                      )
                    }
                    maxLength={10000}
                    rows={4}
                    disabled={saving}
                    placeholder="Capture the reasoning, tradeoff, constraint, or evidence behind the choice."
                    className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-zinc-100"
                  />
                </label>

                <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5 dark:border-white/[0.07]">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !title.trim() ||
                      !decisionText.trim()
                    }
                    data-decision-log-primary="true"
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}

                    {saving
                      ? "Recording…"
                      : "Record decision"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
                {error ? (
                  <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                    {error}
                  </div>
                ) : null}

                <div className="space-y-3">
                  {sortedDecisions.map(
                    (item, index) => (
                      <DecisionRow
                        key={
                          normalizeId(
                            item
                          ) ||
                          `decision-full-${index}`
                        }
                        item={item}
                        expanded
                        readOnly={
                          readOnly
                        }
                        busyId={
                          busyId
                        }
                        onSupersede={
                          handleSupersede
                        }
                      />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
