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
    focusWindow: { start: '9:00 PM', end: '11:00 PM', productivity: '3x', reason: 'You ship 3x more during this time', isCurrent: false },
    highEnergyTasks: [
      { id: 1, title: 'Build authentication flow', project: 'Mobile App', estimatedTime: '2h', complexity: 'high', icon: '⚡' },
      { id: 2, title: 'Design dashboard mockups', project: 'ShareSync', estimatedTime: '1h', complexity: 'medium', icon: '🎨' }
    ],
    coworkOpportunities: [],
    riskAlerts: [],
    loading: true
  });

  useEffect(() => { fetchDailyPlan(); }, []);

  const fetchDailyPlan = async () => {
    try {
      const data = await ecosystemApi.getDailyPlan();
      if (data) {
        setPlan({ greeting: data.greeting, timeOfDay: data.timeOfDay, focusWindow: data.focusWindow, currentEnergy: data.currentEnergy, highEnergyTasks: data.highEnergyTasks || [], coworkOpportunities: data.coworkOpportunities || [], riskAlerts: data.riskAlerts || [], loading: false });
      } else {
        setPlan(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error(error);
      setPlan(prev => ({ ...prev, loading: false }));
    }
  };

  const getGreetingEmoji = (timeOfDay) => {
    switch(timeOfDay) { case 'morning': return '🌅'; case 'afternoon': return '☀️'; case 'evening': return '🌙'; case 'night': return '🌃'; default: return '👋'; }
  };

  const getTaskIcon = (task) => task.icon || '📌';

  if (plan.loading) {
    return (
      <div className="bg-white dark:bg-surface-1 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 mb-6 shadow-sm">
        <div className="h-28 bg-slate-100 dark:bg-surface-2 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="bg-white dark:bg-surface-1 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 mb-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-violet-600 dark:text-brand" />
          <h3 className="font-bold text-slate-800 dark:text-text-primary text-sm">Your Plan</h3>
        </div>

        {plan.focusWindow && (
          <div className="bg-violet-50 dark:bg-brand/10 border border-violet-100 dark:border-brand/20 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-violet-600 dark:text-brand" />
              <span className="text-xs font-bold text-slate-800 dark:text-text-primary uppercase tracking-wider">
                {plan.focusWindow.isCurrent ? 'Focus Now' : 'Next Focus Window'}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-text-secondary">{plan.focusWindow.start} - {plan.focusWindow.end}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-text-tertiary mt-1">{plan.focusWindow.reason}</p>
          </div>
        )}

        {plan.highEnergyTasks.length > 0 && (
          <div className="space-y-2">
            {plan.highEnergyTasks.slice(0, 2).map((task, idx) => (
              <button key={idx} className="w-full bg-slate-50 dark:bg-surface-0 border border-slate-100 dark:border-white/[0.04] hover:bg-slate-100 dark:hover:bg-surface-2 hover:border-slate-200 dark:hover:border-white/[0.08] rounded-xl p-3.5 text-left transition-all active:scale-[0.98]" onClick={() => task.projectId && navigate(`/projects/${task.projectId}`)}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">{getTaskIcon(task)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-text-primary truncate">{task.title}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-text-tertiary mt-0.5">{task.project} <span className="text-slate-300 mx-1">•</span> {task.estimatedTime}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-1 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 dark:bg-brand/10 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-violet-600 dark:text-brand" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-text-primary text-base leading-tight">Your Plan for Today</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-text-tertiary">AI-powered recommendations</p>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-violet-400 dark:text-brand" />
      </div>

      <div className="mb-6">
        <h4 className="text-xl font-bold text-slate-800 dark:text-text-primary">
          {plan.greeting} <span className="ml-1">{getGreetingEmoji(plan.timeOfDay)}</span>
        </h4>
      </div>

      {plan.focusWindow && (
        <div className="bg-violet-50 dark:bg-brand/10 border border-violet-100 dark:border-brand/20 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-violet-600 dark:text-brand" />
            <span className="font-bold text-slate-800 dark:text-text-primary text-xs uppercase tracking-wider">
              {plan.focusWindow.isCurrent ? 'Your Focus Window (Now)' : 'Your Next Focus Window'}
            </span>
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-text-primary mb-1">
            {plan.focusWindow.start} - {plan.focusWindow.end}
          </p>
          <p className="text-sm font-medium text-slate-600 dark:text-text-secondary">
            {plan.focusWindow.reason}
          </p>
          {plan.focusWindow.productivity && (
            <p className="text-xs font-bold text-violet-600 dark:text-brand mt-3 inline-flex items-center bg-violet-100 dark:bg-brand/20 px-2 py-1 rounded-md">
              <TrendingUp className="w-3 h-3 mr-1" />
              {plan.focusWindow.productivity} productivity boost
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-orange-500 dark:text-warning" />
            <h5 className="font-bold text-slate-800 dark:text-text-primary text-sm">Recommended Tasks</h5>
          </div>
          {plan.highEnergyTasks.length > 0 ? (
            <div className="space-y-3">
              {plan.highEnergyTasks.map((task, idx) => (
                <button key={idx} className="group w-full bg-slate-50 dark:bg-surface-0 border border-slate-100 dark:border-white/[0.04] hover:bg-slate-100 dark:hover:bg-surface-2 hover:border-slate-200 dark:hover:border-white/[0.08] rounded-xl p-4 text-left transition-all active:scale-[0.98]" onClick={() => task.projectId && navigate(`/projects/${task.projectId}`)}>
                  <div className="flex items-start gap-4">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{getTaskIcon(task)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-text-primary text-sm group-hover:text-violet-600 dark:group-hover:text-brand transition-colors">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-text-tertiary">
                        <span>{task.project}</span>
                        <span className="opacity-30">•</span>
                        <span>{task.estimatedTime}</span>
                      </div>
                      {task.reason && (
                        <p className="text-xs font-medium text-slate-500 dark:text-text-tertiary mt-2">{task.reason}</p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-text-tertiary group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-surface-0 border border-dashed border-slate-200 dark:border-white/[0.06] rounded-xl p-6 text-center">
              <p className="text-sm font-bold text-slate-500 dark:text-text-tertiary">No tasks recommended right now</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {plan.coworkOpportunities && plan.coworkOpportunities.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-emerald-500 dark:text-success" />
                <h5 className="font-bold text-slate-800 dark:text-text-primary text-sm">Co-work Opportunity</h5>
              </div>
              {plan.coworkOpportunities.map((opp, idx) => (
                <div key={idx} className="bg-emerald-50 dark:bg-success/10 border border-emerald-100 dark:border-success/20 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-success/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-600 dark:text-success">{opp.userName?.[0] || 'U'}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-text-primary text-sm">{opp.userName} is available</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-text-tertiary uppercase tracking-wider mt-0.5">{opp.project}</p>
                    </div>
                  </div>
                  <button className="w-full mt-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-sm text-white transition-all active:scale-95 shadow-sm">
                    Schedule Session
                  </button>
                </div>
              ))}
            </div>
          )}

          {plan.riskAlerts && plan.riskAlerts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-danger" />
                <h5 className="font-bold text-slate-800 dark:text-text-primary text-sm">Attention Needed</h5>
              </div>
              {plan.riskAlerts.map((alert, idx) => (
                <div key={idx} className="bg-red-50 dark:bg-danger/10 border border-red-100 dark:border-danger/20 rounded-xl p-5">
                  <p className="font-bold text-slate-800 dark:text-text-primary text-sm mb-3">"{alert.projectName}"</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-slate-500 dark:text-text-tertiary">Deadline in {alert.deadline}</span>
                      <span className="text-red-500 dark:text-danger">{alert.progress}% complete</span>
                    </div>
                    <div className="h-2 bg-red-100 dark:bg-surface-2 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 dark:bg-danger rounded-full" style={{ width: `${alert.progress}%` }} />
                    </div>
                  </div>
                  <button className="w-full mt-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-sm text-white transition-all active:scale-95 shadow-sm" onClick={() => alert.projectId && navigate(`/projects/${alert.projectId}`)}>
                    View Project
                  </button>
                </div>
              ))}
            </div>
          )}

          {(!plan.coworkOpportunities || plan.coworkOpportunities.length === 0) && (!plan.riskAlerts || plan.riskAlerts.length === 0) && (
            <div className="bg-slate-50 dark:bg-surface-0 border border-dashed border-slate-200 dark:border-white/[0.06] rounded-xl p-8 text-center h-[calc(Available-2rem)] flex flex-col justify-center items-center">
              <Sparkles className="w-8 h-8 text-emerald-500 dark:text-success mb-3" />
              <p className="text-base font-bold text-slate-700 dark:text-text-secondary">All clear! 🎉</p>
              <p className="text-xs font-medium text-slate-500 dark:text-text-tertiary mt-1">No urgent items require your attention.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdaptiveAIPlan;
