import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  AlertCircle,
  GitBranch,
  History,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";

import { toast } from "../../components/ui/toast";
import FlowRuleEditor from "./FlowRuleEditor";
import FlowRuleHistory from "./FlowRuleHistory";
import {
  createFlowRule,
  deleteFlowRule,
  listFlowRuleExecutions,
  listFlowRules,
  setFlowRuleEnabled,
  updateFlowRule,
} from "./flowRulesApi";

const TRIGGER_LABELS = {
  "task.created": "Move created",
  "task.status_changed":
    "Move status changed",
  "task.priority_changed":
    "Move priority changed",
};

const ACTION_LABELS = {
  "task.assign": "Assign move",
  "task.set_priority": "Set priority",
  "task.set_status": "Set status",
  "notification.project":
    "Project notification",
};

function ruleId(rule) {
  return String(rule?._id || rule?.id || "");
}

function formatDate(value) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function getErrorMessage(
  error,
  fallback = "Something went wrong."
) {
  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error;

  if (Array.isArray(backendMessage)) {
    return backendMessage.join(" ");
  }

  return String(
    backendMessage ||
      error?.message ||
      fallback
  );
}

function RuleToggle({
  checked,
  disabled,
  onChange,
  label,
}) {
  return (
    <label
      className={`relative inline-flex h-7 w-12 shrink-0 ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer"
      }`}
      title={label}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        aria-label={label}
        className="peer sr-only"
      />

      <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 dark:bg-slate-700" />
      <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
    </label>
  );
}

export default function FlowRulesPanel({
  projectId,
  project,
  canManage = false,
}) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const [editorOpen, setEditorOpen] =
    useState(false);
  const [editingRule, setEditingRule] =
    useState(null);
  const [savingRule, setSavingRule] =
    useState(false);
  const [busyRuleId, setBusyRuleId] =
    useState("");

  const [historyOpen, setHistoryOpen] =
    useState(false);
  const [historyRule, setHistoryRule] =
    useState(null);
  const [executions, setExecutions] =
    useState([]);
  const [historyLoading, setHistoryLoading] =
    useState(false);
  const [historyError, setHistoryError] =
    useState("");

  const loadRules = useCallback(
    async ({ silent = false } = {}) => {
      if (!projectId) {
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const nextRules =
          await listFlowRules(projectId);

        setRules(nextRules);
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
            "Unable to load Flow Rules."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const openCreate = () => {
    if (!canManage) {
      return;
    }

    setEditingRule(null);
    setEditorOpen(true);
  };

  const openEdit = (rule) => {
    if (!canManage) {
      return;
    }

    setEditingRule(rule);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (savingRule) {
      return;
    }

    setEditorOpen(false);
    setEditingRule(null);
  };

  const saveRule = async (payload) => {
    if (!canManage || !projectId) {
      return;
    }

    setSavingRule(true);

    try {
      const id = ruleId(editingRule);

      const saved = id
        ? await updateFlowRule(
            projectId,
            id,
            payload
          )
        : await createFlowRule(
            projectId,
            payload
          );

      setRules((current) => {
        const savedId = ruleId(saved);

        if (!savedId) {
          return current;
        }

        const existing = current.some(
          (rule) => ruleId(rule) === savedId
        );

        if (existing) {
          return current.map((rule) =>
            ruleId(rule) === savedId
              ? saved
              : rule
          );
        }

        return [saved, ...current];
      });

      toast({
        title: id
          ? "Flow Rule updated"
          : "Flow Rule created",
        description: saved?.enabled
          ? "The rule is active."
          : "The rule is saved but disabled.",
        variant: "success",
      });

      setEditorOpen(false);
      setEditingRule(null);
    } catch (saveError) {
      toast({
        title: "Could not save Flow Rule",
        description: getErrorMessage(
          saveError
        ),
        variant: "error",
      });

      throw saveError;
    } finally {
      setSavingRule(false);
    }
  };

  const toggleRule = async (
    rule,
    enabled
  ) => {
    if (!canManage) {
      return;
    }

    const id = ruleId(rule);

    if (!id) {
      return;
    }

    setBusyRuleId(id);

    try {
      const updated =
        await setFlowRuleEnabled(
          projectId,
          id,
          enabled
        );

      setRules((current) =>
        current.map((candidate) =>
          ruleId(candidate) === id
            ? updated
            : candidate
        )
      );

      toast({
        title: enabled
          ? "Flow Rule enabled"
          : "Flow Rule paused",
        variant: "success",
      });
    } catch (toggleError) {
      toast({
        title: "Could not update Flow Rule",
        description: getErrorMessage(
          toggleError
        ),
        variant: "error",
      });
    } finally {
      setBusyRuleId("");
    }
  };

  const removeRule = async (rule) => {
    if (!canManage) {
      return;
    }

    const id = ruleId(rule);

    if (!id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete “${rule.name}”? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setBusyRuleId(id);

    try {
      await deleteFlowRule(projectId, id);

      setRules((current) =>
        current.filter(
          (candidate) =>
            ruleId(candidate) !== id
        )
      );

      toast({
        title: "Flow Rule deleted",
        variant: "success",
      });
    } catch (deleteError) {
      toast({
        title: "Could not delete Flow Rule",
        description: getErrorMessage(
          deleteError
        ),
        variant: "error",
      });
    } finally {
      setBusyRuleId("");
    }
  };

  const loadHistory = useCallback(
    async (rule) => {
      const id = ruleId(rule);

      if (!projectId || !id) {
        return;
      }

      setHistoryLoading(true);
      setHistoryError("");

      try {
        const nextExecutions =
          await listFlowRuleExecutions(
            projectId,
            id
          );

        setExecutions(nextExecutions);
      } catch (historyLoadError) {
        setHistoryError(
          getErrorMessage(
            historyLoadError,
            "Unable to load execution history."
          )
        );
      } finally {
        setHistoryLoading(false);
      }
    },
    [projectId]
  );

  const openHistory = async (rule) => {
    setHistoryRule(rule);
    setExecutions([]);
    setHistoryOpen(true);

    await loadHistory(rule);
  };

  const closeHistory = () => {
    setHistoryOpen(false);
    setHistoryRule(null);
    setExecutions([]);
    setHistoryError("");
  };

  const enabledCount = rules.filter(
    (rule) => rule.enabled !== false
  ).length;

  return (
    <>
      <section className="project-settings-card project-flow-rules-card mb-6 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-xl dark:border-violet-500/20 dark:bg-slate-800/50">
        <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-6 py-6 dark:border-white/10 dark:from-violet-500/10 dark:via-transparent dark:to-cyan-500/10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                <GitBranch className="h-6 w-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    Flow Rules
                  </h2>

                  <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-xs font-black text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    {enabledCount} active
                  </span>
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Automate assignments, priority
                  changes, workflow stages, and
                  project notifications when Moves
                  change.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  loadRules({ silent: true })
                }
                disabled={refreshing || loading}
                aria-label="Refresh Flow Rules"
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </button>

              {canManage ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:from-violet-500 hover:to-indigo-500"
                >
                  <Plus className="h-4 w-4" />
                  New rule
                </button>
              ) : null}
            </div>
          </div>

          {!canManage ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />

              <p>
                You can inspect Flow Rules and their
                execution history. Only project
                owners and admins can change them.
              </p>
            </div>
          ) : null}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex min-h-40 items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading Flow Rules...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-500/30 dark:bg-rose-500/10">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-300" />

                <div>
                  <p className="font-black text-rose-800 dark:text-rose-100">
                    Flow Rules could not load
                  </p>

                  <p className="mt-1 text-sm text-rose-700 dark:text-rose-200">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={() => loadRules()}
                    className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-sm font-black text-white transition hover:bg-rose-500"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          ) : rules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-white/15">
              <Zap className="mx-auto h-9 w-9 text-violet-500" />

              <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                No Flow Rules yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Create a rule to automate repetitive
                project work while preserving a
                visible execution history.
              </p>

              {canManage ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-violet-500"
                >
                  <Plus className="h-4 w-4" />
                  Create first rule
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => {
                const id = ruleId(rule);
                const busy = busyRuleId === id;
                const conditions = Array.isArray(
                  rule?.conditions
                )
                  ? rule.conditions
                  : [];
                const actions = Array.isArray(
                  rule?.actions
                )
                  ? rule.actions
                  : [];

                return (
                  <article
                    key={id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-violet-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.025] dark:hover:border-violet-500/30"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-black text-slate-950 dark:text-white">
                            {rule?.name ||
                              "Untitled rule"}
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-[0.1em] ${
                              rule?.enabled !== false
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                                : "border-slate-200 bg-slate-100 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                            }`}
                          >
                            {rule?.enabled !== false
                              ? "Active"
                              : "Paused"}
                          </span>
                        </div>

                        {rule?.description ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            {rule.description}
                          </p>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200">
                            When:{" "}
                            {TRIGGER_LABELS[
                              rule?.triggerType
                            ] ||
                              rule?.triggerType}
                          </span>

                          <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                            {conditions.length}{" "}
                            {conditions.length === 1
                              ? "condition"
                              : "conditions"}
                          </span>

                          {actions.map(
                            (action, index) => (
                              <span
                                key={`${id}-action-${index}`}
                                className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-bold text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200"
                              >
                                Then:{" "}
                                {ACTION_LABELS[
                                  action?.type
                                ] ||
                                  action?.type}
                              </span>
                            )
                          )}
                        </div>

                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                          <div>
                            <dt className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">
                              Executions
                            </dt>
                            <dd className="mt-1 font-black text-slate-800 dark:text-slate-100">
                              {Number(
                                rule?.executionCount ||
                                  0
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">
                              Failures
                            </dt>
                            <dd
                              className={`mt-1 font-black ${
                                Number(
                                  rule?.failureCount ||
                                    0
                                ) > 0
                                  ? "text-rose-600 dark:text-rose-300"
                                  : "text-slate-800 dark:text-slate-100"
                              }`}
                            >
                              {Number(
                                rule?.failureCount ||
                                  0
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">
                              Last run
                            </dt>
                            <dd className="mt-1 font-bold text-slate-600 dark:text-slate-300">
                              {formatDate(
                                rule?.lastTriggeredAt
                              )}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openHistory(rule)
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <History className="h-4 w-4" />
                          History
                        </button>

                        {canManage ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(rule)
                              }
                              disabled={busy}
                              aria-label={`Edit ${rule.name}`}
                              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-violet-700 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-violet-300"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeRule(rule)
                              }
                              disabled={busy}
                              aria-label={`Delete ${rule.name}`}
                              className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>

                            <RuleToggle
                              checked={
                                rule?.enabled !==
                                false
                              }
                              disabled={busy}
                              onChange={(enabled) =>
                                toggleRule(
                                  rule,
                                  enabled
                                )
                              }
                              label={
                                rule?.enabled !== false
                                  ? `Pause ${rule.name}`
                                  : `Enable ${rule.name}`
                              }
                            />
                          </>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <FlowRuleEditor
        open={editorOpen}
        rule={editingRule}
        project={project}
        saving={savingRule}
        onClose={closeEditor}
        onSave={saveRule}
      />

      <FlowRuleHistory
        open={historyOpen}
        rule={historyRule}
        executions={executions}
        loading={historyLoading}
        error={historyError}
        onClose={closeHistory}
        onRefresh={() =>
          historyRule
            ? loadHistory(historyRule)
            : undefined
        }
      />
    </>
  );
}
