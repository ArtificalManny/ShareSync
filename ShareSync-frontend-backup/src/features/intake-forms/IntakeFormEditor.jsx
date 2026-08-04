import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

const FIELD_TYPES = [
  {
    value: "short_text",
    label: "Short text",
  },
  {
    value: "long_text",
    label: "Long text",
  },
  {
    value: "email",
    label: "Email",
  },
  {
    value: "number",
    label: "Number",
  },
  {
    value: "date",
    label: "Date",
  },
  {
    value: "dropdown",
    label: "Dropdown",
  },
  {
    value: "checkbox",
    label: "Checkbox",
  },
];

function makeField(type = "short_text") {
  return {
    id:
      `field_${Date.now()}_` +
      Math.random().toString(36).slice(2, 8),
    type,
    label: "",
    required: false,
    placeholder: "",
    options:
      type === "dropdown"
        ? ["Option 1", "Option 2"]
        : [],
  };
}

function createInitialDraft(form) {
  if (!form) {
    return {
      name: "",
      description: "",
      enabled: false,
      successMessage:
        "Thanks — your request has been submitted.",
      fields: [makeField()],
    };
  }

  return {
    name: form.name || "",
    description: form.description || "",
    enabled: form.enabled === true,
    successMessage:
      form.successMessage ||
      "Thanks — your request has been submitted.",
    fields:
      Array.isArray(form.fields) && form.fields.length
        ? form.fields.map((field) => ({
            id:
              String(field.id || "") ||
              makeField().id,
            type: field.type || "short_text",
            label: field.label || "",
            required: field.required === true,
            placeholder: field.placeholder || "",
            options: Array.isArray(field.options)
              ? [...field.options]
              : [],
          }))
        : [makeField()],
  };
}

function moveItem(items, from, to) {
  if (
    to < 0 ||
    to >= items.length ||
    from === to
  ) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);

  return next;
}

export default function IntakeFormEditor({
  form,
  onClose,
  onSave,
}) {
  const [draft, setDraft] = useState(() =>
    createInitialDraft(form)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(form?._id || form?.id);

  useEffect(() => {
    setDraft(createInitialDraft(form));
    setError("");
  }, [form]);

  const fieldCount = draft.fields.length;

  const canSubmit = useMemo(() => {
    return (
      draft.name.trim().length > 0 &&
      draft.fields.length > 0 &&
      draft.fields.every(
        (field) => field.label.trim().length > 0
      )
    );
  }, [draft]);

  function updateField(index, patch) {
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field, fieldIndex) =>
        fieldIndex === index
          ? { ...field, ...patch }
          : field
      ),
    }));
  }

  function changeFieldType(index, type) {
    updateField(index, {
      type,
      options:
        type === "dropdown"
          ? draft.fields[index]?.options?.length >= 2
            ? draft.fields[index].options
            : ["Option 1", "Option 2"]
          : [],
    });
  }

  function addField() {
    setDraft((current) => ({
      ...current,
      fields: [...current.fields, makeField()],
    }));
  }

  function removeField(index) {
    setDraft((current) => {
      if (current.fields.length === 1) {
        return current;
      }

      return {
        ...current,
        fields: current.fields.filter(
          (_, fieldIndex) => fieldIndex !== index
        ),
      };
    });
  }

  function reorderField(index, direction) {
    setDraft((current) => ({
      ...current,
      fields: moveItem(
        current.fields,
        index,
        index + direction
      ),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const name = draft.name.trim();

    if (!name) {
      setError("Give this form a name.");
      return;
    }

    if (!draft.fields.length) {
      setError("Add at least one field.");
      return;
    }

    for (
      let index = 0;
      index < draft.fields.length;
      index += 1
    ) {
      const field = draft.fields[index];

      if (!field.label.trim()) {
        setError(
          `Field ${index + 1} needs a label.`
        );
        return;
      }

      if (field.type === "dropdown") {
        const options = field.options
          .map((option) => String(option).trim())
          .filter(Boolean);

        if (options.length < 2) {
          setError(
            `"${field.label}" needs at least two dropdown options.`
          );
          return;
        }
      }
    }

    const payload = {
      name,
      description: draft.description.trim(),
      enabled: Boolean(draft.enabled),
      successMessage:
        draft.successMessage.trim() ||
        "Thanks — your request has been submitted.",
      fields: draft.fields.map((field) => ({
        id: String(field.id),
        type: field.type,
        label: field.label.trim(),
        required: Boolean(field.required),
        placeholder:
          field.type === "checkbox"
            ? ""
            : field.placeholder.trim(),
        options:
          field.type === "dropdown"
            ? Array.from(
                new Set(
                  field.options
                    .map((option) =>
                      String(option).trim()
                    )
                    .filter(Boolean)
                )
              )
            : [],
      })),
    };

    setSaving(true);

    try {
      await onSave(payload);
    } catch (saveError) {
      setError(
        saveError?.message ||
          "The form could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={
        isEditing
          ? "Edit intake form"
          : "Create intake form"
      }
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-violet-50 to-cyan-50 px-6 py-5 dark:border-slate-700 dark:from-violet-500/10 dark:to-cyan-500/10">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
              <ClipboardList className="h-4 w-4" />
              Forms & Intake
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {isEditing
                ? "Edit form"
                : "Create form"}
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Build a public request form that feeds
              this project&apos;s Intake inbox.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close form editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}

          <section className="grid gap-5 rounded-2xl border border-slate-200 p-5 dark:border-slate-700 lg:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Form name
              </span>

              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                maxLength={120}
                required
                placeholder="Project request form"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Successful submission message
              </span>

              <input
                value={draft.successMessage}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    successMessage:
                      event.target.value,
                  }))
                }
                maxLength={500}
                placeholder="Thanks — your request has been submitted."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Description
              </span>

              <textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                maxLength={1000}
                rows={3}
                placeholder="Tell respondents what this form is for."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 lg:col-span-2">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Public form availability
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Disabled forms retain submissions but
                  cannot accept new responses.
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      enabled: event.target.checked,
                    }))
                  }
                  className="peer sr-only"
                />

                <span className="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 dark:bg-slate-700" />

                <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </label>
            </div>
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Fields
                </h3>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {fieldCount}{" "}
                  {fieldCount === 1
                    ? "field"
                    : "fields"}
                </p>
              </div>

              <button
                type="button"
                onClick={addField}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-100 px-4 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:hover:bg-violet-500/25"
              >
                <Plus className="h-4 w-4" />
                Add field
              </button>
            </div>

            <div className="space-y-4">
              {draft.fields.map((field, index) => (
                <article
                  key={field.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/50"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Field {index + 1}
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          reorderField(index, -1)
                        }
                        disabled={index === 0}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label="Move field up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          reorderField(index, 1)
                        }
                        disabled={
                          index ===
                          draft.fields.length - 1
                        }
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label="Move field down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeField(index)
                        }
                        disabled={
                          draft.fields.length === 1
                        }
                        className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 disabled:opacity-30 dark:hover:bg-rose-500/10"
                        aria-label="Delete field"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Field type
                      </span>

                      <select
                        value={field.type}
                        onChange={(event) =>
                          changeFieldType(
                            index,
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      >
                        {FIELD_TYPES.map((type) => (
                          <option
                            key={type.value}
                            value={type.value}
                          >
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Label
                      </span>

                      <input
                        value={field.label}
                        onChange={(event) =>
                          updateField(index, {
                            label: event.target.value,
                          })
                        }
                        maxLength={200}
                        required
                        placeholder="What do you need?"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      />
                    </label>

                    {field.type !== "checkbox" && (
                      <label className="block lg:col-span-2">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Placeholder
                        </span>

                        <input
                          value={field.placeholder}
                          onChange={(event) =>
                            updateField(index, {
                              placeholder:
                                event.target.value,
                            })
                          }
                          maxLength={300}
                          placeholder="Optional guidance for the respondent"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                      </label>
                    )}

                    {field.type === "dropdown" && (
                      <label className="block lg:col-span-2">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Options — one per line
                        </span>

                        <textarea
                          value={field.options.join("\n")}
                          onChange={(event) =>
                            updateField(index, {
                              options:
                                event.target.value.split(
                                  "\n"
                                ),
                            })
                          }
                          rows={4}
                          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                      </label>
                    )}

                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(event) =>
                          updateField(index, {
                            required:
                              event.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />

                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        Required response
                      </span>
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              {saving
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Create form"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
