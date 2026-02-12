import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPublicProjectStatus } from "../api/public";
import { ArrowLeft } from "lucide-react";
import GradientText from "../components/ui/GradientText.jsx";
import { labelledTimestamp, formatLongDateTime } from "../utils/formatters.js";

// ✅ Frontend-only follow UI (no backend changes)
import FollowButton from "../components/follow/FollowButton.jsx";

/** Simple KPI card */
function Kpi({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
        {value}
      </div>
      {hint ? <div className="text-[11px] text-slate-500 mt-1">{hint}</div> : null}
    </div>
  );
}

/** Compact activity row (public-safe) */
function ActivityRow({ a }) {
  const when = a?.createdAt ? formatLongDateTime(a.createdAt) : "";
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" aria-hidden />
      <div className="min-w-0">
        <div className="text-sm text-slate-800 dark:text-slate-100 break-words">
          {a?.text || a?.type || "Update"}
        </div>
        <div className="text-[11px] text-slate-500">{when}</div>
      </div>
    </div>
  );
}

function getTokenAny() {
  try {
    return (
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      ""
    );
  } catch {
    return "";
  }
}

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

  const title = data?.title || data?.name || "Project";
  const updated = data?.lastUpdatedAt ? labelledTimestamp(data.lastUpdatedAt, "Updated") : null;

  const onTimePct =
    typeof data?.kpis?.onTime30d === "number"
      ? `${Math.round(data.kpis.onTime30d * 100)}%`
      : "—";

  // ✅ Defensive: try to find an actual project id in several plausible places
  const projectId = useMemo(() => {
    return (
      data?.projectId ||
      data?.project?.id ||
      data?.project?._id ||
      data?.id ||
      data?._id ||
      null
    );
  }, [data]);

  const signedIn = Boolean(getTokenAny());

  return (
    <main id="main" role="main" tabIndex={-1}>
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto min-h-screen bg-ink-100/40 dark:bg-gray-900">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display">
              <GradientText variant="cnbc">{title}</GradientText>
            </h1>
            <p className="mt-1 timestamp">
              <span className="prefix">Read-only</span>
              <span className="dot" />
              {updated || "Updated just now"}
            </p>
          </div>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:underline"
            aria-label="Back to OpenShare"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to OpenShare
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
          <>
            {/* ✅ Follow updates (frontend-only, safe) */}
            <section className="mb-4 rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Follow updates
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Get notified when this project ships progress (requires sign-in).
                  </div>
                </div>

                {projectId && signedIn ? (
                  <FollowButton
                    projectId={projectId}
                    projectName={title}
                    size="md"
                    variant="emerald"
                  />
                ) : (
                  <div className="text-xs text-slate-500 text-right">
                    {signedIn ? (
                      <span>Follow not available for this link.</span>
                    ) : (
                      <span>Sign in to follow.</span>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* KPIs */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Kpi label="On-time (30d)" value={onTimePct} hint="Share of work finished on schedule" />
              <Kpi label="Throughput / wk" value={data.kpis?.throughputPerWeek ?? "—"} />
              <Kpi label="Active days (28d)" value={data.kpis?.activeDays28d ?? "—"} />
              <Kpi label="Cadence (14d)" value={data.kpis?.cadence14d ?? "—"} />
            </section>

            {/* Activity */}
            {Array.isArray(data.activity) && data.activity.length > 0 ? (
              <section className="mt-6 rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Recent activity
                </h2>
                <div className="mt-2 divide-y divide-slate-200/70 dark:divide-slate-800">
                  {data.activity.map((a, i) => (
                    <ActivityRow key={i} a={a} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}

        {/* Footer note */}
        <footer className="mt-6 text-[11px] text-slate-500">
          Powered by OpenShare — transparent project snapshots without sign-in.
        </footer>
      </div>
    </main>
  );
}
