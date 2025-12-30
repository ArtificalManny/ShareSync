import React, { useState, useEffect } from 'react';
import { Scale, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import api from '../../api/client';

export default function WorkBalanceGauge({ projectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await api.get(`/projects/${projectId}/work-balance`);
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch work balance:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchBalance();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 animate-pulse">
        <div className="h-48 bg-slate-700/50 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const { distribution, status, message, giniCoefficient } = data;

  // Color based on fairness
  const getStatusColor = () => {
    if (status === 'balanced') return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle };
    if (status === 'moderate') return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', icon: AlertTriangle };
    return { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', icon: AlertTriangle };
  };

  const statusColor = getStatusColor();
  const StatusIcon = statusColor.icon;

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold">Work Balance</h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Gini Coefficient</div>
          <div className={`text-sm font-semibold ${statusColor.text}`}>
            {giniCoefficient?.toFixed(2) || 'N/A'}
          </div>
        </div>
      </div>

      {/* Distribution Bars */}
      {distribution && distribution.length > 0 ? (
        <div className="space-y-3 mb-4">
          {distribution.map((member, index) => {
            // Color gradient based on rank
            const getBarColor = (idx) => {
              if (idx === 0) return 'from-purple-500 to-fuchsia-500';
              if (idx === 1) return 'from-blue-500 to-cyan-500';
              if (idx === 2) return 'from-emerald-500 to-green-500';
              return 'from-slate-500 to-slate-600';
            };

            return (
              <div key={member.userId || index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        alt={member.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold">
                        {member.name?.[0] || 'U'}
                      </div>
                    )}
                    <span className="font-medium">{member.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{member.ships} ships</span>
                    <span className="font-semibold">{member.percentage?.toFixed(0) || 0}%</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${getBarColor(index)} transition-all duration-500`}
                    style={{ width: `${member.percentage || 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          <p className="text-sm">No work distribution data yet</p>
        </div>
      )}

      {/* Status Message */}
      <div className={`${statusColor.bg} border ${statusColor.border} rounded-xl p-4`}>
        <div className="flex items-start gap-2">
          <StatusIcon className={`w-4 h-4 ${statusColor.text} mt-0.5`} />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${statusColor.text}`}>
              {status === 'balanced' ? '✅ Balanced' : status === 'moderate' ? '⚡ Moderate Concentration' : '⚠️ Heavy Concentration'}
            </p>
            <p className="text-sm text-slate-300 mt-1">
              💡 {message}
            </p>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-400">
          <strong>How it works:</strong> A Gini coefficient of 0 = perfect equality, 1 = one person did everything. 
          Below 0.4 is balanced, 0.4-0.6 is moderate, above 0.6 suggests work concentration.
        </p>
      </div>
    </div>
  );
}
