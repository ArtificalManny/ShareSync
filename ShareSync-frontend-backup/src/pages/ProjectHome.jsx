// /src/pages/ProjectHome.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";

function timeAgo(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.max(0, Date.now() - (d?.getTime?.() || Date.now()));
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dys = Math.floor(h / 24);
  if (dys < 30) return `${dys}d ago`;
  const mo = Math.floor(dys / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(mo / 12);
  return `${y}y ago`;
}

export default function ProjectHome() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/projects/${id}`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!ignore) setProject(data);
      } catch (e) {
        if (!ignore) setError("Failed to load project.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  const updatedAt = useMemo(
    () =>
      new Date(
        project?.updatedAt || project?.lastActivityAt || project?.createdAt || Date.now()
      ),
    [project?.updatedAt, project?.lastActivityAt, project?.createdAt]
  );

  return (
    <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Top bar */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {project?.title || (loading ? "Loading…" : "Project")}
          </h1>
          {project?.category && (
            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
              {project.category}
            </div>
          )}
        </div>
        <Link
          to="/projects"
          className="rounded-full border px-3 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Back to Projects"
        >
          Back
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto space-y-4">
        {loading && (
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 animate-pulse">
            <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
            <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        )}

        {!!error && !loading && (
          <div className="rounded-2xl p-4 bg-white dark:bg-slate-800 border border-rose-200/60 dark:border-rose-400/20">
            <p className="text-rose-600 dark:text-rose-400">{error}</p>
          </div>
        )}

        {!loading && !error && project && (
          <>
            <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Overview</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {project.description || "No description."}
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border p-3">
                  <div className="text-slate-500">Status</div>
                  <div className="font-medium">{project.status || "Not Started"}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-slate-500">Privacy</div>
                  <div className="font-medium">{project.privacy || "Private"}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-slate-500">Updated</div>
                  <div className="font-medium">{timeAgo(updatedAt)}</div>
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Members</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(project.members || []).length === 0 && (
                  <span className="text-sm text-slate-500">No members yet.</span>
                )}
                {(project.members || []).map((m, i) => {
                  const label = m?.username || m?.email || "Member";
                  const initials =
                    (label.replace(/@.*$/, "").match(/[A-Za-z]/g) || [])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "??";
                  return (
                    <div
                      key={`${label}-${i}`}
                      title={label}
                      className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-medium border border-white shadow-sm"
                    >
                      {initials}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}