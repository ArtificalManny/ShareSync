import React, { useState, useEffect } from 'react';
import { Brain, Lightbulb, TrendingUp, Target } from 'lucide-react';
import api from '../../api/client';

export default function WhatWorksAnalyzer() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await api.get('/experiments/insights/me');
        setInsights(response.data);
      } catch (error) {
        console.error('Failed to fetch insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

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
        <Brain className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold">What Works For You</h3>
      </div>

      {!insights || insights.totalExperiments === 0 ? (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No insights yet</p>
          <p className="text-sm text-slate-500">
            Complete experiments to discover your optimal work patterns
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-300">
                {insights.totalExperiments} experiments completed
              </span>
            </div>
            <p className="text-xs text-slate-400">
              You're actively learning what makes you productive!
            </p>
          </div>

          {/* Discoveries */}
          {insights.discoveries && insights.discoveries.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                Key Discoveries
              </h4>
              <div className="space-y-2">
                {insights.discoveries.map((discovery, index) => (
                  <div
                    key={index}
                    className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3"
                  >
                    <p className="text-sm text-slate-300">{discovery}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Personalized Recommendations
              </h4>
              <div className="space-y-2">
                {insights.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3"
                  >
                    <p className="text-sm text-emerald-300">💡 {rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}