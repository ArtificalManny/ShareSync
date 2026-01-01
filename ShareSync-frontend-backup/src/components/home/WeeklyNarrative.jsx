import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { TrendingUp, TrendingDown, Minus, Sparkles, Lightbulb } from 'lucide-react';

export default function WeeklyNarrative() {
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchNarrative() {
      try {
        const response = await api.get('/users/weekly-narrative');
        setNarrative(response.data);
      } catch (error) {
        console.error('Failed to fetch narrative:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchNarrative();
  }, []);
  
  if (loading) {
    return (
      <div className="modern-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="skeleton h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-text w-1/3" />
            <div className="skeleton-text w-2/3" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!narrative) return null;
  
  const TrendIcon = 
    narrative.shipCount?.direction === 'up' ? TrendingUp :
    narrative.shipCount?.direction === 'down' ? TrendingDown :
    Minus;
  
  const trendColor = 
    narrative.shipCount?.direction === 'up' ? 'text-emerald-500' :
    narrative.shipCount?.direction === 'down' ? 'text-amber-500' :
    'text-slate-400';
  
  return (
    <div className="modern-card p-6 bg-gradient-to-br from-primary-50/50 to-fuchsia-50/50 dark:from-primary-500/5 dark:to-fuchsia-500/5">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex-shrink-0">
          <TrendIcon className={`w-5 h-5 ${trendColor}`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              This Week So Far
            </h3>
          </div>
          
          {/* Narrative */}
          <div className="space-y-2 body-text text-sm">
            <p>{narrative.shipCount?.text || 'No activity this week yet.'}</p>
            {narrative.peakTime?.text && (
              <p className="text-slate-600 dark:text-slate-400">{narrative.peakTime.text}</p>
            )}
          </div>
          
          {/* Prediction */}
          {narrative.prediction?.text && (
            <>
              <div className="divider-modern my-4" />
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary-50 dark:bg-primary-500/10">
                <Lightbulb className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {narrative.prediction.text}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
