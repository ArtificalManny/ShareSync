import React from "react";

/**
 * MembersPanel
 * Props:
 *  - members: [{ _id?, name?, email?, role? }]
 *  - invites?: [{ email, role, status:'pending'|'accepted' }] (optional)
 */
export default function MembersPanel({ members = [], invites = [] }) {
  const pending = Array.isArray(invites)
    ? invites.filter((i) => (i?.status || "pending") === "pending")
    : [];

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Members</h3>
        {pending.length > 0 && (
          <span
            className="text-[11px] px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            title="Pending invites"
          >
            {pending.length} pending
          </span>
        )}
      </div>

      <ul className="space-y-2">
        {members.map((m, i) => (
          <li key={m._id || m.email || i} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 grid place-content-center text-xs">
              {(m.name || m.email || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm truncate">{m.name || m.email || "Member"}</div>
              <div className="text-xs text-slate-500">{m.role || "Member"}</div>
            </div>
          </li>
        ))}
      </ul>

      {members.length === 0 && (
        <p className="text-sm text-slate-500">No members yet.</p>
      )}

      {pending.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-slate-500">Pending invites</h4>
          <ul className="mt-1 space-y-1">
            {pending.slice(0, 4).map((i, idx) => (
              <li key={i.token || i.email || idx} className="text-xs text-slate-600 dark:text-slate-300">
                {i.email} · {i.role}
              </li>
            ))}
            {pending.length > 4 && (
              <li className="text-[11px] text-slate-500">+{pending.length - 4} more…</li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
