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
  Clock3,
  Loader2,
  Plus,
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

function StatusBadge({
  status,
}) {
  if (status === "superseded") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-400">
        <Archive className="h-2.5 w-2.5" />
        Superseded
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
      <CheckCircle2 className="h-2.5 w-2.5" />
      Active
    </span>
  );
}

export default function MoveDecisionLogPanel({
  projectId,
  task,
  disabled = false,
  readOnly = false,
} = {}) {
  const taskId = normalizeId(task);

  const [
    decisions,
    setDecisions,
  ] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

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
      if (!projectId || !taskId) {
        setDecisions([]);
        return;
      }

      setLoading(true);
      setError("");

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
        setError(
          getErrorMessage(loadError)
        );
      } finally {
        setLoading(false);
      }
    }, [projectId, taskId]);

  useEffect(() => {
    loadDecisions();
  }, [loadDecisions]);

  const moveDecisions =
    useMemo(() => {
      return (
        Array.isArray(decisions)
          ? decisions
          : []
      )
        .filter((item) => {
          const sourceType =
            String(
              item?.sourceType || ""
            ).toLowerCase();

          const sourceMoveId =
            normalizeId(
              item?.sourceMoveId
            );

          return (
            sourceType === "move" &&
            sourceMoveId === taskId
          );
        })
        .sort((a, b) => {
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
    }, [decisions, taskId]);

  const visibleDecisions =
    moveDecisions.slice(0, 3);

  const resetForm = () => {
    setTitle("");
    setDecisionText("");
    setRationale("");
  };

  const openForm = () => {
    if (
      disabled ||
      readOnly ||
      !projectId ||
      !taskId
    ) {
      return;
    }

    setError("");
    resetForm();
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setError("");
    resetForm();
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

      if (!projectId || !taskId) {
        setError(
          "This Move is missing project context."
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
              sourceType: "move",
              sourceMoveId:
                taskId,
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
        setShowForm(false);
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
      if (
        disabled ||
        readOnly
      ) {
        return;
      }

      const decisionId =
        normalizeId(item);

      if (
        !projectId ||
        !decisionId
      ) {
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
    <section
      data-move-decision-log="true"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.035]"
    >
      {/* openshare-move-decision-log-primary-v2 */}
      <style>{`
        [data-move-decision-log="true"]
        button[data-move-decision-log-primary="true"] {
          background: linear-gradient(
            90deg,
            #7c3aed 0%,
            #a855f7 55%,
            #c026d3 100%
          ) !important;
          background-color: #7c3aed !important;
          background-image: linear-gradient(
            90deg,
            #7c3aed 0%,
            #a855f7 55%,
            #c026d3 100%
          ) !important;
          border-color: transparent !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          opacity: 1 !important;
        }

        [data-move-decision-log="true"]
        button[data-move-decision-log-primary="true"] svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        [data-move-decision-log="true"]
        button[data-move-decision-log-primary="true"]:hover:not(:disabled) {
          filter: brightness(1.06);
        }

        [data-move-decision-log="true"]
        button[data-move-decision-log-primary="true"]:disabled {
          background: #e2e8f0 !important;
          background-image: none !important;
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
          cursor: not-allowed !important;
          opacity: 1 !important;
        }

        [data-move-decision-log="true"]
        button[data-move-decision-log-primary="true"]:disabled svg {
          color: #94a3b8 !important;
          stroke: #94a3b8 !important;
        }

        .dark [data-move-decision-log="true"]
        button[data-move-decision-log-primary="true"]:disabled {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #71717a !important;
          -webkit-text-fill-color: #71717a !important;
        }

        .dark [data-move-decision-log="true"]
        button[data-move-decision-log-primary="true"]:disabled svg {
          color: #71717a !important;
          stroke: #71717a !important;
        }
      `}</style>

      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-white/[0.06]">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
            <BookOpen className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Decision Log
              </h3>

              {!loading ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
                  {moveDecisions.length}
                </span>
              ) : null}
            </div>

            <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-zinc-400">
              Decisions recorded from this Move.
            </p>
          </div>
        </div>

        {!readOnly ? (
          <button
            type="button"
            onClick={openForm}
            data-move-decision-log-primary="true"
            disabled={
              disabled ||
              loading ||
              !projectId ||
              !taskId
            }
            style={{
              background:
                "linear-gradient(90deg, #7c3aed 0%, #a855f7 55%, #c026d3 100%)",
              color: "#ffffff",
            }}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Record decision
          </button>
        ) : null}
      </div>

      <div className="p-4">
        {error ? (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {showForm ? (
          <form
            onSubmit={handleCreate}
            className="mb-4 rounded-2xl border border-violet-200 bg-violet-50/50 p-3.5 dark:border-violet-500/20 dark:bg-violet-500/[0.06]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-600 dark:text-violet-300">
                  From this Move
                </div>

                <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  The source link is added automatically.
                </div>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
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
                placeholder="What choice was made?"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-white"
              />
            </label>

            <label className="mt-3 block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
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
                rows={3}
                disabled={saving}
                placeholder="Record the outcome."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-zinc-100"
              />
            </label>

            <label className="mt-3 block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                Why?
                <span className="ml-1.5 normal-case tracking-normal text-slate-400">
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
                rows={2}
                disabled={saving}
                placeholder="Reasoning or tradeoff."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-zinc-100"
              />
            </label>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                data-move-decision-log-primary="true"
                disabled={
                  saving ||
                  !title.trim() ||
                  !decisionText.trim()
                }
                style={{
                  background:
                    "linear-gradient(90deg, #7c3aed 0%, #a855f7 55%, #c026d3 100%)",
                  color: "#ffffff",
                }}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <BookOpen className="h-3.5 w-3.5" />
                )}

                {saving
                  ? "Recording…"
                  : "Record decision"}
              </button>
            </div>
          </form>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 py-4 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-zinc-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading Move decisions…
          </div>
        ) : visibleDecisions.length ===
          0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-4 text-center dark:border-white/10">
            <div className="text-xs font-bold text-slate-600 dark:text-zinc-300">
              No decisions recorded from this Move yet.
            </div>

            <div className="mt-1 text-[11px] leading-5 text-slate-400 dark:text-zinc-500">
              Preserve important execution choices here instead of burying them in discussion.
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleDecisions.map(
              (item, index) => {
                const id =
                  normalizeId(item);

                const superseded =
                  item?.status ===
                  "superseded";

                return (
                  <article
                    key={
                      id ||
                      `move-decision-${index}`
                    }
                    className={[
                      "rounded-xl border px-3.5 py-3",
                      superseded
                        ? "border-slate-200 bg-slate-50/70 dark:border-white/[0.07] dark:bg-white/[0.025]"
                        : "border-slate-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.035]",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-black text-slate-900 dark:text-white">
                            {item?.title ||
                              "Untitled decision"}
                          </div>

                          <StatusBadge
                            status={
                              item?.status
                            }
                          />
                        </div>

                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                          <Clock3 className="h-3 w-3" />
                          {formatDate(
                            item?.decidedAt ||
                              item?.createdAt
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-zinc-300">
                      {item?.decision ||
                        "No outcome recorded."}
                    </p>

                    {item?.rationale ? (
                      <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-400 dark:text-zinc-500">
                        {item.rationale}
                      </p>
                    ) : null}

                    {!readOnly &&
                    !superseded ? (
                      <div className="mt-3 flex justify-end border-t border-slate-100 pt-2.5 dark:border-white/[0.06]">
                        <button
                          type="button"
                          onClick={() =>
                            handleSupersede(
                              item
                            )
                          }
                          disabled={
                            disabled ||
                            busyId === id
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200"
                        >
                          {busyId === id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Archive className="h-3 w-3" />
                          )}

                          Mark superseded
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              }
            )}

            {moveDecisions.length >
            visibleDecisions.length ? (
              <div className="text-center text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                +
                {moveDecisions.length -
                  visibleDecisions.length}{" "}
                older decision
                {moveDecisions.length -
                  visibleDecisions.length ===
                1
                  ? ""
                  : "s"}{" "}
                in the project Decision Log
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
