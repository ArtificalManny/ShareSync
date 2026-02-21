import React, { useState, useEffect } from 'react';
import { Flask, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '../../api/client';

export default function ExperimentHistory() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        const response = await api.get('/experiments');
        setExperiments(response.data);
      } catch (error) {
        console.error('Failed to fetch experiments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiments();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'abandoned':
        return <XCircle className="w-4 h-4 text-slate-400" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 animate-pulse">
        <div className="h-40 bg-slate-700/50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Flask className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold">Your Experiments</h3>
      </div>

      {experiments.length === 0 ? (
        <div className="text-center py-8">
          <Flask className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">No experiments yet</p>
          <p className="text-sm text-slate-500">Start tracking what works for you!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiments.map((exp) => (
            <div
              key={exp._id}
              className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(exp.status)}
                    <h4 className="font-semibold text-white">{exp.name}</h4>
                  </div>
                  <p className="text-sm text-slate-400">{exp.hypothesis}</p>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(exp.startDate).toLocaleDateString()}
                </div>
              </div>

              {exp.settings && (
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-700/50">
                  <div className="text-xs">
                    <span className="text-slate-500">Control:</span>
                    <p className="text-slate-300 mt-1">{exp.settings.control}</p>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500">Variation:</span>
                    <p className="text-slate-300 mt-1">{exp.settings.variation}</p>
                  </div>
                </div>
              )}

              {exp.results && (
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm text-emerald-300 font-semibold mb-1">
                    Result: {exp.results.winner === 'variation' ? '✅ Experiment won!' : exp.results.winner === 'control' ? '⚠️ Original was better' : '➖ No clear difference'}
                  </p>
                  <p className="text-xs text-slate-400">{exp.results.recommendation}</p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{exp.dataPoints?.length || 0} data points</span>
                <span className="capitalize">{exp.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}