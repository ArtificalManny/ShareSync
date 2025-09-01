// /src/pages/PublicProjectStatus.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPublicProjectStatus } from "../api/public";
import StatusCard from "../components/public/StatusCard";
import { ArrowLeft } from "lucide-react";

export default function PublicProjectStatus() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetchPublicProjectStatus(token);
        if (!ignore) setData(res || null);
      } catch (e) {
        if (!ignore) setErr(e?.message || "Unable to load project status.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [token]);

  return (
    <main id="main" role="main" tabIndex={-1}>
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto min-h-screen bg-ink-100/40 dark:bg-gray-900">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Project Status
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Read-only snapshot for transparency. Last 7–30 days.
            </p>
          </div>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:underline"
            aria-label="Back to ShareSync"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to ShareSync
          </Link>
        </header>

        {/* Body */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 p-6 animate-pulse">
            <div className="h-6 w-40 rounded bg-slate-200/70 dark:bg-slate-800 mb-4" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 rounded bg-slate-200/70 dark:bg-slate-800" />
              <div className="h-20 rounded bg-slate-200/70 dark:bg-slate-800" />
            </div>
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-rose-200/70 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-sm font-semibold text-rose-600">Couldn’t load status</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{err}</p>
            <p className="mt-2 text-xs text-slate-500">
              Make sure the public link is valid and has not been revoked.
            </p>
          </div>
        ) : !data ? (
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No data available for this public status link.
            </p>
          </div>
        ) : (
          <StatusCard
            title={data.title}
            owner={data.owner}
            lastUpdatedAt={data.lastUpdatedAt}
            kpis={data.kpis}
            summary={data.summary}
          />
        )}

        {/* Footer note */}
        <footer className="mt-6 text-[11px] text-slate-500">
          Powered by ShareSync — transparent project snapshots without sign-in.
        </footer>
      </div>
    </main>
  );
}
