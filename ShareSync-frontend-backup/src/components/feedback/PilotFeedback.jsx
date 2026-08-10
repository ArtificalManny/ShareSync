import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquarePlus,
  Send,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';

import { submitFeedback } from '../../api/feedback';

// pilot-feedback-ui-v1

const APP_VERSION =
  import.meta.env.VITE_APP_VERSION ||
  '0.0.0';

function getBuildId() {
  try {
    if (
      typeof __AUTH_TIMESTAMP__ !==
      'undefined'
    ) {
      return String(__AUTH_TIMESTAMP__);
    }
  } catch {
    // Build identifier unavailable.
  }

  return (
    import.meta.env.VITE_BUILD_ID ||
    import.meta.env.MODE ||
    'unknown'
  );
}

function getPlatform() {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  return (
    navigator.userAgentData?.platform ||
    navigator.platform ||
    'unknown'
  );
}

function makePayload(
  type,
  description,
  recentErrors,
) {
  const hasWindow =
    typeof window !== 'undefined';

  const hasNavigator =
    typeof navigator !== 'undefined';

  return {
    type,

    content:
      String(description || '').trim(),

    // Deliberately pathname-only.
    // Never include query strings or hashes.
    route: hasWindow
      ? window.location.pathname
      : '',

    appVersion: APP_VERSION,
    buildId: getBuildId(),
    platform: getPlatform(),

    userAgent: hasNavigator
      ? navigator.userAgent
      : '',

    viewportWidth: hasWindow
      ? window.innerWidth
      : undefined,

    viewportHeight: hasWindow
      ? window.innerHeight
      : undefined,

    online: hasNavigator
      ? navigator.onLine
      : undefined,

    clientTimestamp:
      new Date().toISOString(),

    recentErrors:
      Array.isArray(recentErrors)
        ? recentErrors
            .slice(-3)
            .map((value) =>
              String(value || '')
                .trim()
                .slice(0, 1000),
            )
            .filter(Boolean)
        : [],
  };
}

export default function PilotFeedback({
  variant = 'floating',
  recentErrors = [],
}) {
  const [open, setOpen] =
    useState(false);

  const [type, setType] =
    useState('feedback');

  const [description, setDescription] =
    useState('');

  const [status, setStatus] =
    useState('idle');

  const [error, setError] =
    useState('');

  const textareaRef = useRef(null);

  const preview = useMemo(
    () => ({
      route:
        typeof window !== 'undefined'
          ? window.location.pathname
          : '/',

      platform: getPlatform(),
    }),
    [open],
  );

  const openFeedback = () => {
    setType('feedback');
    setDescription('');
    setStatus('idle');
    setError('');
    setOpen(true);
  };

  const closeFeedback = () => {
    if (status !== 'submitting') {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    const handleKeyDown = (event) => {
      if (
        event.key === 'Escape' &&
        status !== 'submitting'
      ) {
        setOpen(false);
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    const timer = window.setTimeout(
      () => textareaRef.current?.focus(),
      80,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );

      window.clearTimeout(timer);
    };
  }, [open, status]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (status === 'submitting') {
      return;
    }

    setStatus('submitting');
    setError('');

    try {
      await submitFeedback(
        makePayload(
          type,
          description,
          recentErrors,
        ),
      );

      setStatus('success');
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Feedback could not be sent. Please try again.';

      setError(
        Array.isArray(message)
          ? message.join(' ')
          : String(message),
      );

      setStatus('error');
    }
  };

  const trigger =
    variant === 'settings' ? (
      <button
        type="button"
        onClick={openFeedback}
        data-pilot-feedback-settings-trigger="true"
        className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-violet-200/80 bg-gradient-to-r from-violet-50/90 via-white to-cyan-50/80 px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-violet-400/15 dark:from-violet-500/10 dark:via-white/[0.04] dark:to-cyan-500/10"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/20">
            <MessageSquarePlus
              className="h-5 w-5"
              aria-hidden="true"
            />
          </span>

          <span className="min-w-0">
            <span className="block text-sm font-black text-slate-900 dark:text-white">
              Send feedback
            </span>

            <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
              Share an idea or report a problem. Technical context is attached automatically.
            </span>
          </span>
        </span>

        <span className="shrink-0 text-xs font-black text-violet-600 dark:text-violet-300">
          Open
        </span>
      </button>
    ) : (
      <button
        type="button"
        onClick={openFeedback}
        aria-label="Send feedback"
        title="Send feedback"
        data-pilot-feedback-floating-trigger="true"
        className="fixed bottom-24 right-4 z-[80] inline-flex h-11 items-center gap-2 rounded-full border border-violet-200/70 bg-white/95 px-3.5 text-xs font-black text-violet-700 shadow-xl shadow-violet-500/15 backdrop-blur-xl transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:bottom-6 sm:right-6 dark:border-white/[0.10] dark:bg-[#17131f]/95 dark:text-violet-200"
      >
        <MessageSquarePlus
          className="h-4 w-4"
          aria-hidden="true"
        />

        <span className="hidden sm:inline">
          Feedback
        </span>
      </button>
    );

  const modal =
    open &&
    typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/55 backdrop-blur-sm sm:items-center sm:p-5"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeFeedback();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="pilot-feedback-title"
              className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border border-white/10 bg-white shadow-2xl sm:max-w-xl sm:rounded-[28px] dark:bg-[#111116]"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-5 dark:border-white/[0.08]">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 dark:text-violet-300">
                    Early access
                  </div>

                  <h2
                    id="pilot-feedback-title"
                    className="mt-1 text-xl font-black text-slate-950 dark:text-white"
                  >
                    Send feedback
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                    Tell us what worked, felt confusing, or broke.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeFeedback}
                  disabled={
                    status === 'submitting'
                  }
                  aria-label="Close feedback"
                  className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-white/[0.08]"
                >
                  <X
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </button>
              </div>

              {status === 'success' ? (
                <div className="px-5 py-10 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />

                  <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
                    Feedback sent
                  </h3>

                  <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
                    Technical context was attached automatically.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setOpen(false)
                    }
                    className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5 px-5 py-5"
                >
                  <fieldset>
                    <legend className="text-sm font-black text-slate-800 dark:text-zinc-100">
                      What would you like to share?
                    </legend>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setType('feedback')
                        }
                        aria-pressed={
                          type === 'feedback'
                        }
                        className={`rounded-xl border px-3 py-3 text-sm font-black ${
                          type === 'feedback'
                            ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200'
                            : 'border-slate-200 text-slate-600 dark:border-white/[0.10] dark:text-zinc-300'
                        }`}
                      >
                        Feedback
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setType('bug')
                        }
                        aria-pressed={
                          type === 'bug'
                        }
                        className={`rounded-xl border px-3 py-3 text-sm font-black ${
                          type === 'bug'
                            ? 'border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200'
                            : 'border-slate-200 text-slate-600 dark:border-white/[0.10] dark:text-zinc-300'
                        }`}
                      >
                        Report a problem
                      </button>
                    </div>
                  </fieldset>

                  <label className="block">
                    <span className="text-sm font-black text-slate-800 dark:text-zinc-100">
                      Tell us more
                      <span className="ml-1 font-semibold text-slate-400">
                        optional
                      </span>
                    </span>

                    <textarea
                      ref={textareaRef}
                      value={description}
                      onChange={(event) =>
                        setDescription(
                          event.target.value,
                        )
                      }
                      maxLength={4000}
                      rows={5}
                      placeholder={
                        type === 'bug'
                          ? 'What happened? What were you trying to do?'
                          : 'What could be better?'
                      }
                      className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-white"
                    />

                    <span className="mt-1 block text-right text-[11px] font-semibold text-slate-400">
                      {description.length}/4000
                    </span>
                  </label>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Automatically included
                    </div>

                    <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-zinc-300">
                      <div>
                        <strong>Route:</strong>{' '}
                        {preview.route}
                      </div>

                      <div>
                        <strong>Version:</strong>{' '}
                        {APP_VERSION}
                      </div>

                      <div>
                        <strong>Build:</strong>{' '}
                        {getBuildId()}
                      </div>

                      <div>
                        <strong>Platform:</strong>{' '}
                        {preview.platform}
                      </div>
                    </div>
                  </div>

                  {error ? (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"
                    >
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />

                      {error}
                    </div>
                  ) : null}

                  <div className="flex justify-end gap-2 border-t border-slate-200/80 pt-4 dark:border-white/[0.08]">
                    <button
                      type="button"
                      onClick={closeFeedback}
                      disabled={
                        status === 'submitting'
                      }
                      className="rounded-xl px-4 py-2.5 text-sm font-black text-slate-600 disabled:opacity-50 dark:text-zinc-300"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        status === 'submitting'
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
                    >
                      <Send
                        className="h-4 w-4"
                        aria-hidden="true"
                      />

                      {status === 'submitting'
                        ? 'Sending...'
                        : 'Send feedback'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {trigger}
      {modal}
    </>
  );
}
