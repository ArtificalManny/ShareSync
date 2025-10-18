import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card.jsx";
import SectionHeader from "../../components/ui/SectionHeader.jsx";
import LoadingState from "../../components/states/LoadingState.jsx";
import ErrorState from "../../components/states/ErrorState.jsx";

export default function PulseAdmin() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true); setErr("");
        // Replace with your real admin pulse endpoint
        const res = await fetch("/api/admin/pulse");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!ignore) setStats(data);
      } catch (e) {
        if (!ignore) setErr(e?.message || "Failed to load pulse");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  if (loading) return <LoadingState label="Loading pulse…" />;
  if (err) return <ErrorState message={err} />;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-6xl mx-auto">
      <Card>
        <SectionHeader icon="Activity">Realtime Pulse</SectionHeader>
        <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Metric label="Active Users (5m)" value={stats?.activeUsers5m ?? "—"} />
          <Metric label="Open Sockets" value={stats?.openSockets ?? "—"} />
          <Metric label="Rooms" value={stats?.rooms ?? "—"} />
        </div>
      </Card>

      <Card className="mt-6">
        <SectionHeader icon="Users">Online Users</SectionHeader>
        <table className="mt-3 w-full text-sm">
          <thead className="text-muted">
            <tr><th className="text-left py-1">User</th><th className="text-left py-1">Last Seen</th><th className="text-left py-1">Room</th></tr>
          </thead>
          <tbody>
            {(stats?.users || []).map((u) => (
              <tr key={u.id} className="border-t border-border/60">
                <td className="py-2">{u.name || u.email || u.id}</td>
                <td className="py-2">{u.lastSeen ? new Date(u.lastSeen).toLocaleString() : "—"}</td>
                <td className="py-2">{u.room || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-muted mt-2">Read-only. No mutations on this page.</div>
      </Card>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
