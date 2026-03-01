import React from "react";

export default function TeamCapacityCard({ metrics }) {
  const capacity = metrics?.teamCapacity ?? metrics?.capacity ?? "—";
  const load = metrics?.teamLoad ?? metrics?.load ?? "—";

  return (
    <section className="glass-card p-5">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold opacity-90">Team Capacity</h3>
        <span className="text-xs opacity-60">Live</span>
      </header>

      <div className="space-y-2 text-sm opacity-85">
        <div className="flex items-center justify-between">
          <span className="text-xs opacity-70">Capacity</span>
          <span className="text-xs opacity-90">{capacity}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs opacity-70">Load</span>
          <span className="text-xs opacity-90">{load}</span>
        </div>
      </div>

      <div className="mt-3 text-xs opacity-60">
        Team workload metrics unlock with 2+ members.
      </div>
    </section>
  );
}
