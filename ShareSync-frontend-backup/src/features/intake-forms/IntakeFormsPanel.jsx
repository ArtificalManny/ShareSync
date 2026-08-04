import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ClipboardList,
  Copy,
  ExternalLink,
  Inbox,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import {
  createIntakeForm,
  deleteIntakeForm,
  getIntakeApiError,
  listIntakeForms,
  setIntakeFormEnabled,
  updateIntakeForm,
} from "./intakeFormsApi";
import IntakeFormEditor from "./IntakeFormEditor";
import IntakeSubmissions from "./IntakeSubmissions";
import {
  toast,
} from "../../components/ui/toast";

function getId(value) {
  return String(value?._id || value?.id || "");
}

function getPublicUrl(slug) {
  if (!slug) return "";

  return `${window.location.origin}/p/forms/${slug}`;
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export default function IntakeFormsPanel({
  projectId,
  canManage,
}) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [editingForm, setEditingForm] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [inboxForm, setInboxForm] = useState(null);
  const [error, setError] = useState("");

  const enabledCount = useMemo(
    () =>
      forms.filter((form) => form.enabled === true)
        .length,
    [forms]
  );

  const load = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError("");

    try {
      const data = await listIntakeForms(projectId);
      setForms(data);
    } catch (loadError) {
      const message = getIntakeApiError(
        loadError,
        "Forms could not be loaded."
      );

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingForm(null);
    setEditorOpen(true);
  }

  function openEdit(form) {
    setEditingForm(form);
    setEditorOpen(true);
  }

  async function saveForm(payload) {
    try {
      if (editingForm) {
        await updateIntakeForm(
          projectId,
          getId(editingForm),
          payload
        );

        toast.success("Intake form updated");
      } else {
        await createIntakeForm(
          projectId,
          payload
        );

        toast.success("Intake form created");
      }

      setEditorOpen(false);
      setEditingForm(null);
      await load();
    } catch (saveError) {
      const message = getIntakeApiError(
        saveError,
        "The form could not be saved."
      );

      toast.error(message);
      throw new Error(message);
    }
  }

  async function toggleForm(form) {
    const formId = getId(form);
    setBusyId(formId);

    try {
      const updated =
        await setIntakeFormEnabled(
          projectId,
          formId,
          !form.enabled
        );

      setForms((current) =>
        current.map((item) =>
          getId(item) === formId
            ? updated
            : item
        )
      );

      toast.success(
        updated.enabled
          ? "Intake form enabled"
          : "Intake form paused"
      );
    } catch (toggleError) {
      toast.error(
        getIntakeApiError(
          toggleError,
          "The form could not be updated."
        )
      );
    } finally {
      setBusyId("");
    }
  }

  async function removeForm(form) {
    const confirmed = window.confirm(
      `Delete "${form.name}" and all of its submissions? This cannot be undone.`
    );

    if (!confirmed) return;

    const formId = getId(form);
    setBusyId(formId);

    try {
      await deleteIntakeForm(
        projectId,
        formId
      );

      setForms((current) =>
        current.filter(
          (item) => getId(item) !== formId
        )
      );

      toast.success("Intake form deleted");
    } catch (deleteError) {
      toast.error(
        getIntakeApiError(
          deleteError,
          "The form could not be deleted."
        )
      );
    } finally {
      setBusyId("");
    }
  }

  async function copyLink(form) {
    const url = getPublicUrl(form.slug);

    try {
      await copyText(url);
      toast.success("Public form link copied");
    } catch {
      toast.error(
        "The public form link could not be copied."
      );
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-6 py-5 dark:border-slate-700 dark:from-violet-500/10 dark:via-slate-900 dark:to-cyan-500/10">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-500/15 dark:text-violet-200">
              <ClipboardList className="h-6 w-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Forms & Intake
                </h2>

                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {enabledCount} active
                </span>
              </div>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Collect public requests, review them
                inside the project, and convert approved
                submissions into Moves.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Refresh forms"
            >
              <RefreshCw
                className={`h-5 w-5 ${
                  loading ? "animate-spin" : ""
                }`}
              />
            </button>

            {canManage && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500"
              >
                <Plus className="h-4 w-4" />
                New form
              </button>
            )}
          </div>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading forms…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : forms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-700">
              <ClipboardList className="mx-auto h-10 w-10 text-violet-500" />

              <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
                No intake forms yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Create a public form for requests,
                applications, feedback, or project ideas.
              </p>

              {canManage && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-bold text-white transition hover:bg-violet-500"
                >
                  <Plus className="h-5 w-5" />
                  Create first form
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {forms.map((form) => {
                const formId = getId(form);
                const publicUrl =
                  getPublicUrl(form.slug);

                return (
                  <article
                    key={formId}
                    className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-black text-slate-900 dark:text-white">
                            {form.name}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide ${
                              form.enabled
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {form.enabled
                              ? "Active"
                              : "Paused"}
                          </span>
                        </div>

                        {form.description && (
                          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {form.description}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
                            {form.fields?.length || 0} fields
                          </span>

                          <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200">
                            {form.submissionCount || 0} submissions
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setInboxForm(form)
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Inbox className="h-4 w-4" />
                          Inbox
                        </button>

                        <button
                          type="button"
                          onClick={() => copyLink(form)}
                          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          aria-label="Copy public form link"
                        >
                          <Copy className="h-4 w-4" />
                        </button>

                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          aria-label="Open public form"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>

                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(form)
                              }
                              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                              aria-label="Edit form"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeForm(form)
                              }
                              disabled={
                                busyId === formId
                              }
                              className="rounded-xl bg-rose-50 p-2.5 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                              aria-label="Delete form"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                            <label className="relative inline-flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                checked={
                                  form.enabled === true
                                }
                                disabled={
                                  busyId === formId
                                }
                                onChange={() =>
                                  toggleForm(form)
                                }
                                className="peer sr-only"
                              />

                              <span className="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 peer-disabled:opacity-50 dark:bg-slate-700" />

                              <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {editorOpen && (
        <IntakeFormEditor
          form={editingForm}
          onClose={() => {
            setEditorOpen(false);
            setEditingForm(null);
          }}
          onSave={saveForm}
        />
      )}

      {inboxForm && (
        <IntakeSubmissions
          projectId={projectId}
          form={inboxForm}
          canManage={canManage}
          onClose={() => setInboxForm(null)}
        />
      )}
    </>
  );
}
