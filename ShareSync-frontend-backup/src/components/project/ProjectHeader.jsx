import React, { useEffect, useState } from "react";
import "./project-header.css";

export default function ProjectHeader({
  name = "Untitled Project",
  status = "In Progress",         // or "Paused", "Done"
  isPublic = false,
  metrics = { ontime: 0, throughput: 0, streak: 0 },
  onAddTask,
  onStartFocus,
  onDownloadICS,
  icon = "U",                      // emoji, letter, or <img src=...>
}) {
  // spin the ring once on first mount
  const [spinOnce, setSpinOnce] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setSpinOnce(false), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="project-header panel-neon specular">
      <div className="ph-inner">
        {/* Left cluster */}
        <div className="ph-left">
          <div className={`ph-icon story-ring ${spinOnce ? "ring-spin-once" : ""}`}>
            <div className="ph-avatar" aria-hidden>
              {typeof icon === "string" ? icon : icon}
            </div>
          </div>

          <div className="ph-title">
            <h1 className="ph-name">{name}</h1>
            <div className="ph-sub">
              <span className={`chip chip-${status === "In Progress" ? "good" : status === "Paused" ? "warn" : "muted"}`}>
                {status}
              </span>
              <span className={`chip chip-${isPublic ? "info" : "muted"}`}>
                {isPublic ? "Public" : "Private"}
              </span>
            </div>

            {/* Micro KPIs (optional) */}
            <ul className="ph-kpis" aria-label="Project mini KPIs">
              <li><span className="kpi-label">On-time</span><span className="kpi-val">{metrics.ontime ?? 0}%</span></li>
              <li><span className="kpi-label">Throughput</span><span className="kpi-val">{metrics.throughput ?? 0}/wk</span></li>
              <li><span className="kpi-label">Streak</span><span className="kpi-val">{metrics.streak ?? 0}d</span></li>
            </ul>
          </div>
        </div>

        {/* Right actions */}
        <div className="ph-right">
          <button className="btn-neon" onClick={onAddTask}>+ Add task</button>
          <button className="btn-outline" onClick={onStartFocus}>Start 25:00</button>
          <button className="btn-ghost" onClick={onDownloadICS}>Download .ics</button>
        </div>
      </div>
    </section>
  );
}
