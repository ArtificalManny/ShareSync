// /src/components/project/YourProjectsPanel.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, ChevronRight } from "lucide-react";

// Utility to convert to "3d ago", "2h ago"
const getRelativeTime = (dateStr) => {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);

  const units = [
    { label: "d", secs: 86400 },
    { label: "h", secs: 3600 },
    { label: "m", secs: 60 },
  ];

  for (const unit of units) {
    const value = Math.floor(diff / unit.secs);
    if (value >= 1) return `${value}${unit.label} ago`;
  }
  return "Just now";
};

export default function YourProjectsPanel({ projects = [] }) {
  return (
    <section
      aria-label="Your projects"
      className={[
        "rounded-2xl shadow-sm overflow-hidden",
        "bg-gradient-to-br from-indigo-50 via-white to-sky-50",
        "dark:from-slate-900 dark:via-slate-900 dark:to-slate-900",
        "border border-slate-200/70 dark:border-slate-700",
        "ring-1 ring-indigo-200/60 dark:ring-indigo-400/20",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-5 py-3">
        <div className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Your Projects
          </h2>
        </div>
      </div>

      {/* Grid */}
      <div className="px-3 sm:px-4 md:px-5 pb-4">
        {projects.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400 py-6">
            You haven’t joined any projects yet.
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list">
            {projects.map((project) => (
              <li key={project._id}>
                <Link
                  to={`/projects/${project._id}`}
                  className={[
                    "motion-quick group relative block rounded-2xl",
                    "bg-white/90 dark:bg-slate-900/90",
                    "border border-slate-200/70 dark:border-slate-700",
                    "hover:shadow-md focus:shadow-md",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500",
                    "p-4"
                  ].join(" ")}
                  aria-label={`Open project ${project.title || "Untitled"}`}
                >
                  {/* Accent bar */}
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 h-full w-[6px] rounded-l-2xl bg-gradient-to-b from-indigo-500 to-sky-500"
                  />

                  <div className="flex items-start gap-3">
                    <span
                      className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-slate-200/70 dark:ring-slate-700 bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300 shrink-0"
                      aria-hidden="true"
                    >
                      <Briefcase className="h-4 w-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {project.title || "Untitled"}
                        </h3>
                        <ChevronRight
                          className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                          aria-hidden="true"
                        />
                      </div>

                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {project.description || "No description provided"}
                      </p>

                      <p className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400">
                        Last updated: {getRelativeTime(project.updatedAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}