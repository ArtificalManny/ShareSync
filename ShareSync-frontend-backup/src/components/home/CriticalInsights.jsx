import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Users, Clock, Target, Flame, Lightbulb } from 'lucide-react';
import api from '../../api/client';

export default function CriticalInsights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        // Fetch from multiple endpoints
        const [momentum, predictions] = await Promise.all([
          api.get('/users/momentum'),
          api.get('/insights/predictions')
        ]);

        const criticalInsights = [];

        // INSIGHT 1: Streak at risk
        const streakDays = momentum.data?.breakdown?.currentStreak || 0;
        const shipsToday = momentum.data?.breakdown?.shipsToday || 0;
        if (streakDays >= 3 && shipsToday === 0) {
          criticalInsights.push({
            type: 'warning',
            icon: Flame,
            color: 'red',
            message: `You've shipped 0 tasks today - your ${streakDays}-day streak is at risk`,
            action: 'Ship one quick task',
            priority: 10
          });
        }

        // INSIGHT 2: Workload imbalance (from profile analytics)
        // This would need backend support - placeholder for now
        const workloadPercent = 71; // TODO: Calculate from project data
        if (workloadPercent > 60) {
          criticalInsights.push({
            type: 'warning',
            icon: Users,
            color: 'amber',
            message: `You're doing ${workloadPercent}% of your team's work - this is unsustainable`,
            action: 'Review team balance',
            priority: 9
          });
        }

        // Co-working multiplier insight is intentionally omitted until
        // profile analytics has a real backend contract.

        // INSIGHT 4: Predictions from AI
        if (predictions.data?.length > 0) {
          predictions.data.forEach(pred => {
            criticalInsights.push({
              type: 'info',
              icon: Target,
              color: 'blue',
              message: pred.message,
              action: 'Take action',
              priority: pred.confidence * 10
            });
          });
        }

        // INSIGHT 5: Peak time window
        const currentHour = new Date().getHours();
        const isPeakTime = (currentHour >= 14 && currentHour <= 16);
        if (isPeakTime) {
          criticalInsights.push({
            type: 'success',
            icon: Clock,
            color: 'purple',
            message: "It's 2pm - your peak productivity window for the next 90 minutes",
            action: 'Start deep work',
            priority: 8
          });
        }

        // Sort by priority and take top 2
        const topInsights = criticalInsights
          .sort((a, b) => b.priority - a.priority)
          .slice(0, 2);

        setInsights(topInsights);
      } catch (error) {
        console.error('Failed to fetch critical insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
    const interval = setInterval(fetchInsights, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;
  if (insights.length === 0) return null;

  const getColorClasses = (color) => {
    const colors = {
      red: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400',
      amber: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400',
      blue: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400',
      purple: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-3">
      {insights.map((insight, idx) => {
        const Icon = insight.icon;
        return (
          <div 
            key={idx}
            className={`modern-card p-4 border-l-4 ${getColorClasses(insight.color)} animate-slide-up`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-1">
                  {insight.message}
                </p>
                <button 
                  className="text-xs font-medium underline hover:no-underline"
                  onClick={() => {/* TODO: Navigate to relevant page */}}
                >
                  {insight.action} →
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
