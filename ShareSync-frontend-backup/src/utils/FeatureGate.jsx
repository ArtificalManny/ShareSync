// /src/components/util/FeatureGate.jsx
import React from "react";

export default function FeatureGate({ enabled, children, fallback = null, label }) {
  if (enabled) return children;
  return fallback ?? (
    <div className="rounded-xl border border-dashed border-border bg-surface p-3 text-sm text-muted">
      {label || "This feature is currently disabled."}
    </div>
  );
}
