// /src/pages/admin/AdminMetrics.jsx
import React, { useEffect, useState } from "react";
import { getSnapshot } from "../../state/metrics";
import { ADMIN_METRICS_V1 } from "../../config/flags";

export default function AdminMetrics() {
  const [snap, setSnap] = useState(getSnapshot());
  const [adminSnap, setAdminSnap] = useState({
    users: 0,
    projects: 0,
    invites: 0,
    loaded: false,
    error: "",
  });

  // live in-memory metrics snapshot
  useEffect(() => {
    const id = setInterval(() => setSnap(getSnapshot()), 1000);
    return () => clearInterval(id);
  }, []);

  // admin counts from API (soft-fail)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const mod = await import("../../api/admin.js").catch(() => null);
        const listUsers = mod?.listUsers;
        const listProjects = mod?.listProjects;
        const listInvites = mod?.listInvites;

        if (!listUsers || !listProjects || !listInvites) {
          if (!ignore) {
            setAdminSnap((s) => ({ ...s, loaded: true, error: "admin api missing" }));
          }
          return;
        }

        const [u, p, i] = await Promise.all([
          listUsers({ page: 1, pageSize: 1, q: "", sort: "createdAt:desc" }).catch(() => ({ total: 0 })),
          listProjects({ page: 1, pageSize: 1, q: "", sort: "createdAt:desc" }).catch(() => ({ total: 0 })),
          listInvites({ page: 1, pageSize: 1, q: "", sort: "createdAt:desc" }).catch(() => ({ total: 0 })),
        ]);

        if (!ignore) {
          setAdminSnap({
            users: Number(u?.total || 0),
            projects: Number(p?.total || 0),
            invites: Number(i?.total || 0),
            loaded: true,
            error: "",
          });
        }
      } catch (e) {
        if (!ignore) {
          setAdminSnap((s) => ({ ...s, loaded: true, error: e?.message || "failed to load admin snapshot" }));
        }
      }
    })();
    return () => { ignore = true; };
  }, []);

  if (!ADMIN_METRICS_V1) {
    return <div className="p-4 text-sm text-muted">Admin metrics disabled.</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Admin Metrics</h1>

      {/* Admin snapshot from API */}
      <div>
        <div className="text-sm font-semibold mb-1">Admin snapshot</div>
        <pre className="text-xs rounded-xl border border-border bg-surface p-3 overflow-auto">
{JSON.stringify(
  {
    users_total: adminSnap.users,
    projects_total: adminSnap.projects,
    invites_total: adminSnap.invites,
    loaded: adminSnap.loaded,
    error: adminSnap.error || undefined,
  },
  null,
  2
)}
        </pre>
      </div>

      {/* Live in-memory metrics */}
      <div>
        <div className="text-sm font-semibold mb-1">Runtime metrics (in-memory)</div>
        <pre className="text-xs rounded-xl border border-border bg-surface p-3 overflow-auto">
{JSON.stringify(snap, null, 2)}
        </pre>
      </div>
    </div>
  );
}
