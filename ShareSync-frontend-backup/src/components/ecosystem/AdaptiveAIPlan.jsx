// src/components/ecosystem/AdaptiveAIPlan.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 5: Quiet Confidence
// ═══════════════════════════════════════════════════════════════════════════════
// FIXED: Hardcoded slate/purple colors → Design tokens
// FIXED: Gradients everywhere → Simple backgrounds
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  Brain, Clock, Zap, Users, AlertCircle, ChevronRight,
  Calendar, Target, Sparkles, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useMobile';
import ecosystemApi from '../../services/ecosystemApi';

const AdaptiveAIPlan = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [plan, setPlan] = useState({
    greeting: 'Good evening, Manny!',
    timeOfDay: 'evening',
    focusWindow: {
      start: '9:00 PM',
      end: '11:00 PM',
      productivity: '3x',
      reason: 'You ship 3x more during this time',
      isCurrent: false
    },
    highEnergyTasks: [
      {
        id: 1,
        title: 'Build authentication flow',
        project: 'Mobile App',
        estimatedTime: '2h',
        complexity: 'high',
        icon: '⚡'
      },
      {
        id: 2,
        title: 'Design dashboard mockups',
        project: 'ShareSync',
        estimatedTime: '1h',
        complexity: 'medium',
        icon: '🎨'
      }
    ],
    coworkOpportunities: [],
    riskAlerts: [],
    loading: true
  });

  useEffect(() => {
    fetchDailyPlan();
  }, []);

  const fetchDailyPlan = async () => {
    try {
      const data = await ecosystemApi.getDailyPlan();
      if (data) {
        setPlan({
          greeting: data.greeting,
          timeOfDay: data.timeOfDay,
          focusWindow: data.focusWindow,
          currentEnergy: data.currentEnergy,
          highEnergyTasks: data.highEnergyTasks || [],
          coworkOpportunities: data.coworkOpportunities || [],
          riskAlerts: data.riskAlerts || [],
          loading: false
        });
      } else {
        setPlan(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Failed to fetch daily plan:', error);
      setPlan(prev => ({ ...prev, loading: false }));
    }
  };

  const getGreetingEmoji = (timeOfDay) => {
    switch(timeOfDay) {
      case 'morning': return '��';
      case 'afternoon': return '☀️';
      case 'evening': return '🌙';
      case 'night': return '🌃';
      default: return '👋';
    }
  };

  const getTaskIcon = (task) => task.icon || '📌';

  /* ─────────────────────────────────────────────────────────────────────────
     LOADING STATE
  ───────────────────────────────────────────────────────────────────────── */
  if (plan.loading) {
    return (
      <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5 mb-4">
        <div className="h-28 bg-surface-2 rounded-lg animate-pulse" />
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     MOBILE VERSION
  ───────────────────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-brand" />
          <h3 className="font-medium text-text-primary text-sm">Your Plan</h3>
        </div>

        {/* Focus Window */}
        {plan.focusWindow && (
          <div className="bg-brand/10 border border-brand/20 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-brand" />
              <span className="text-xs font-medium text-text-primary">
                {plan.focusWindow.isCurrent ? 'Focus Now' : 'Next Focus Window'}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              {plan.focusWindow.start} - {plan.focusWindow.end}
            </p>
            <p className="text-xs text-text-tertiary mt-1">{plan.focusWindow.reason}</p>
          </div>
        )}

        {/* Quick Tasks */}
        {plan.highEnergyTasks.length > 0 && (
          <div className="space-y-2">
            {plan.highEnergyTasks.slice(0, 2).map((task, idx) => (
              <button
                key={idx}
                className="w-full bg-surface-0 border border-white/[0.04] hover:bg-surface-2 hover:border-white/[0.08] rounded-lg p-3 text-left transition-all active:scale-[0.98]"
                onClick={() => task.projectId && navigate(`/projects/${task.projectId}`)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base">{getTaskIcon(task)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{task.title}</p>
                    <p className="text-xs text-text-tertiary">{task.project} · {task.estimatedTime}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     DESKTOP VERSION
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand/10 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary text-sm">Your Plan for Today</h3>
            <p className="text-xs text-text-tertiary">AI-powered recommendations</p>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-brand" />
      </div>

      {/* Greeting */}
      <div className="mb-5">
        <h4 className="text-lg font-medium text-text-primary">
          {plan.greeting} {getGreetingEmoji(plan.timeOfDay)}
        </h4>
      </div>

      {/* Focus Window */}
      {plan.focusWindow && (
        <div className="bg-brand/10 border border-brand/20 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-brand" />
            <span className="font-medium text-text-primary text-sm">
              {plan.focusWindow.isCurrent ? 'Your Focus Window (Now)' : 'Your Next Focus Window'}
            </span>
          </div>
          <p className="text-text-primary mb-1">
            {plan.focusWindow.start} - {plan.focusWindow.end}
          </p>
          <p className="text-sm text-text-secondary">
            {plan.focusWindow.reason}
          </p>
          {plan.focusWindow.productivity && (
            <p className="text-xs font-medium text-brand mt-2">
              {plan.focusWindow.productivity} productivity boost
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* High Energy Tasks */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-warning" />
            <h5 className="font-medium text-text-primary text-sm">Recommended Tasks</h5>
          </div>
          {plan.highEnergyTasks.length > 0 ? (
            <div className="space-y-2">
              {plan.highEnergyTasks.map((task, idx) => (
                <button
                  key={idx}
                  className="group w-full bg-surface-0 border border-white/[0.04] hover:bg-surface-2 hover:border-white/[0.08] rounded-xl p-3 text-left transition-all"
                  onClick={() => task.projectId && navigate(`/projects/${task.projectId}`)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getTaskIcon(task)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary text-sm group-hover:text-brand transition-colors">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-text-tertiary">
                        <span>{task.project}</span>
                        <span className="opacity-50">·</span>
                        <span>{task.estimatedTime}</span>
                      </div>
                      {task.reason && (
                        <p className="text-xs text-text-tertiary mt-1">{task.reason}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-surface-0 border border-white/[0.04] rounded-xl p-5 text-center">
              <p className="text-sm text-text-tertiary">No tasks recommended right now</p>
            </div>
          )}
        </div>

        {/* Co-work & Alerts */}
        <div className="space-y-4">
          {/* Co-work Opportunities */}
          {plan.coworkOpportunities && plan.coworkOpportunities.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-success" />
                <h5 className="font-medium text-text-primary text-sm">Co-work Opportunity</h5>
              </div>
              {plan.coworkOpportunities.map((opp, idx) => (
                <div
                  key={idx}
                  className="bg-success/10 border border-success/20 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-success/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-success">
                        {opp.userName?.[0] || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">{opp.userName} is available</p>
                      <p className="text-xs text-text-tertiary">{opp.project}</p>
                    </div>
                  </div>
                  <button className="w-full mt-2 py-2 bg-success hover:bg-success/80 rounded-lg font-medium text-sm text-white transition-all">
                    Schedule Session
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Risk Alerts */}
          {plan.riskAlerts && plan.riskAlerts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-danger" />
                <h5 className="font-medium text-text-primary text-sm">Attention Needed</h5>
              </div>
              {plan.riskAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="bg-danger/10 border border-danger/20 rounded-xl p-4"
                >
                  <p className="font-medium text-text-primary text-sm mb-2">"{alert.projectName}"</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-tertiary">Deadline in {alert.deadline}</span>
                      <span className="text-danger font-medium">{alert.progress}% complete</span>
                    </div>
                    <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-danger rounded-full"
                        style={{ width: `${alert.progress}%` }}
                      />
                    </div>
                  </div>
                  <button 
                    className="w-full mt-3 py-2 bg-danger hover:bg-danger/80 rounded-lg font-medium text-sm text-white transition-all"
                    onClick={() => alert.projectId && navigate(`/projects/${alert.projectId}`)}
                  >
                    View Project
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {(!plan.coworkOpportunities || plan.coworkOpportunities.length === 0) && 
           (!plan.riskAlerts || plan.riskAlerts.length === 0) && (
            <div className="bg-surface-0 border border-white/[0.04] rounded-xl p-5 text-center">
              <Sparkles className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="text-sm text-text-secondary">All clear! 🎉</p>
              <p className="text-xs text-text-tertiary mt-1">No urgent items right now</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdaptiveAIPlan;
