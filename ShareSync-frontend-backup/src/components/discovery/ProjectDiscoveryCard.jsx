// src/components/discovery/ProjectDiscoveryCard.jsx
import React, { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import Button from "../ui/Button.jsx";
import Chip from "../ui/Chip.jsx";
import { track } from "../../utils/telemetry";

function formatNumber(n) {
  if (n == null || isNaN(n)) return "0";
  return Number(n).toLocaleString();
}

function formatScore(s) {
  if (s == null || isNaN(s)) return "0.0";
  return Number(s).toFixed(1);
}

function timeAgo(iso) {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

export default function ProjectDiscoveryCard({ data }) {
  const velocity = data?.signals?.velocityPerWeek ?? 0;
  const xp = data?.signals?.xpGrowth ?? 0;
  const reactions = data?.signals?.reactions ?? 0;
  const score = data?.score ?? 0;

  // Impression tracking (fires once)
  const rootRef = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen) return;
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSeen(true);
          track("discovery_card_impression", { projectId: data.id, score });
          obs.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [seen, data?.id, score]);

  // Tiny, human-readable reason line:
  const reason = data.public ? "Public project" : "Similar momentum";
  const boostHint = "boosted by velocity & reactions";

  return (
    <div
      ref={rootRef}
      className="card rounded-2xl border border-border bg-surface p-4 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="project-icon project-icon--lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-xl w-10 h-10">
            {data.icon?.kind === "emoji" ? (
              <span className="emoji text-lg">{data.icon.value}</span>
            ) : (
              "📁"
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{data.title}</div>
            <div className="text-xs text-muted">
              Score: <span className="num">{formatScore(score)}</span>
              <span className="mx-2 opacity-30">•</span>
              Updated {timeAgo(data.lastActivityAt)}
            </div>
          </div>
        </div>
        {data.public && <Chip size="sm">Public</Chip>}
      </div>

      {/* Metrics summary */}
      <div className="mt-3 rounded-xl border border-border bg-surface/50 p-3">
        <div className="text-xs text-muted">7–90d signals</div>
        <div className="mt-1 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-lg bg-surface p-2 border border-border">
            <div className="text-[10px] uppercase text-muted tracking-wide">
              Velocity/wk
            </div>
            <div className="font-medium">{formatNumber(velocity)}</div>
          </div>
          <div className="rounded-lg bg-surface p-2 border border-border">
            <div className="text-[10px] uppercase text-muted tracking-wide">
              XP Δ
            </div>
            <div className="font-medium">{formatNumber(xp)}</div>
          </div>
          <div className="rounded-lg bg-surface p-2 border border-border">
            <div className="text-[10px] uppercase text-muted tracking-wide">
              Reactions
            </div>
            <div className="font-medium inline-flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              {formatNumber(reactions)}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-muted">
          Transparency{" "}
          <span className="num font-medium">
            {typeof data.transparency === "number"
              ? data.transparency.toFixed(0)
              : data.public
              ? "1"
              : "0"}
          </span>
        </div>
        <Button
          as="a"
          href={`/projects/${data.id}`}
          size="sm"
          variant="secondary"
          onClick={() =>
            track("discovery_open_project", { projectId: data.id, score })
          }
        >
          Open
        </Button>
      </div>

      {/* Why you're seeing this */}
      <div className="text-[11px] text-muted mt-1">
        Why you’re seeing this: {reason} · {boostHint}
      </div>
    </div>
  );
}