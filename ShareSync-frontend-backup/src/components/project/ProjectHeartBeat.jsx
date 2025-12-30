import React, { useState, useEffect } from 'react';
import { Activity, Users, CheckCircle, Clock, Zap, TrendingUp } from 'lucide-react';
import api from '../../api/client';

export default function ProjectHeartbeat({ projectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeartbeat = async () => {
      try {
        const response = await api.get(`/projects/${projectId}/heartbeat`);
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch heartbeat:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchHeartbeat();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 animate-pulse">
        <div className="h-40 bg-slate-700/50 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const {
    shipsThisWeek,
    activeMembers,
    totalMembers,
    avgFocusPerDay,
    onTimePercentage,
    peakDays,
    peakTime,
    coWorkingMultiplier,
    userDaysSinceShip,
    streakDays
  } = data;

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-pink-400" />
        <h3 className="text-lg font-semibold">Project Heartbeat</h3>
        <span className="text-xs text-slate-400">(This Week)</span>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{shipsThisWeek}</div>
          <div className="text-xs text-slate-400">Ships</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {activeMembers}/{totalMembers}
          </div>
          <div className="text-xs text-slate-400">Active</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{avgFocusPerDay?.toFixed(1) || 0}/day</div>
          <div className="text-xs text-slate-400">Focus hrs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{onTimePercentage}%</div>
          <div className="text-xs text-slate-400">On-time</div>
        </div>
      </div>

      {/* Team Rhythm Insight */}
      <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-indigo-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-200">Team rhythm:</p>
            <p className="text-sm text-slate-300">
              Most ships: <span className="text-purple-400 font-semibold">{peakDays?.join('/') || 'N/A'} {peakTime}</span>
            </p>
          </div>
        </div>

        {coWorkingMultiplier > 1 && (
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 text-emerald-400 mt-0.5" />
            <p className="text-sm text-slate-300">
              Co-working → <span className="text-emerald-400 font-semibold">{coWorkingMultiplier}× more completions</span> vs solo
            </p>
          </div>
        )}
      </div>

      {/* Personal Nudge */}
      {userDaysSinceShip > 1 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-orange-400 mt-0.5" />
            <div>
              <p className="text-sm text-orange-300">
                ⚠️ You haven't shipped in <span className="font-semibold">{userDaysSinceShip} days</span>
              </p>
              <p className="text-xs text-orange-400 mt-1">
                One tiny task will protect the {streakDays}d streak
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
