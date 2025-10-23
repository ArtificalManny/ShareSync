// src/components/project/ProjectHeader.jsx
import React, { useEffect, useState } from "react";
import "./project-header.css";
import Button from "../ui/Button";

export default function ProjectHeader({
  name = "Untitled Project",
  status = "In Progress",          // "In Progress" | "Paused" | "Done"
  isPublic = false,
  metrics = { ontime: 0, throughput: 0, streak: 0 },
  onAddTask,
  onStartFocus,
  onDownloadICS,
  // emoji, letter, or <img />
  icon = "U",
}) {
  // Spin the ring once on first mount, then settle to idle glow
  const [spinOnce, setSpinOnce] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setSpinOnce(false), 1600);
    return () => clearTimeout(t);
  }, []);

  const statusClass =
    status === "In Progress" ? "good" : status === "Paused" ? "warn" : "muted";

  return (
    <section className="project-header panel-neon specular" role="region" aria-label="Project header">
      <div className="ph-inner">
        {/* Left cluster */}
        <div className="ph-left">
          {/* Ringed avatar/icon */}
          <div className={`ph-icon story-ring ${spinOnce ? "ring-spin-once" : ""}`}>
            <div className="ph-avatar" aria-hidden>
              {typeof icon === "string" ? icon : icon}
            </div>
          </div>

          <div className="ph-title">
            <h1 className="ph-name">{name}</h1>
            <div className="ph-sub">
              <span className={`chip chip-${statusClass}`} aria-label={`Status: ${status}`}>
                {status}
              </span>
              <span className={`chip chip-${isPublic ? "info" : "muted"}`} aria-label={`Visibility: ${isPublic ? "Public" : "Private"}`}>
                {isPublic ? "Public" : "Private"}
              </span>
            </div>

            {/* Micro KPIs */}
            <ul className="ph-kpis" aria-label="Project mini KPIs">
              <li>
                <span className="kpi-label">On-time</span>
                <span className="kpi-val">{metrics?.ontime ?? 0}%</span>
              </li>
              <li>
                <span className="kpi-label">Throughput</span>
                <span className="kpi-val">{metrics?.throughput ?? 0}/wk</span>
              </li>
              <li>
                <span className="kpi-label">Streak</span>
                <span className="kpi-val">{metrics?.streak ?? 0}d</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right actions (shared Button variants) */}
        <div className="ph-right">
          <Button variant="primary" size="md" onClick={onAddTask}>
            + Add task
          </Button>
          <Button variant="outline" size="md" onClick={onStartFocus}>
            Start 25:00
          </Button>
          <Button variant="ghost" size="md" onClick={onDownloadICS}>
            Download .ics
          </Button>
        </div>
      </div>
    </section>
  );
}
