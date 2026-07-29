import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bell,
  Loader2,
} from "lucide-react";

import {
  fetchTaskWatchSettings,
  updateTaskWatchSettings,
} from "../../api/taskApi";

const DEFAULT_PREFERENCES = Object.freeze({
  comments: true,
  statusChanges: true,
  assignmentChanges: true,
  dueDateChanges: true,
  completion: true,
});

const PREFERENCE_OPTIONS = [
  {
    key: "comments",
    label: "Comments",
    description: "New discussion on this Move",
  },
  {
    key: "statusChanges",
    label: "Status changes",
    description: "Movement between workflow stages",
  },
  {
    key: "assignmentChanges",
    label: "Assignment changes",
    description: "Someone is assigned or unassigned",
  },
  {
    key: "dueDateChanges",
    label: "Due-date changes",
    description: "The deadline is added, changed, or removed",
  },
  {
    key: "completion",
    label: "Completion",
    description: "This Move is marked complete",
  },
];

function normalizeSettings(settings) {
  return {
    following: Boolean(settings?.following),
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...(settings?.preferences || {}),
    },
    watcherCount: Math.max(
      0,
      Number(settings?.watcherCount || 0)
    ),
  };
}

function ToggleTrack({
  enabled = false,
  small = false,
}) {
  return (
    <span
      className={
        enabled
          ? small
            ? "relative h-6 w-10 shrink-0 rounded-full bg-violet-600 transition dark:bg-violet-500"
            : "relative h-7 w-12 shrink-0 rounded-full bg-violet-600 transition dark:bg-violet-500"
          : small
            ? "relative h-6 w-10 shrink-0 rounded-full bg-slate-300 transition dark:bg-zinc-700"
            : "relative h-7 w-12 shrink-0 rounded-full bg-slate-300 transition dark:bg-zinc-700"
      }
      aria-hidden="true"
    >
      <span
        className={
          enabled
            ? small
              ? "absolute left-5 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition"
              : "absolute left-6 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition"
            : small
              ? "absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition"
              : "absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition"
        }
      />
    </span>
  );
}

export default function MoveTaskWatchPanel({
  taskId = "",
  disabled = false,
} = {}) {
  const requestVersion = useRef(0);

  const [following, setFollowing] =
    useState(false);
  const [preferences, setPreferences] =
    useState({
      ...DEFAULT_PREFERENCES,
    });
  const [watcherCount, setWatcherCount] =
    useState(0);
  const [loading, setLoading] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");

  const applySettings = useCallback(
    (settings) => {
      const normalized =
        normalizeSettings(settings);

      setFollowing(normalized.following);
      setPreferences(
        normalized.preferences
      );
      setWatcherCount(
        normalized.watcherCount
      );
    },
    []
  );

  useEffect(() => {
    const version =
      ++requestVersion.current;

    setFollowing(false);
    setPreferences({
      ...DEFAULT_PREFERENCES,
    });
    setWatcherCount(0);
    setError("");
    setSaving(false);

    if (!taskId) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    fetchTaskWatchSettings(taskId)
      .then((settings) => {
        if (
          version !==
          requestVersion.current
        ) {
          return;
        }

        applySettings(settings);
      })
      .catch((loadError) => {
        if (
          version !==
          requestVersion.current
        ) {
          return;
        }

        setError(
          loadError?.response?.data?.message ||
            loadError?.message ||
            "Move notification settings could not be loaded."
        );
      })
      .finally(() => {
        if (
          version ===
          requestVersion.current
        ) {
          setLoading(false);
        }
      });

    return () => {
      requestVersion.current += 1;
    };
  }, [taskId, applySettings]);

  const persistSettings = useCallback(
    async (
      nextFollowing,
      nextPreferences
    ) => {
      if (
        !taskId ||
        loading ||
        saving
      ) {
        return null;
      }

      const version =
        requestVersion.current;

      setSaving(true);
      setError("");

      try {
        const saved =
          await updateTaskWatchSettings(
            taskId,
            {
              following: nextFollowing,
              preferences:
                nextPreferences,
            }
          );

        if (
          version ===
          requestVersion.current
        ) {
          applySettings(saved);
        }

        return saved;
      } catch (saveError) {
        if (
          version ===
          requestVersion.current
        ) {
          setError(
            saveError?.response?.data?.message ||
              saveError?.message ||
              "Move notification settings could not be saved."
          );
        }

        return null;
      } finally {
        if (
          version ===
          requestVersion.current
        ) {
          setSaving(false);
        }
      }
    },
    [
      taskId,
      loading,
      saving,
      applySettings,
    ]
  );

  const handleFollowingChange =
    useCallback(() => {
      persistSettings(
        !following,
        preferences
      );
    }, [
      persistSettings,
      following,
      preferences,
    ]);

  const handlePreferenceChange =
    useCallback(
      (preferenceKey) => {
        if (!following) return;

        persistSettings(
          true,
          {
            ...preferences,
            [preferenceKey]:
              !preferences[
                preferenceKey
              ],
          }
        );
      },
      [
        persistSettings,
        following,
        preferences,
      ]
    );

  const busy =
    disabled ||
    loading ||
    saving;

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.035] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
            <Bell className="h-4 w-4 text-violet-500" />
            Notifications
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-400">
            Follow this Move without becoming its assignee.
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
          {loading
            ? "Loading…"
            : `${watcherCount.toLocaleString()} ${
                watcherCount === 1
                  ? "follower"
                  : "followers"
              }`}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#19191f]">
        <button
          type="button"
          onClick={handleFollowingChange}
          disabled={busy}
          aria-pressed={following}
          className="flex w-full items-center justify-between gap-4 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/[0.04]"
        >
          <span className="min-w-0">
            <span className="block text-sm font-black text-slate-900 dark:text-white">
              Follow Move
            </span>

            <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-zinc-400">
              {following
                ? "You will receive the selected updates."
                : "Notifications are currently off for you."}
            </span>
          </span>

          <ToggleTrack
            enabled={following}
          />
        </button>
      </div>

      <div
        className={
          following
            ? "mt-3 space-y-2"
            : "mt-3 space-y-2 opacity-55"
        }
      >
        {PREFERENCE_OPTIONS.map(
          (option) => {
            const enabled =
              Boolean(
                preferences[
                  option.key
                ]
              );

            return (
              <button
                key={option.key}
                type="button"
                onClick={() =>
                  handlePreferenceChange(
                    option.key
                  )
                }
                disabled={
                  busy ||
                  !following
                }
                aria-pressed={enabled}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-violet-200 hover:bg-violet-50/40 disabled:cursor-not-allowed dark:border-white/10 dark:bg-[#19191f] dark:hover:border-violet-500/25 dark:hover:bg-violet-500/[0.05]"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-800 dark:text-zinc-100">
                    {option.label}
                  </span>

                  <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-zinc-400">
                    {option.description}
                  </span>
                </span>

                <ToggleTrack
                  enabled={
                    enabled &&
                    following
                  }
                  small
                />
              </button>
            );
          }
        )}
      </div>

      {saving ? (
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving notification settings…
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}
    </section>
  );
}
