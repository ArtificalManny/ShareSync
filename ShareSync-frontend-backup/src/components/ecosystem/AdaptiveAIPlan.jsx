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
  
  // ⭐ State with initial mock data (fallback)
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
        project: 'OpenShare',
        estimatedTime: '1h',
        complexity: 'medium',
        icon: '🎨'
      }
    ],
    coworkOpportunities: [],
    riskAlerts: [],
    loading: true
  });

  // ⭐ Fetch real AI plan from API
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
      case 'morning': return '🌅';
      case 'afternoon': return '☀️';
      case 'evening': return '🌙';
      case 'night': return '🌃';
      default: return '👋';
    }
  };

  const getTaskIcon = (task) => {
    return task.icon || '📌';
  };

  if (plan.loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 mb-6 animate-pulse">
        <div className="h-32 bg-slate-700/50 rounded"></div>
      </div>
    );
  }

  if (isMobile) {
    // Mobile compact version
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-white">Your Plan</h3>
        </div>

        {/* Focus Window */}
        {plan.focusWindow && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">
                {plan.focusWindow.isCurrent ? 'Focus Now' : 'Next Focus Window'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {plan.focusWindow.start} - {plan.focusWindow.end}
            </p>
            <p className="text-xs text-slate-400 mt-1">{plan.focusWindow.reason}</p>
          </div>
        )}

        {/* Quick Tasks */}
        {plan.highEnergyTasks.length > 0 && (
          <div className="space-y-2">
            {plan.highEnergyTasks.slice(0, 2).map((task, idx) => (
              <button
                key={idx}
                className="w-full bg-slate-900/50 border border-slate-700 hover:border-purple-500/50 rounded-xl p-3 text-left transition-all active:scale-95"
                onClick={() => task.projectId && navigate(`/projects/${task.projectId}`)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getTaskIcon(task)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{task.title}</p>
                    <p className="text-xs text-slate-400">{task.project} · {task.estimatedTime}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop full version
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Your Plan for Today</h3>
            <p className="text-sm text-slate-400">AI-powered recommendations</p>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-purple-400" />
      </div>

      {/* Greeting */}
      <div className="mb-6">
        <h4 className="text-xl font-semibold text-white mb-1">
          {plan.greeting} {getGreetingEmoji(plan.timeOfDay)}
        </h4>
      </div>

      {/* Focus Window */}
      {plan.focusWindow && (
        <div className="bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="font-semibold text-white">
              {plan.focusWindow.isCurrent ? 'Your Focus Window (Now)' : 'Your Next Focus Window'}
            </span>
          </div>
          <p className="text-lg text-white mb-1">
            {plan.focusWindow.start} - {plan.focusWindow.end}
          </p>
          <p className="text-sm text-slate-400">
            {plan.focusWindow.reason}
          </p>
          {plan.focusWindow.productivity && (
            <p className="text-xs text-purple-300 font-semibold mt-2">
              {plan.focusWindow.productivity} productivity boost
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Energy Tasks */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h5 className="font-semibold text-white">Recommended Tasks</h5>
          </div>
          {plan.highEnergyTasks.length > 0 ? (
            <div className="space-y-2">
              {plan.highEnergyTasks.map((task, idx) => (
                <button
                  key={idx}
                  className="w-full bg-slate-900/50 border border-slate-700 hover:border-purple-500/50 rounded-xl p-4 text-left transition-all group"
                  onClick={() => task.projectId && navigate(`/projects/${task.projectId}`)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getTaskIcon(task)}</span>
                    <div className="flex-1">
                      <p className="font-medium text-white group-hover:text-purple-400 transition-colors">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                        <span>{task.project}</span>
                        <span>·</span>
                        <span>{task.estimatedTime}</span>
                      </div>
                      {task.reason && (
                        <p className="text-xs text-slate-500 mt-1">{task.reason}</p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-purple-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 text-center">
              <p className="text-sm text-slate-500">No tasks recommended right now</p>
            </div>
          )}
        </div>

        {/* Co-work & Alerts */}
        <div className="space-y-4">
          {/* Co-work Opportunities */}
          {plan.coworkOpportunities && plan.coworkOpportunities.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-emerald-400" />
                <h5 className="font-semibold text-white">Co-work Opportunity</h5>
              </div>
              {plan.coworkOpportunities.map((opp, idx) => (
                <div
                  key={idx}
                  className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-400">
                        {opp.userName?.[0] || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{opp.userName} is available</p>
                      <p className="text-xs text-slate-400">{opp.project}</p>
                    </div>
                  </div>
                  <button className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-sm transition-all">
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
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h5 className="font-semibold text-white">Attention Needed</h5>
              </div>
              {plan.riskAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                >
                  <p className="font-medium text-white mb-2">"{alert.projectName}"</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Deadline in {alert.deadline}</span>
                      <span className="text-red-400 font-semibold">{alert.progress}% complete</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500"
                        style={{ width: `${alert.progress}%` }}
                      />
                    </div>
                  </div>
                  <button 
                    className="w-full mt-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm transition-all"
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
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 text-center">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">All clear! 🎉</p>
              <p className="text-xs text-slate-500 mt-1">No urgent items right now</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdaptiveAIPlan;
