import React, { useEffect, useMemo, useState } from "react";
import { Save, Clock, BellRing, CheckCircle2 } from "lucide-react";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

let api = null;
(async () => {
  try { api = await import("../api/habits"); } catch { api = null; }
})();

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-sm text-text">{label}</span>
      <input
        type="checkbox"
        className="h-4 w-8 accent-indigo-600"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        aria-label={label}
      />
    </label>
  );
}

/**
 * SettingsHabits
 * User preferences: workdays, quiet hours, nudges, weekly reminder.
 */
export default function SettingsHabits() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [workdays, setWorkdays] = useState([1,2,3,4,5]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [nudges, setNudges] = useState({ afterSprint: true, suggestUpdate: true, suggestTask: true });
  const [reminderDow, setReminderDow] = useState(5);
  const [reminderTime, setReminderTime] = useState("16:00");

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true); setError("");
      try {
        if (api?.getHabitsPrefs) {
          const p = await api.getHabitsPrefs();
          if (ignore) return;
          setWorkdays(p?.workdays ?? [1,2,3,4,5]);
          setStart(p?.workHours?.start ?? "09:00");
          setEnd(p?.workHours?.end ?? "17:00");
          setNudges({
            afterSprint: !!p?.nudges?.afterSprint,
            suggestUpdate: !!p?.nudges?.suggestUpdate,
            suggestTask: !!p?.nudges?.suggestTask,
          });
          setReminderDow(p?.weeklyReminder?.dow ?? 5);
          setReminderTime(p?.weeklyReminder?.time ?? "16:00");
        }
      } catch (e) {
        setError(e?.message || "Failed to load preferences.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const toggleDay = (i) =>
    setWorkdays((arr) => (arr.includes(i) ? arr.filter(d => d !== i) : [...arr, i].sort()));

  const canSave = useMemo(() => !saving && !loading, [saving, loading]);

  const save = async () => {
    if (!canSave) return;
    setSaving(true); setError("");
    try {
      const payload = {
        workdays,
        workHours: { start, end },
        nudges,
        weeklyReminder: { dow: reminderDow, time: reminderTime },
      };
      if (api?.updateHabitsPrefs) {
        await api.updateHabitsPrefs(payload);
      } else {
        await fetch("/api/habits/prefs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    } catch (e) {
      setError(e?.message || "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main id="main" role="main" className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto bg-bg text-text">
      <h1 className="text-lg sm:text-xl font-bold">Habit Preferences</h1>
      <p className="text-sm text-muted mt-1">
        Tune how we measure cadence, when we nudge, and your weekly reflection timing.
      </p>

      {error && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {/* Work schedule */}
      <section className="card card--hover shine accent-bar rounded-2xl border border-border bg-surface p-4 mt-4 relative">
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="inline-flex items-center gap-2 text-sm font-semibold">
          <Clock className="w-4 h-4 text-indigo-600" />
          Work Schedule
        </div>

        <div className="mt-3">
          <div className="text-xs text-muted mb-1">Workdays</div>
          <div role="group" aria-label="Workdays" className="flex flex-wrap gap-1.5">
            {DAYS.map((d, i) => {
              const on = workdays.includes(i);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={[
                    "px-2 py-1 rounded-md text-xs border",
                    on
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white dark:bg-slate-900 text-text border-border hover:bg-surface"
                  ].join(" ")}
                  aria-pressed={on}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 max-w-sm">
          <div>
            <label className="block text-xs text-muted mb-1">Start</label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full text-sm rounded-md border border-border bg-surface px-2 py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">End</label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full text-sm rounded-md border border-border bg-surface px-2 py-1.5"
            />
          </div>
        </div>
      </section>

      {/* Nudges */}
      <section className="card card--hover shine accent-bar rounded-2xl border border-border bg-surface p-4 mt-4 relative">
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="inline-flex items-center gap-2 text-sm font-semibold">
          <BellRing className="w-4 h-4 text-indigo-600" />
          Nudges
        </div>

        <div className="mt-2 grid gap-2">
          <ToggleRow
            label="After a sprint: suggest logging a quick update"
            checked={nudges.afterSprint}
            onChange={(v) => setNudges((n) => ({ ...n, afterSprint: v }))}
          />
          <ToggleRow
            label="Suggest turning notes into tasks"
            checked={nudges.suggestTask}
            onChange={(v) => setNudges((n) => ({ ...n, suggestTask: v }))}
          />
          <ToggleRow
            label="Suggest quick status updates"
            checked={nudges.suggestUpdate}
            onChange={(v) => setNudges((n) => ({ ...n, suggestUpdate: v }))}
          />
        </div>
      </section>

      {/* Weekly reflection */}
      <section className="card card--hover shine accent-bar rounded-2xl border border-border bg-surface p-4 mt-4 relative">
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="inline-flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          Weekly Reflection
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 max-w-md">
          <div>
            <label className="block text-xs text-muted mb-1">Day</label>
            <select
              className="w-full text-sm rounded-md border border-border bg-surface px-2 py-1.5"
              value={reminderDow}
              onChange={(e) => setReminderDow(Number(e.target.value))}
            >
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Time</label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full text-sm rounded-md border border-border bg-surface px-2 py-1.5"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-end">
        <button
          onClick={save}
          disabled={!canSave}
          className="btn btn--primary press-shrink marching disabled:opacity-60"
          style={{ ["--march-color"]: "var(--accent)" }}
        >
          <Save className="w-4 h-4" />
          Save preferences
        </button>
      </div>

      {loading && (
        <div className="fixed inset-x-0 bottom-4 grid place-items-center pointer-events-none">
          <div className="text-xs text-muted bg-surface border border-border rounded-lg px-2 py-1">Loading…</div>
        </div>
      )}
    </main>
  );
}