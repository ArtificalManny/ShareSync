import React, { useState, useEffect } from 'react';
// FIXED: Adjusted relative path to reach the api folder from src/components/insights
import { getProjectInsights } from '../../api/insights';
// FIXED: These components are now in the exact same folder, so we just use ./
import MetricCard from './MetricCard';
import SprintHealth from './SprintHealth';
import TeamBalance from './TeamBalance';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Crunching project data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <p>{error || "No data available."}</p>
      </div>
    );
  }

  const { metrics, teamBalance, aiInsights } = data;

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Project Insights</h2>
          <p className="text-sm text-zinc-400">Velocity, cycle time, and team health.</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-[#18181b] border border-[#27272a] rounded-lg p-1">
          {['7d', '14d', '30d'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                range === r 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* AI Insights Banner (Optional but awesome) */}
      {aiInsights && aiInsights.length > 0 && (
        <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4 flex gap-4 items-start">
          <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          </div>
          <div>
            <h4 className="text-zinc-100 font-semibold text-sm">{aiInsights[0].title}</h4>
            <p className="text-zinc-400 text-sm mt-1">{aiInsights[0].description}</p>
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
          invertTrendColors={true} // Faster is greener
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
    </div>
  );
};

export default InsightsTab;
