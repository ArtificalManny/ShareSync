// src/pages/admin/AdminAccountEnforcement.jsx

import React, { useMemo, useState } from "react";
import {
  banUser,
  disableUser,
  getUserEnforcement,
  restoreUser,
  suspendUser,
  updateUserAccountStatus,
  warnUser,
} from "../../api/accountEnforcement";

const STATUS_STYLES = {
  active: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  warned: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  suspended: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  disabled: "bg-slate-500/15 text-slate-700 border-slate-500/30",
  banned: "bg-red-500/15 text-red-700 border-red-500/30",
  restricted: "bg-purple-500/15 text-purple-700 border-purple-500/30",
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function StatusBadge({ status }) {
  const normalized = String(status || "active").toLowerCase();

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${
        STATUS_STYLES[normalized] || STATUS_STYLES.restricted
      }`}
    >
      {normalized}
    </span>
  );
}

export default function AdminAccountEnforcement() {
  const [userId, setUserId] = useState("");
  const [statusData, setStatusData] = useState(null);

  const [reason, setReason] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [suspendMinutes, setSuspendMinutes] = useState("60");

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const trimmedUserId = useMemo(() => userId.trim(), [userId]);

  const loadStatus = async () => {
    if (!trimmedUserId) {
      setError("Enter a user ID first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await getUserEnforcement(trimmedUserId);
      setStatusData(res?.data || res);
    } catch (err) {
      setError(err.message || "Failed to load enforcement status.");
    } finally {
      setLoading(false);
    }
  };

  const getPayload = (action) => {
    const payload = {
      reason: reason.trim() || defaultReasonFor(action),
      internalNote: internalNote.trim(),
    };

    if (action === "suspend") {
      const minutes = Number(suspendMinutes || 60);
      const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 60;
      payload.suspendedUntil = new Date(
        Date.now() + safeMinutes * 60 * 1000
      ).toISOString();
    }

    return payload;
  };

  const handleAction = async (action) => {
    if (!trimmedUserId) {
      setError("Enter a user ID first.");
      return;
    }

    const dangerousActions = ["suspend", "disable", "ban"];

    if (dangerousActions.includes(action)) {
      const ok = window.confirm(
        `Are you sure you want to ${action} this account?`
      );

      if (!ok) return;
    }

    setActionLoading(action);
    setError("");
    setSuccess("");

    try {
      const payload = getPayload(action);

      let res;

      if (action === "warn") {
        res = await warnUser(trimmedUserId, payload);
      } else if (action === "suspend") {
        res = await suspendUser(trimmedUserId, payload);
      } else if (action === "disable") {
        res = await disableUser(trimmedUserId, payload);
      } else if (action === "ban") {
        res = await banUser(trimmedUserId, payload);
      } else if (action === "restore") {
        res = await restoreUser(trimmedUserId, payload);
      } else if (action === "active") {
        res = await updateUserAccountStatus(trimmedUserId, {
          status: "active",
          ...payload,
        });
      } else {
        throw new Error(`Unknown action: ${action}`);
      }

      setSuccess(res?.message || `Account ${action} action completed.`);
      await loadStatus();
    } catch (err) {
      setError(err.message || `Failed to ${action} account.`);
    } finally {
      setActionLoading("");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-600 dark:text-purple-300">
            Admin Control
          </p>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Account Enforcement
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Review account safety status and apply warning, suspension,
                disable, ban, or restore actions.
              </p>
            </div>

            <button
              type="button"
              onClick={loadStatus}
              disabled={loading || !trimmedUserId}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
            >
              {loading ? "Loading..." : "Load status"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="text-xl font-bold">Target account</h2>

            <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              User ID
            </label>
            <input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Paste MongoDB user _id"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-900"
            />

            <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Public reason
            </label>
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Example: Repeated policy violations"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-900"
            />

            <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Internal note
            </label>
            <textarea
              value={internalNote}
              onChange={(event) => setInternalNote(event.target.value)}
              placeholder="Optional internal context for audit/review"
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-900"
            />

            <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Suspension length, minutes
            </label>
            <input
              value={suspendMinutes}
              onChange={(event) => setSuspendMinutes(event.target.value)}
              type="number"
              min="1"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-900"
            />

            {error && (
              <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-200">
                {success}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-bold">Current status</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Loaded from backend enforcement endpoint.
                </p>
              </div>

              {statusData?.accountStatus && (
                <StatusBadge status={statusData.accountStatus} />
              )}
            </div>

            {statusData ? (
              <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
                <Info label="User ID" value={statusData.userId} />
                <Info label="Email" value={statusData.email} />
                <Info label="Username" value={statusData.username} />
                <Info label="Status" value={statusData.accountStatus} />
                <Info label="Reason" value={statusData.accountStatusReason} />
                <Info label="Internal note" value={statusData.accountStatusNote} />
                <Info
                  label="Changed at"
                  value={formatDate(statusData.accountStatusChangedAt)}
                />
                <Info
                  label="Suspended until"
                  value={formatDate(statusData.suspendedUntil)}
                />
              </dl>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                Enter a user ID and load status.
              </div>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ActionButton
                label="Warn"
                tone="amber"
                loading={actionLoading === "warn"}
                onClick={() => handleAction("warn")}
              />
              <ActionButton
                label="Suspend"
                tone="orange"
                loading={actionLoading === "suspend"}
                onClick={() => handleAction("suspend")}
              />
              <ActionButton
                label="Disable"
                tone="slate"
                loading={actionLoading === "disable"}
                onClick={() => handleAction("disable")}
              />
              <ActionButton
                label="Ban"
                tone="red"
                loading={actionLoading === "ban"}
                onClick={() => handleAction("ban")}
              />
              <ActionButton
                label="Restore"
                tone="emerald"
                loading={actionLoading === "restore"}
                onClick={() => handleAction("restore")}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/20">
      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-2 break-words font-medium text-slate-900 dark:text-white">
        {value || "—"}
      </dd>
    </div>
  );
}

function ActionButton({ label, tone, loading, onClick }) {
  const tones = {
    amber:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-200",
    orange:
      "border-orange-500/30 bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 dark:text-orange-200",
    slate:
      "border-slate-500/30 bg-slate-500/10 text-slate-700 hover:bg-slate-500/20 dark:text-slate-200",
    red: "border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-200",
    emerald:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-200",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`rounded-2xl border px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        tones[tone] || tones.slate
      }`}
    >
      {loading ? "Working..." : label}
    </button>
  );
}

function defaultReasonFor(action) {
  const map = {
    warn: "Account warning issued",
    suspend: "Account temporarily suspended",
    disable: "Account disabled",
    ban: "Account banned",
    restore: "Account restored",
    active: "Account restored",
  };

  return map[action] || "Account enforcement action";
}
