// src/components/follow/FollowPrefsForm.jsx
import React, { useMemo, useState } from "react";
import { updateFollowPreferences } from "../../api/follows";
import { toast } from "../ui/toast";

function normalizePrefs(p) {
  return {
    ships: Boolean(p?.ships ?? true),
    milestones: Boolean(p?.milestones ?? true),
    digest: String(p?.digest || "instant"),
  };
}

export default function FollowPrefsForm({
  projectId,
  initialPreferences,
  onCancel,
  onSaved,
}) {
  const initial = useMemo(
    () => normalizePrefs(initialPreferences),
    [initialPreferences],
  );

  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!projectId) return;

    try {
      setSaving(true);
      const res = await updateFollowPreferences(projectId, prefs);

      // Accept any shape, but prefer server return
      const next = normalizePrefs(res?.preferences || prefs);

      onSaved?.(next);
    } catch (e) {
      toast({
        title: e?.message || "Could not save preferences",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-300">
        Choose what you want to be notified about.
      </div>

      <div className="space-y-3">
        <label className="flex items-center justify-between gap-3 bg-slate-950/30 border border-white/10 rounded-xl px-4 py-3">
          <div>
            <div className="font-semibold text-white">Ship updates</div>
            <div className="text-xs text-slate-400">
              When the team posts a new ship/update
            </div>
          </div>
          <input
            type="checkbox"
            checked={prefs.ships}
            onChange={(e) => setPrefs((p) => ({ ...p, ships: e.target.checked }))}
            className="h-5 w-5 accent-purple-500"
          />
        </label>

        <label className="flex items-center justify-between gap-3 bg-slate-950/30 border border-white/10 rounded-xl px-4 py-3">
          <div>
            <div className="font-semibold text-white">Milestones</div>
            <div className="text-xs text-slate-400">
              When a milestone is reached
            </div>
          </div>
          <input
            type="checkbox"
            checked={prefs.milestones}
            onChange={(e) => setPrefs((p) => ({ ...p, milestones: e.target.checked }))}
            className="h-5 w-5 accent-purple-500"
          />
        </label>

        <div className="bg-slate-950/30 border border-white/10 rounded-xl px-4 py-3">
          <div className="font-semibold text-white mb-1">Delivery</div>
          <div className="text-xs text-slate-400 mb-3">
            How often you want notifications
          </div>

          <select
            value={prefs.digest}
            onChange={(e) => setPrefs((p) => ({ ...p, digest: e.target.value }))}
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
          >
            <option value="instant">Instant</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly digest</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold transition-all active:scale-95 disabled:opacity-70"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold transition-all active:scale-95 disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
