// src/components/insights/InsightsTab.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHTS TAB — Project analytics dashboard with real metrics + Activity Feed
// ✅ Uses /activities/stats for real computed metrics
// ✅ Includes WeeklyMomentumReport ("Spotify Wrapped" card)
// ✅ Includes ActivityFeed showing all project member activity
// ✅ Resilient: Weekly Report + Activity Feed always render even if metrics fail
// ✅ Proper light/dark mode
// ✅ Preserves MetricCard, SprintHealth, TeamBalance sub-components
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { getProjectInsights } from '../../api/insights';
import MetricCard from './MetricCard';
import SprintHealth from './SprintHealth';
import TeamBalance from './TeamBalance';
import ActivityFeed from './ActivityFeed';
import WeeklyMomentumReport from './WeeklyMomentumReport';

const InsightsTab = ({ projectId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('7d');

  useEffect(() => {
    let isMounted = true;

    const fetchInsights = async () => {
      setLoading(true);
      try {
        const payload = await getProjectInsights(projectId, range);
        if (isMounted) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError('Failed to load insights.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInsights();
    return () => { isMounted = false; };
  }, [projectId, range]);

  // ═════════════════════════════════════════════════════════════════════════════
  // RESILIENT LAYOUT: Weekly Report + Activity Feed always render.
  // Metrics section shows loading/error/data states independently.
  // ═════════════════════════════════════════════════════════════════════════════

  const metrics = data?.metrics;
  const teamBalance = data?.teamBalance;
  const aiInsights = data?.aiInsights;

  return (
    <div className="space-y-6 pb-20">

      {/* ✅ Weekly Momentum Report — always renders, fetches its own data */}
      <WeeklyMomentumReport projectId={projectId} embedded />

      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Project Insights</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Velocity, cycle time, and team health.</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-lg p-1">
          {['7d', '14d', '30d'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                range === r
                  ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Section — degrades gracefully */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-slate-500 dark:text-zinc-500">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Loading metrics...</p>
          </div>
        </div>
      ) : error || !metrics ? (
        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 text-center">
          <p className="text-sm text-slate-500 dark:text-zinc-500">
            {error || 'Metrics will appear after more project activity.'}
          </p>
          <button
            onClick={() => { setError(null); setLoading(true); }}
            className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* AI Insights Banner (Optional but awesome) */}
          {aiInsights && aiInsights.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex gap-4 items-start">
              <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              </div>
              <div>
                <h4 className="text-slate-800 dark:text-zinc-100 font-semibold text-sm">{aiInsights[0].title}</h4>
                <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">{aiInsights[0].description}</p>
              </div>
            </div>
          )}

          {/* Top Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Velocity"
              value={metrics.velocity.value}
              trend={metrics.velocity.trend}
              unit={metrics.velocity.unit}
            />
            <MetricCard
              title="Avg Cycle Time"
              value={metrics.cycleTime.value}
              trend={metrics.cycleTime.trend}
              unit={metrics.cycleTime.unit}
              invertTrendColors={true}
            />
            <MetricCard
              title="Completion Rate"
              value={metrics.completionRate.value}
              trend={metrics.completionRate.trend}
              unit={metrics.completionRate.unit}
            />
            <MetricCard
              title="Collaboration"
              value={metrics.collaboration.value}
              trend={metrics.collaboration.trend}
              unit={metrics.collaboration.unit}
            />
          </div>

          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <SprintHealth completionRate={metrics.completionRate.value} />
            </div>
            <div className="lg:col-span-2">
              <TeamBalance teamData={teamBalance} />
            </div>
          </div>
        </>
      )}

      {/* ✅ Activity Feed — always renders, fetches its own data with task fallback */}
      <ActivityFeed projectId={projectId} limit={100} />
    </div>
  );
};

export default InsightsTab;
