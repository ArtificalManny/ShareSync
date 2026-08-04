import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Inbox,
  Loader2,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";

import {
  convertIntakeSubmission,
  getIntakeApiError,
  listIntakeSubmissions,
  updateIntakeSubmissionStatus,
} from "./intakeFormsApi";
import {
  toast,
} from "../../components/ui/toast";

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All submissions",
  },
  {
    value: "new",
    label: "New",
  },
  {
    value: "reviewing",
    label: "Reviewing",
  },
  {
    value: "accepted",
    label: "Accepted",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
];

function getId(value) {
  return String(value?._id || value?.id || value || "");
}

function formatDate(value) {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString();
}

function statusStyles(status) {
  switch (status) {
    case "accepted":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200";
    case "rejected":
      return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200";
    case "reviewing":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200";
    default:
      return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200";
  }
}

function displayAnswer(value) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || value === undefined) {
    return "—";
  }

  return String(value);
}

export default function IntakeSubmissions({
  projectId,
  form,
  canManage,
  onClose,
}) {
  const formId = getId(form);

  const [submissions, setSubmissions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(
    () =>
      submissions.find(
        (submission) =>
          getId(submission) === selectedId
      ) || null,
    [submissions, selectedId]
  );

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await listIntakeSubmissions(
        projectId,
        formId,
        statusFilter || undefined
      );

      setSubmissions(data);

      setSelectedId((current) => {
        if (
          current &&
          data.some(
            (submission) =>
              getId(submission) === current
          )
        ) {
          return current;
        }

        return data.length ? getId(data[0]) : "";
      });
    } catch (loadError) {
      const message = getIntakeApiError(
        loadError,
        "Submissions could not be loaded."
      );

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [projectId, formId, statusFilter]);

  async function changeStatus(status) {
    if (!selected || !canManage) return;

    const submissionId = getId(selected);
    setBusyId(submissionId);

    try {
      const updated =
        await updateIntakeSubmissionStatus(
          projectId,
          formId,
          submissionId,
          status
        );

      setSubmissions((current) =>
        current.map((submission) =>
          getId(submission) === submissionId
            ? updated
            : submission
        )
      );

      toast.success("Submission status updated");
    } catch (statusError) {
      toast.error(
        getIntakeApiError(
          statusError,
          "The submission status could not be updated."
        )
      );
    } finally {
      setBusyId("");
    }
  }

  async function convertToMove() {
    if (!selected || !canManage) return;

    const submissionId = getId(selected);

    if (selected.convertedTaskId) {
      toast.error(
        "This submission has already been converted."
      );
      return;
    }

    const confirmed = window.confirm(
      "Convert this submission into a project Move?"
    );

    if (!confirmed) return;

    setBusyId(submissionId);

    try {
      const result =
        await convertIntakeSubmission(
          projectId,
          formId,
          submissionId,
          {
            status: "backlog",
            priority: "medium",
          }
        );

      const updated =
        result?.submission || selected;

      setSubmissions((current) =>
        current.map((submission) =>
          getId(submission) === submissionId
            ? updated
            : submission
        )
      );

      toast.success(
        "Submission converted into a Move"
      );
    } catch (conversionError) {
      toast.error(
        getIntakeApiError(
          conversionError,
          "The submission could not be converted."
        )
      );
    } finally {
      setBusyId("");
    }
  }

  const taskId = getId(
    selected?.convertedTaskId
  );

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Intake submission inbox"
    >
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-violet-50 px-6 py-5 dark:border-slate-700 dark:from-cyan-500/10 dark:to-violet-500/10">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-200">
              <Inbox className="h-4 w-4" />
              Submission inbox
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {form?.name || "Intake form"}
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Review requests and convert approved
              submissions into Moves.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Refresh submissions"
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
              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Close submissions"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid min-h-[620px] lg:grid-cols-[360px_1fr]">
          <aside className="border-b border-slate-200 p-4 dark:border-slate-700 lg:border-b-0 lg:border-r">
            <label className="mb-4 block">
              <span className="sr-only">
                Filter submissions
              </span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-violet-500 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading submissions…
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </div>
            ) : submissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center dark:border-slate-700">
                <Inbox className="mx-auto h-8 w-8 text-slate-400" />

                <p className="mt-3 font-black text-slate-800 dark:text-white">
                  No submissions
                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  New responses will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map((submission) => {
                  const id = getId(submission);
                  const firstAnswer =
                    submission.answers?.[0];
                  const active = id === selectedId;

                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() =>
                        setSelectedId(id)
                      }
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-violet-400 bg-violet-50 shadow-sm dark:border-violet-500 dark:bg-violet-500/10"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusStyles(
                            submission.status
                          )}`}
                        >
                          {submission.status || "new"}
                        </span>

                        {submission.convertedTaskId && (
                          <span className="text-[11px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                            Converted
                          </span>
                        )}
                      </div>

                      <p className="truncate font-bold text-slate-900 dark:text-white">
                        {displayAnswer(
                          firstAnswer?.value
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(
                          submission.submittedAt ||
                            submission.createdAt
                        )}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <main className="p-5 sm:p-6">
            {!selected ? (
              <div className="flex h-full min-h-[360px] items-center justify-center text-center">
                <div>
                  <Inbox className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />

                  <p className="mt-4 font-black text-slate-700 dark:text-slate-200">
                    Select a submission
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${statusStyles(
                          selected.status
                        )}`}
                      >
                        {selected.status || "new"}
                      </span>

                      {selected.conversionStatus ===
                        "converted" && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                          Move created
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      Submitted{" "}
                      {formatDate(
                        selected.submittedAt ||
                          selected.createdAt
                      )}
                    </p>
                  </div>

                  {taskId && (
                    <a
                      href={`/projects/${projectId}?tab=stack`}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                    >
                      View project Moves
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>

                <div className="space-y-3">
                  {(selected.answers || []).map(
                    (answer) => (
                      <div
                        key={answer.fieldId}
                        className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
                      >
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          {answer.label}
                        </p>

                        <p className="mt-2 whitespace-pre-wrap break-words text-slate-900 dark:text-white">
                          {displayAnswer(
                            answer.value
                          )}
                        </p>
                      </div>
                    )
                  )}
                </div>

                {canManage && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50">
                    <h3 className="font-black text-slate-900 dark:text-white">
                      Review actions
                    </h3>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          changeStatus("reviewing")
                        }
                        disabled={
                          busyId === getId(selected)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                      >
                        <Clock3 className="h-4 w-4" />
                        Mark reviewing
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          changeStatus("rejected")
                        }
                        disabled={
                          busyId === getId(selected)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          changeStatus("accepted")
                        }
                        disabled={
                          busyId === getId(selected)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Accept
                      </button>

                      <button
                        type="button"
                        onClick={convertToMove}
                        disabled={
                          busyId === getId(selected) ||
                          Boolean(
                            selected.convertedTaskId
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-bold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyId === getId(selected) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}

                        {selected.convertedTaskId
                          ? "Already converted"
                          : "Convert to Move"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
