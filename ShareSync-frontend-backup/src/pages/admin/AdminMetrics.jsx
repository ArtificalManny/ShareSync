// /src/pages/admin/AdminMetrics.jsx
import React, { useEffect, useState } from "react";
import { getSnapshot } from "../../state/metrics";
import { ADMIN_METRICS_V1 } from "../../config/flags";

export default function AdminMetrics() {
  const [snap, setSnap] = useState(getSnapshot());
  useEffect(() => {
    const id = setInterval(() => setSnap(getSnapshot()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!ADMIN_METRICS_V1) {
    return <div className="p-4 text-sm text-muted">Admin metrics disabled.</div>;
  }
  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-2">Admin Metrics</h1>
      <pre className="text-xs rounded-xl border border-border bg-surface p-3 overflow-auto">
{JSON.stringify(snap, null, 2)}
</pre>
</div>
  );
}
