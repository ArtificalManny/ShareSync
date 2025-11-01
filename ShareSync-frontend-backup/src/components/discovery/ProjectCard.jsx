// /src/components/discovery/ProjectCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Info,
  Activity as ActivityIcon,
  TrendingUp,
  Heart,
  Clock,
} from "lucide-react";

export default function ProjectCard({ project, to, onOpen }) {
  const {
    id,
    title,
    description,
    coverUrl,
    icon,
    lastActivityAt,
    metrics = {},
    __rank,
    __explain,
    color,
    pulse,
  } = project || {};

  const dest = to || (id ? `/projects/${id}` : "#");

  const vel = safeNum(metrics.velocity_30d);
  const reacts = safeNum(metrics.reactions_14d);

  const last = lastActivityAt ? new Date(lastActivityAt) : null;
  const lastLabel = last ? relTime(last) : "—";

  const Tag = onOpen ? "button" : Link;
  const TagProps = onOpen
    ? { type: "button", onClick: () => onOpen?.(project) }
    : { to: dest };

  return (
    <Tag
      {...TagProps}
      className="group relative block card glass rounded-2xl p-3 hover:shadow-sm hover:-translate-y-[1px] transition transform text-left"
      title={__explain || undefined}
      aria-label={`${title || "Project"} — score ${fmt(__rank)} — last active ${lastLabel}`}
    >
      {/* DNA + Pulse */}
      <div
        className="project-dna"
        style={{ "--pulse": `${pulse || 2}s` }}
      >
        <span
          className="icon"
          style={{ color: color || "var(--accent)" }}
        >
          {icon || "Briefcase"}
        </span>
      </div>

      {/* header row */}
      <div className="flex items-start gap-3">
        <AvatarSquare src={coverUrl} label={title} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="font-semibold truncate">{title || "Untitled project"}</div>
            {__explain && (
              <Info
                className="w-4 h-4 text-muted shrink-0"
                aria-hidden="true"
                title={__explain}
              />
            )}
          </div>
          {description && (
            <div className="text-xs text-muted line-clamp-2 mt-0.5">
              {description}
            </div>
          )}
        </div>
        {Number.isFinite(__rank) && (
          <div className="text-right shrink-0">
            <div className="text-xs text-muted">Score</div>
            <div className="text-sm font-semibold num">{fmt(__rank)}</div>
          </div>
        )}
      </div>

      {/* metric chips */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Chip icon={<TrendingUp className="w-3.5 h-3.5" />} label="v30d" value={vel} />
        <Chip icon={<Heart className="w-3.5 h-3.5" />} label="r14d" value={reacts} />
        <Chip icon={<Clock className="w-3.5 h-3.5" />} label="last active" value={lastLabel} />
      </div>

      {/* tiny activity bar */}
      <div className="mt-3 h-1.5 rounded-full bg-[color-mix(in_srgb, rgb(var(--accent))_12%, transparent)] overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${Math.max(4, Math.min(100, (vel / Math.max(1, vel + reacts)) * 100))}%`,
            background:
              "linear-gradient(90deg, rgb(var(--accent)) 0%, rgb(var(--info)) 100%)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* footer */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
        <span className="inline-flex items-center gap-1">
          <ActivityIcon className="w-3.5 h-3.5" />
          Discover
        </span>
        <span className="underline decoration-dotted group-hover:no-underline">
          View project
        </span>
      </div>

      <style jsx>{`
        .project-dna {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(6px);
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.2);
          z-index: 10;
        }
        .project-dna .icon {
          font-size: 18px;
          animation: pulse var(--pulse, 2s) infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </Tag>
  );
}

function AvatarSquare({ src, label }) {
  if (!src) {
    const letter = (label || "?").slice(0, 1).toUpperCase();
    return (
      <div
        className="w-10 h-10 rounded-xl grid place-items-center border border-border bg-surface-100 text-sm font-semibold"
        aria-hidden="true"
      >
        {letter}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="w-10 h-10 rounded-xl object-cover border border-border"
      loading="lazy"
      decoding="async"
    />
  );
}

function Chip({ icon, label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-[11px]">
      {icon}
      <span className="text-muted">{label}</span>
      <span className="font-medium">{String(isFinite(value) ? value : value ?? "—")}</span>
    </span>
  );
}

function relTime(d) {
  try {
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return "—";
  }
}

function safeNum(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}
function fmt(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v.toFixed(2) : "—";
}