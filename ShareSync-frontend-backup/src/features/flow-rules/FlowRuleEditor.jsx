import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

const TRIGGERS = [
  {
    value: "task.created",
    label: "Move created",
  },
  {
    value: "task.status_changed",
    label: "Move status changed",
  },
  {
    value: "task.priority_changed",
    label: "Move priority changed",
  },
];

const CONDITION_FIELDS = [
  {
    value: "priority",
    label: "Priority",
  },
  {
    value: "status",
    label: "Status",
  },
  {
    value: "assigneeId",
    label: "Assignee",
  },
];

const OPERATORS = [
  {
    value: "equals",
    label: "Equals",
  },
  {
    value: "not_equals",
    label: "Does not equal",
  },
  {
    value: "is_empty",
    label: "Is empty",
  },
  {
    value: "is_not_empty",
    label: "Is not empty",
  },
];

const ACTIONS = [
  {
    value: "task.assign",
    label: "Assign the move",
  },
  {
    value: "task.set_priority",
    label: "Set priority",
  },
  {
    value: "task.set_status",
    label: "Set status",
  },
  {
    value: "notification.project",
    label: "Send project notification",
  },
];

const PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
];

const STATUSES = [
  "todo",
  "in_progress",
  "blocked",
  "completed",
];

function getRuleId(rule) {
  return String(rule?._id || rule?.id || "");
}

function getMemberId(member) {
  const source =
    member?.userId ||
    member?.user ||
    member?.member ||
    member;

  return String(
    source?._id ||
      source?.id ||
      member?.memberId ||
      member?._id ||
      member?.id ||
      ""
  ).trim();
}

function getMemberName(member) {
  const source =
    member?.userId ||
    member?.user ||
    member?.member ||
    member;

  return String(
    source?.name ||
      source?.displayName ||
      source?.username ||
      source?.email ||
      member?.name ||
      member?.email ||
      "Project member"
  ).trim();
}

function getMemberOptions(project) {
  const candidates = [
    ...(Array.isArray(project?.members)
      ? project.members
      : []),
    project?.owner
      ? {
          user: project.owner,
          role: "owner",
        }
      : null,
  ].filter(Boolean);

  const seen = new Set();

  return candidates
    .map((member) => ({
      id: getMemberId(member),
      name: getMemberName(member),
      role: String(member?.role || "").toLowerCase(),
    }))
    .filter((member) => {
      if (!member.id || seen.has(member.id)) {
        return false;
      }

      seen.add(member.id);
      return true;
    });
}

function defaultCondition(memberOptions) {
  return {
    field: "priority",
    operator: "equals",
    value: "medium",
    memberFallback:
      memberOptions[0]?.id || "",
  };
}

function defaultAction(memberOptions) {
  return {
    type: "task.set_priority",
    value: "high",
    message: "",
    memberFallback:
      memberOptions[0]?.id || "",
  };
}

function createInitialForm(rule, memberOptions) {
  if (!rule) {
    return {
      name: "",
      description: "",
      triggerType: "task.created",
      conditions: [],
      actions: [defaultAction(memberOptions)],
      enabled: true,
    };
  }

  return {
    name: String(rule.name || ""),
    description: String(rule.description || ""),
    triggerType:
      rule.triggerType || "task.created",
    conditions: Array.isArray(rule.conditions)
      ? rule.conditions.map((condition) => ({
          field: condition?.field || "priority",
          operator:
            condition?.operator || "equals",
          value: String(condition?.value || ""),
        }))
      : [],
    actions:
      Array.isArray(rule.actions) &&
      rule.actions.length > 0
        ? rule.actions.map((action) => ({
            type:
              action?.type ||
              "task.set_priority",
            value: String(action?.value || ""),
            message: String(
              action?.message || ""
            ),
          }))
        : [defaultAction(memberOptions)],
    enabled: rule.enabled !== false,
  };
}

function conditionNeedsValue(operator) {
  return ![
    "is_empty",
    "is_not_empty",
  ].includes(operator);
}

function actionDefaultValue(type, memberOptions) {
  if (type === "task.assign") {
    return memberOptions[0]?.id || "";
  }

  if (type === "task.set_priority") {
    return "high";
  }

  if (type === "task.set_status") {
    return "todo";
  }

  return "";
}

function fieldDefaultValue(field, memberOptions) {
  if (field === "priority") {
    return "medium";
  }

  if (field === "status") {
    return "todo";
  }

  return memberOptions[0]?.id || "";
}

function SelectField({
  label,
  value,
  onChange,
  children,
  disabled = false,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#111827] dark:text-white"
      >
        {children}
      </select>
    </label>
  );
}

function MemberValueField({
  value,
  onChange,
  memberOptions,
}) {
  const knownValue = memberOptions.some(
    (member) => member.id === value
  );

  if (memberOptions.length === 0) {
    return (
      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="User ID"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#111827] dark:text-white"
      />
    );
  }

  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#111827] dark:text-white"
    >
      <option value="">Choose a member</option>

      {!knownValue && value ? (
        <option value={value}>
          Current member ({value})
        </option>
      ) : null}

      {memberOptions.map((member) => (
        <option
          key={member.id}
          value={member.id}
        >
          {member.name}
          {member.role
            ? ` · ${member.role}`
            : ""}
        </option>
      ))}
    </select>
  );
}

export default function FlowRuleEditor({
  open,
  rule,
  project,
  saving,
  onClose,
  onSave,
}) {
  const memberOptions = useMemo(
    () => getMemberOptions(project),
    [project]
  );

  const [form, setForm] = useState(() =>
    createInitialForm(rule, memberOptions)
  );
  const [validationError, setValidationError] =
    useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      createInitialForm(rule, memberOptions)
    );
    setValidationError("");
  }, [open, rule, memberOptions]);

  if (!open) {
    return null;
  }

  const editing = Boolean(getRuleId(rule));

  const updateCondition = (index, patch) => {
    setForm((current) => ({
      ...current,
      conditions: current.conditions.map(
        (condition, conditionIndex) =>
          conditionIndex === index
            ? {
                ...condition,
                ...patch,
              }
            : condition
      ),
    }));
  };

  const updateAction = (index, patch) => {
    setForm((current) => ({
      ...current,
      actions: current.actions.map(
        (action, actionIndex) =>
          actionIndex === index
            ? {
                ...action,
                ...patch,
              }
            : action
      ),
    }));
  };

  const addCondition = () => {
    setForm((current) => {
      if (current.conditions.length >= 10) {
        return current;
      }

      return {
        ...current,
        conditions: [
          ...current.conditions,
          defaultCondition(memberOptions),
        ],
      };
    });
  };

  const removeCondition = (index) => {
    setForm((current) => ({
      ...current,
      conditions: current.conditions.filter(
        (_, conditionIndex) =>
          conditionIndex !== index
      ),
    }));
  };

  const addAction = () => {
    setForm((current) => {
      if (current.actions.length >= 10) {
        return current;
      }

      return {
        ...current,
        actions: [
          ...current.actions,
          defaultAction(memberOptions),
        ],
      };
    });
  };

  const removeAction = (index) => {
    setForm((current) => ({
      ...current,
      actions: current.actions.filter(
        (_, actionIndex) =>
          actionIndex !== index
      ),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setValidationError("");

    const name = form.name.trim();

    if (!name) {
      setValidationError(
        "Give this rule a name."
      );
      return;
    }

    if (form.actions.length === 0) {
      setValidationError(
        "Add at least one action."
      );
      return;
    }

    const conditions = form.conditions.map(
      (condition) => {
        const base = {
          field: condition.field,
          operator: condition.operator,
        };

        if (
          conditionNeedsValue(
            condition.operator
          )
        ) {
          return {
            ...base,
            value: String(
              condition.value || ""
            ).trim(),
          };
        }

        return base;
      }
    );

    const missingConditionValue =
      conditions.some(
        (condition) =>
          conditionNeedsValue(
            condition.operator
          ) && !condition.value
      );

    if (missingConditionValue) {
      setValidationError(
        "Complete every condition value."
      );
      return;
    }

    const actions = form.actions.map(
      (action) => {
        if (
          action.type ===
          "notification.project"
        ) {
          return {
            type: action.type,
            message: String(
              action.message || ""
            ).trim(),
          };
        }

        return {
          type: action.type,
          value: String(
            action.value || ""
          ).trim(),
        };
      }
    );

    const invalidAction = actions.some(
      (action) =>
        action.type ===
        "notification.project"
          ? !action.message
          : !action.value
    );

    if (invalidAction) {
      setValidationError(
        "Complete every action value."
      );
      return;
    }

    await onSave({
      name,
      description: form.description.trim(),
      triggerType: form.triggerType,
      conditions,
      actions,
      enabled: Boolean(form.enabled),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="flow-rule-editor-title"
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-50 shadow-2xl dark:bg-[#090f1c]">
        <form onSubmit={submit}>
          <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/95 px-5 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-[#090f1c]/95 sm:px-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                Flow Rules
              </p>

              <h3
                id="flow-rule-editor-title"
                className="mt-1 text-2xl font-black text-slate-950 dark:text-white"
              >
                {editing
                  ? "Edit rule"
                  : "Create rule"}
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                When the trigger happens and all
                conditions match, OpenShare runs
                every action below.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close rule editor"
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="space-y-7 px-5 py-6 sm:px-7">
            <section className="grid gap-5 md:grid-cols-[1fr_220px]">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                  Rule name
                </span>

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  maxLength={120}
                  placeholder="Keep urgent moves visible"
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#111827] dark:text-white"
                />
              </label>

              <SelectField
                label="Trigger"
                value={form.triggerType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    triggerType:
                      event.target.value,
                  }))
                }
              >
                {TRIGGERS.map((trigger) => (
                  <option
                    key={trigger.value}
                    value={trigger.value}
                  >
                    {trigger.label}
                  </option>
                ))}
              </SelectField>
            </section>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                Description
              </span>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description:
                      event.target.value,
                  }))
                }
                maxLength={500}
                rows={2}
                placeholder="Explain what this rule protects or automates."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#111827] dark:text-white"
              />
            </label>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-slate-950 dark:text-white">
                    Conditions
                  </h4>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Every condition must match.
                    Conditions are optional.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addCondition}
                  disabled={
                    form.conditions.length >= 10
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-bold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300"
                >
                  <Plus className="h-4 w-4" />
                  Condition
                </button>
              </div>

              {form.conditions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
                  No conditions. This rule runs
                  whenever its trigger occurs.
                </div>
              ) : (
                <div className="space-y-3">
                  {form.conditions.map(
                    (condition, index) => (
                      <div
                        key={`condition-${index}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]"
                      >
                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.25fr_auto] md:items-end">
                          <SelectField
                            label="Field"
                            value={condition.field}
                            onChange={(event) => {
                              const field =
                                event.target.value;

                              updateCondition(
                                index,
                                {
                                  field,
                                  value:
                                    fieldDefaultValue(
                                      field,
                                      memberOptions
                                    ),
                                }
                              );
                            }}
                          >
                            {CONDITION_FIELDS.map(
                              (field) => (
                                <option
                                  key={field.value}
                                  value={field.value}
                                >
                                  {field.label}
                                </option>
                              )
                            )}
                          </SelectField>

                          <SelectField
                            label="Operator"
                            value={
                              condition.operator
                            }
                            onChange={(event) => {
                              const operator =
                                event.target.value;

                              updateCondition(
                                index,
                                {
                                  operator,
                                  value:
                                    conditionNeedsValue(
                                      operator
                                    )
                                      ? condition.value ||
                                        fieldDefaultValue(
                                          condition.field,
                                          memberOptions
                                        )
                                      : "",
                                }
                              );
                            }}
                          >
                            {OPERATORS.map(
                              (operator) => (
                                <option
                                  key={
                                    operator.value
                                  }
                                  value={
                                    operator.value
                                  }
                                >
                                  {operator.label}
                                </option>
                              )
                            )}
                          </SelectField>

                          <label className="block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                              Value
                            </span>

                            {!conditionNeedsValue(
                              condition.operator
                            ) ? (
                              <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2.5 text-sm text-slate-400 dark:border-white/10">
                                No value needed
                              </div>
                            ) : condition.field ===
                              "priority" ? (
                              <select
                                value={
                                  condition.value
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateCondition(
                                    index,
                                    {
                                      value:
                                        event.target
                                          .value,
                                    }
                                  )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#111827] dark:text-white"
                              >
                                {PRIORITIES.map(
                                  (priority) => (
                                    <option
                                      key={
                                        priority
                                      }
                                      value={
                                        priority
                                      }
                                    >
                                      {priority}
                                    </option>
                                  )
                                )}
                              </select>
                            ) : condition.field ===
                              "assigneeId" ? (
                              <MemberValueField
                                value={
                                  condition.value
                                }
                                onChange={(value) =>
                                  updateCondition(
                                    index,
                                    { value }
                                  )
                                }
                                memberOptions={
                                  memberOptions
                                }
                              />
                            ) : (
                              <>
                                <input
                                  list={`flow-rule-condition-statuses-${index}`}
                                  value={
                                    condition.value
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateCondition(
                                      index,
                                      {
                                        value:
                                          event.target
                                            .value,
                                      }
                                    )
                                  }
                                  placeholder="Status value"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#111827] dark:text-white"
                                />

                                <datalist
                                  id={`flow-rule-condition-statuses-${index}`}
                                >
                                  {STATUSES.map(
                                    (status) => (
                                      <option
                                        key={
                                          status
                                        }
                                        value={
                                          status
                                        }
                                      />
                                    )
                                  )}
                                </datalist>
                              </>
                            )}
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              removeCondition(
                                index
                              )
                            }
                            aria-label={`Remove condition ${
                              index + 1
                            }`}
                            className="rounded-xl border border-rose-200 p-2.5 text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-slate-950 dark:text-white">
                    Actions
                  </h4>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Actions run in the order shown.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addAction}
                  disabled={
                    form.actions.length >= 10
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-700 transition hover:bg-cyan-100 disabled:opacity-50 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300"
                >
                  <Plus className="h-4 w-4" />
                  Action
                </button>
              </div>

              <div className="space-y-3">
                {form.actions.map(
                  (action, index) => (
                    <div
                      key={`action-${index}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]"
                    >
                      <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
                        <SelectField
                          label={`Action ${
                            index + 1
                          }`}
                          value={action.type}
                          onChange={(event) => {
                            const type =
                              event.target.value;

                            updateAction(index, {
                              type,
                              value:
                                actionDefaultValue(
                                  type,
                                  memberOptions
                                ),
                              message: "",
                            });
                          }}
                        >
                          {ACTIONS.map(
                            (option) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {option.label}
                              </option>
                            )
                          )}
                        </SelectField>

                        <label className="block">
                          <span className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                            {action.type ===
                            "notification.project"
                              ? "Message"
                              : "Value"}
                          </span>

                          {action.type ===
                          "notification.project" ? (
                            <input
                              value={
                                action.message
                              }
                              onChange={(event) =>
                                updateAction(
                                  index,
                                  {
                                    message:
                                      event.target
                                        .value,
                                  }
                                )
                              }
                              maxLength={500}
                              placeholder="Project notification message"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#111827] dark:text-white"
                            />
                          ) : action.type ===
                            "task.assign" ? (
                            <MemberValueField
                              value={
                                action.value
                              }
                              onChange={(value) =>
                                updateAction(
                                  index,
                                  { value }
                                )
                              }
                              memberOptions={
                                memberOptions
                              }
                            />
                          ) : action.type ===
                            "task.set_priority" ? (
                            <select
                              value={
                                action.value
                              }
                              onChange={(event) =>
                                updateAction(
                                  index,
                                  {
                                    value:
                                      event.target
                                        .value,
                                  }
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#111827] dark:text-white"
                            >
                              {PRIORITIES.map(
                                (priority) => (
                                  <option
                                    key={priority}
                                    value={
                                      priority
                                    }
                                  >
                                    {priority}
                                  </option>
                                )
                              )}
                            </select>
                          ) : (
                            <>
                              <input
                                list={`flow-rule-action-statuses-${index}`}
                                value={
                                  action.value
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateAction(
                                    index,
                                    {
                                      value:
                                        event.target
                                          .value,
                                    }
                                  )
                                }
                                placeholder="Status value"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#111827] dark:text-white"
                              />

                              <datalist
                                id={`flow-rule-action-statuses-${index}`}
                              >
                                {STATUSES.map(
                                  (status) => (
                                    <option
                                      key={
                                        status
                                      }
                                      value={
                                        status
                                      }
                                    />
                                  )
                                )}
                              </datalist>
                            </>
                          )}
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            removeAction(index)
                          }
                          disabled={
                            form.actions.length ===
                            1
                          }
                          aria-label={`Remove action ${
                            index + 1
                          }`}
                          className="rounded-xl border border-rose-200 p-2.5 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div>
                <p className="font-black text-slate-950 dark:text-white">
                  Enable immediately
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Disabled rules remain saved but
                  do not run.
                </p>
              </div>

              <span className="relative inline-flex h-7 w-12 shrink-0">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      enabled:
                        event.target.checked,
                    }))
                  }
                  className="peer sr-only"
                />

                <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-violet-600 dark:bg-slate-700" />
                <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </span>
            </label>

            {validationError ? (
              <div
                role="alert"
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
              >
                {validationError}
              </div>
            ) : null}
          </div>

          <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/95 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#090f1c]/95 sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-5 py-2.5 font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 font-black text-white shadow-lg shadow-violet-500/20 transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving
                ? "Saving..."
                : editing
                  ? "Save rule"
                  : "Create rule"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
