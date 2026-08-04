import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
} from "lucide-react";
import {
  useParams,
} from "react-router-dom";

import {
  getIntakeApiError,
  getPublicIntakeForm,
  submitPublicIntakeForm,
} from "../features/intake-forms/intakeFormsApi";

function initialValue(field) {
  if (field.type === "checkbox") {
    return false;
  }

  return "";
}

function makeInitialAnswers(fields) {
  return Object.fromEntries(
    fields.map((field) => [
      field.id,
      initialValue(field),
    ])
  );
}

export default function PublicIntakeForm() {
  const { slug } = useParams();

  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getPublicIntakeForm(slug);

        if (cancelled) return;

        setForm(data);
        setAnswers(
          makeInitialAnswers(data?.fields || [])
        );
      } catch (loadError) {
        if (cancelled) return;

        setError(
          loadError?.response?.status === 404
            ? "This form is unavailable or no longer accepting responses."
            : getIntakeApiError(
                loadError,
                "This form could not be loaded."
              )
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const fields = useMemo(
    () =>
      Array.isArray(form?.fields)
        ? form.fields
        : [],
    [form]
  );

  function updateAnswer(fieldId, value) {
    setAnswers((current) => ({
      ...current,
      [fieldId]: value,
    }));
  }

  function validate() {
    for (const field of fields) {
      const value = answers[field.id];

      if (!field.required) continue;

      if (
        field.type === "checkbox" &&
        value !== true
      ) {
        return `"${field.label}" must be checked.`;
      }

      if (
        field.type !== "checkbox" &&
        (value === null ||
          value === undefined ||
          String(value).trim() === "")
      ) {
        return `"${field.label}" is required.`;
      }
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = fields
      .filter((field) => {
        const value = answers[field.id];

        if (field.type === "checkbox") {
          return (
            field.required ||
            value === true
          );
        }

        return (
          field.required ||
          String(value ?? "").trim() !== ""
        );
      })
      .map((field) => {
        let value = answers[field.id];

        if (field.type === "number") {
          value = Number(value);
        }

        if (field.type === "checkbox") {
          value = Boolean(value);
        }

        return {
          fieldId: field.id,
          value,
        };
      });

    setSubmitting(true);

    try {
      const result =
        await submitPublicIntakeForm(
          slug,
          payload
        );

      setSuccessMessage(
        result?.successMessage ||
          form?.successMessage ||
          "Thanks — your request has been submitted."
      );
    } catch (submitError) {
      setError(
        getIntakeApiError(
          submitError,
          "Your response could not be submitted."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-slate-950">
        <div className="mx-auto flex max-w-2xl items-center justify-center rounded-3xl border border-slate-200 bg-white px-8 py-20 text-slate-500 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Loader2 className="mr-3 h-6 w-6 animate-spin" />
          Loading form…
        </div>
      </main>
    );
  }

  if (error && !form) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-slate-950">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white px-8 py-16 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />

          <h1 className="mt-5 text-2xl font-black text-slate-900 dark:text-white">
            Form unavailable
          </h1>

          <p className="mt-3 text-slate-600 dark:text-slate-300">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (successMessage) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 px-4 py-16 dark:from-slate-950 dark:via-slate-950 dark:to-cyan-950">
        <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white px-8 py-16 text-center shadow-2xl dark:border-emerald-500/30 dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <h1 className="mt-6 text-3xl font-black text-slate-900 dark:text-white">
            Response received
          </h1>

          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            {successMessage}
          </p>

          <p className="mt-8 text-sm font-bold text-slate-400">
            Powered by OpenShare
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 px-4 py-10 dark:from-slate-950 dark:via-slate-950 dark:to-cyan-950 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
          <ClipboardList className="h-5 w-5" />
          OpenShare Intake
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <header className="border-b border-slate-200 bg-gradient-to-r from-violet-50 to-cyan-50 px-6 py-8 dark:border-slate-800 dark:from-violet-500/10 dark:to-cyan-500/10 sm:px-9">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {form?.name}
            </h1>

            {form?.description && (
              <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
                {form.description}
              </p>
            )}
          </header>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 px-6 py-8 sm:px-9"
          >
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </div>
            )}

            {fields.map((field) => (
              <div key={field.id}>
                {field.type === "checkbox" ? (
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    <input
                      type="checkbox"
                      checked={
                        answers[field.id] === true
                      }
                      onChange={(event) =>
                        updateAnswer(
                          field.id,
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />

                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-rose-500">
                          *
                        </span>
                      )}
                    </span>
                  </label>
                ) : (
                  <label className="block">
                    <span className="mb-2 block font-bold text-slate-800 dark:text-slate-100">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-rose-500">
                          *
                        </span>
                      )}
                    </span>

                    {field.type === "long_text" ? (
                      <textarea
                        value={
                          answers[field.id] ?? ""
                        }
                        onChange={(event) =>
                          updateAnswer(
                            field.id,
                            event.target.value
                          )
                        }
                        required={field.required}
                        placeholder={
                          field.placeholder || ""
                        }
                        rows={6}
                        maxLength={5000}
                        className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                      />
                    ) : field.type ===
                      "dropdown" ? (
                      <select
                        value={
                          answers[field.id] ?? ""
                        }
                        onChange={(event) =>
                          updateAnswer(
                            field.id,
                            event.target.value
                          )
                        }
                        required={field.required}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                      >
                        <option value="">
                          Select an option
                        </option>

                        {(field.options || []).map(
                          (option) => (
                            <option
                              key={option}
                              value={option}
                            >
                              {option}
                            </option>
                          )
                        )}
                      </select>
                    ) : (
                      <input
                        type={
                          field.type === "email"
                            ? "email"
                            : field.type === "number"
                              ? "number"
                              : field.type === "date"
                                ? "date"
                                : "text"
                        }
                        value={
                          answers[field.id] ?? ""
                        }
                        onChange={(event) =>
                          updateAnswer(
                            field.id,
                            event.target.value
                          )
                        }
                        required={field.required}
                        placeholder={
                          field.placeholder || ""
                        }
                        maxLength={
                          field.type ===
                          "short_text"
                            ? 500
                            : undefined
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                      />
                    )}
                  </label>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 font-black text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}

              {submitting
                ? "Submitting…"
                : "Submit response"}
            </button>

            <p className="text-center text-xs font-bold text-slate-400">
              Powered by OpenShare
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
