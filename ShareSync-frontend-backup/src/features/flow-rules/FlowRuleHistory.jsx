import React from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";

function formatDate(value) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function statusClasses(status) {
  if (status === "succeeded") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
  }

  if (status === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
}

export default function FlowRuleHistory({
  open,
  rule,
  executions,
  loading,
  error,
  onClose,
  onRefresh,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="flow-rule-history-title"
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-50 shadow-2xl dark:bg-[#090f1c]">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/95 px-5 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-[#090f1c]/95 sm:px-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
              Execution history
            </p>

            <h3
              id="flow-rule-history-title"
              className="mt-1 text-2xl font-black text-slate-950 dark:text-white"
            >
              {rule?.name || "Flow Rule"}
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Recent attempts recorded by the
              backend execution engine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh execution history"
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <RefreshCw
                className={`h-5 w-5 ${
                  loading ? "animate-spin" : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close execution history"
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="space-y-4 px-5 py-6 sm:px-7">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading executions...
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
            >
              {error}
            </div>
          ) : executions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-white/15">
              <Clock3 className="mx-auto h-8 w-8 text-slate-400" />

              <p className="mt-3 font-black text-slate-800 dark:text-white">
                No executions yet
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                History appears after this rule
                matches and attempts its actions.
              </p>
            </div>
          ) : (
            executions.map((execution) => {
              const id = String(
                execution?._id ||
                  execution?.id ||
                  `${execution?.startedAt}-${execution?.taskId}`
              );

              const succeeded =
                execution?.status === "succeeded";

              return (
                <article
                  key={id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 rounded-xl p-2 ${
                          succeeded
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                        }`}
                      >
                        {succeeded ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <p className="font-black text-slate-950 dark:text-white">
                          {execution?.triggerType ||
                            execution?.eventType ||
                            "Rule execution"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Started{" "}
                          {formatDate(
                            execution?.startedAt ||
                              execution?.createdAt
                          )}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.1em] ${statusClasses(
                        execution?.status
                      )}`}
                    >
                      {execution?.status ||
                        "unknown"}
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                        Actions
                      </dt>
                      <dd className="mt-1 font-bold text-slate-800 dark:text-slate-100">
                        {Number(
                          execution?.actionCount ||
                            0
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                        Conditions
                      </dt>
                      <dd className="mt-1 font-bold text-slate-800 dark:text-slate-100">
                        {Number(
                          execution?.matchedConditionCount ||
                            0
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                        Depth
                      </dt>
                      <dd className="mt-1 font-bold text-slate-800 dark:text-slate-100">
                        {Number(
                          execution?.depth || 0
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                        Completed
                      </dt>
                      <dd className="mt-1 font-bold text-slate-800 dark:text-slate-100">
                        {formatDate(
                          execution?.completedAt
                        )}
                      </dd>
                    </div>
                  </dl>

                  {execution?.error ? (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                      {execution.error}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
