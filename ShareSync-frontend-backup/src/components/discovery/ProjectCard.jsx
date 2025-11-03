// src/components/projects/ProjectCard.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Rocket, Users, Clock } from "lucide-react";
import AvatarGroup from "../ui/AvatarGroup";
import ShipCelebration from "../momentum/ShipCelebration";

export default function ProjectCard({
  project,
  onOpen,
  onPrefetch,
  isHovered,
}) {
  const [showShip, setShowShip] = useState(false);
  const pid = project._id || project.id;
  const lastTs = project.lastActivityAt || project.updatedAt || project.createdAt;
  const rawStatus = project.status || '';
  const key =
    rawStatus === 'In Progress' ? 'in_progress' :
    rawStatus === 'Completed'   ? 'completed'   : 'not_started';

  const accent = {
    in_progress: { bar: 'from-indigo-500 via-fuchsia-500 to-pink-500', chip: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'In Progress' },
    completed:   { bar: 'from-emerald-500 via-teal-500 to-cyan-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Completed' },
    not_started: { bar: 'from-slate-400 via-slate-500 to-slate-600', chip: 'bg-slate-50 text-slate-700 border-slate-200', label: 'Not Started' },
  }[key] || accent.not_started;

  const m = project.metrics || {};
  const onTime = (m.onTimePct ?? m.onTime ?? null);
  const openTasks = (project.openTasks ?? m.openTasks ?? null);
  const tput = (m.throughputPerWeek?.value ?? m.tputWk ?? null);

  const members = Array.isArray(project.members) ? project.members.map((u) => ({
    id: u.id || u._id || u.userId || u.username || u.email,
    name: u.displayName || u.name || u.username || u.email,
    avatar: u.avatar || u.avatarUrl || u.photoURL || u.profilePicture || '',
  })) : [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="relative"
      >
        <div
          className="group relative card glass rounded-2xl border border-border bg-surface shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(16,24,40,0.12)] focus-ring cursor-pointer"
          data-shine
          role="button"
          tabIndex={0}
          aria-label={`Open project ${project.title || 'untitled'}`}
          onClick={onOpen}
          onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
          onMouseEnter={onPrefetch}
        >
          {/* DNA + Pulse */}
          <div
            className="project-dna"
            style={{ "--pulse": `${project.pulse || 2}s` }}
          >
            <span
              className="icon"
              style={{ color: project.color || "var(--accent)" }}
            >
              {project.icon || "Briefcase"}
            </span>
          </div>

          {/* Accent bar */}
          <div
            className={`absolute left-0 top-0 h-full w-1 origin-left bg-gradient-to-b ${accent.bar} transition-transform duration-300 ease-out group-hover:scale-x-[1.4]`}
            aria-hidden="true"
          />

          {/* Sweep */}
          <div
            className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10 transition duration-700 ease-out group-hover:opacity-100 group-hover:translate-x-full"
            aria-hidden="true"
          />

          {/* Main content */}
          <div className="px-3 sm:px-4 pt-3">
            <h3 className="text-lg font-semibold truncate">{project.title || "Untitled"}</h3>
            {project.description && (
              <p className="text-sm text-muted line-clamp-2 mt-1">{project.description}</p>
            )}
          </div>

          {/* Mini KPIs */}
          <div className="px-3 sm:px-4 py-2 grid grid-cols-2 gap-2">
            <div className="rounded-md border border-border/60 bg-white/60 dark:bg-slate-900/40 px-2 py-1.5">
              <div className="text-[10px] text-muted">On-time %</div>
              <div className="text-sm font-semibold">{onTime ?? '—'}</div>
            </div>
            <div className="rounded-md border border-border/60 bg-white/60 dark:bg-slate-900/40 px-2 py-1.5">
              <div className="text-[10px] text-muted">Open tasks</div>
              <div className="text-sm font-semibold">{openTasks ?? '—'}</div>
            </div>
            <div className="rounded-md border border-border/60 bg-white/60 dark:bg-slate-900/40 px-2 py-1.5 col-span-2">
              <div className="text-[10px] text-muted">Throughput / wk</div>
              <div className="text-sm font-semibold">{tput ?? '—'}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-t border-border bg-white/60 dark:bg-slate-900/40">
            <div className="min-w-0 flex items-center gap-3">
              <AvatarGroup members={members} />
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${accent.chip}`}>
                <Users className="w-3 h-3" />
                {accent.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">
                <Clock className="inline w-3 h-3 mr-1" />
                {new Date(lastTs).toLocaleDateString()}
              </span>

              {/* SHIP BUTTON */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShip(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 text-xs font-medium text-white shadow-md hover:shadow-lg transition-all hover:scale-105 focus-ring"
                aria-label={`Ship project ${project.title}`}
              >
                <Rocket className="w-3.5 h-3.5" />
                Ship
              </button>
            </div>
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
        </div>
      </motion.div>

      <ShipCelebration
        project={project}
        open={showShip}
        onClose={() => setShowShip(false)}
      />
    </>
  );
}