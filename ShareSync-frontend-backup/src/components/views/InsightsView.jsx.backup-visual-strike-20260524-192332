// src/components/views/InsightsView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHTS VIEW: AI-powered analytics dashboard
// Personalized insights, predictive metrics, natural language queries
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  Brain, TrendingUp, TrendingDown, Users, Clock,
  Zap, Target, AlertTriangle, CheckCircle2, Lightbulb,
  BarChart3, PieChart, Activity, ArrowRight, Sparkles,
  MessageSquare, ChevronDown, Download, RefreshCw
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function InsightCard({ insight, onAction, onDismiss }) {
  const getInsightStyle = () => {
    switch (insight.type) {
      case 'success': return { icon: CheckCircle2, color: 'text-success-400', bg: 'bg-success-500/10', border: 'border-success-500/20' };
      case 'warning': return { icon: AlertTriangle, color: 'text-warning-400', bg: 'bg-warning-500/10', border: 'border-warning-500/20' };
      case 'tip': return { icon: Lightbulb, color: 'text-brand-400', bg: 'bg-brand-500/10', border: 'border-brand-500/20' };
      case 'celebration': return { icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
      default: return { icon: Brain, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' };
    }
  };
  
  const style = getInsightStyle();
  const Icon = style.icon;
  
  return (
    <div className={`p-5 rounded-xl ${style.bg} border ${style.border}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${style.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-text-primary mb-1">{insight.title}</h4>
          <p className="text-sm text-text-secondary leading-relaxed">{insight.description}</p>
          
          {insight.actions && insight.actions.length > 0 && (
            <div className="flex items-center gap-3 mt-4">
              {insight.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => onAction?.(insight, action)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${idx === 0 
                      ? `${style.bg} ${style.color} hover:brightness-110` 
                      : 'text-text-tertiary hover:text-text-secondary'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button 
          onClick={() => onDismiss?.(insight)}
          className="text-text-tertiary hover:text-text-secondary transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// METRIC CARD
// ═══════════════════════════════════════════════════════════════════════════════

function MetricCard({ metric }) {
  const isPositive = metric.trend > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <metric.icon className="w-5 h-5 text-brand-400" />
        </div>
        <span className="text-sm text-text-tertiary">{metric.label}</span>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-bold text-text-primary">{metric.value}</div>
          {metric.subtext && (
            <div className="text-xs text-text-tertiary mt-1">{metric.subtext}</div>
          )}
        </div>
        
        {metric.trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-success-400' : 'text-error-400'}`}>
            <TrendIcon className="w-4 h-4" />
            <span>{isPositive ? '+' : ''}{metric.trend}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT HEALTH GAUGE
// ═══════════════════════════════════════════════════════════════════════════════

function SprintHealthGauge({ health, forecast }) {
  const getHealthColor = () => {
    if (health >= 80) return { color: 'text-success-400', ring: '#10B981', label: 'Healthy' };
    if (health >= 60) return { color: 'text-warning-400', ring: '#F59E0B', label: 'Monitor' };
    return { color: 'text-error-400', ring: '#EF4444', label: 'At Risk' };
  };
  
  const style = getHealthColor();
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (health / 100) * circumference;
  
  return (
    <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
      <h3 className="text-sm font-medium text-text-secondary mb-6 uppercase tracking-wide">Sprint Health</h3>
      
      <div className="flex items-center gap-8">
        {/* Gauge */}
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle 
              cx="50" cy="50" r="40" fill="none" stroke={style.ring} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${style.color}`}>{health}%</span>
            <span className="text-xs text-text-tertiary">{style.label}</span>
          </div>
        </div>
        
        {/* Forecast */}
        <div className="flex-1">
          <div className="text-sm text-text-tertiary mb-2">Completion Forecast</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Best case</span>
              <span className="text-sm font-medium text-success-400">{forecast.best}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Likely</span>
              <span className="text-sm font-medium text-warning-400">{forecast.likely}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Worst case</span>
              <span className="text-sm font-medium text-error-400">{forecast.worst}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM BALANCE CHART
// ═══════════════════════════════════════════════════════════════════════════════

function TeamBalanceChart({ team }) {
  return (
    <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">Team Balance</h3>
        <button className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Rebalance →
        </button>
      </div>
      
      <div className="space-y-4">
        {team.map(member => {
          const getBarColor = () => {
            if (member.workload > 100) return 'bg-error-500';
            if (member.workload > 80) return 'bg-warning-500';
            return 'bg-success-500';
          };
          
          return (
            <div key={member.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-sm">
                {member.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-primary">{member.name}</span>
                  <span className={`text-xs font-medium ${member.workload > 100 ? 'text-error-400' : 'text-text-tertiary'}`}>
                    {member.workload}%
                  </span>
                </div>
                <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
                    style={{ width: `${Math.min(member.workload, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI ASSISTANT
// ═══════════════════════════════════════════════════════════════════════════════

function AIAssistant({ onAsk }) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  
  const suggestedQuestions = [
    "Why is velocity down this sprint?",
    "Who's at risk of burnout?",
    "What should we cut to hit deadline?",
    "How does our pace compare to last quarter?",
  ];
  
  const handleAsk = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    // Simulate AI response
    await new Promise(r => setTimeout(r, 1500));
    setResponse({
      text: `Based on the data, velocity dropped 23% primarily due to: 1) Sarah was out 2 days (reduced capacity 15%), 2) API migration had 3 unexpected blockers, 3) Code review backlog grew to 6 items. Recommendation: Add a review-focused day to clear the backlog.`,
    });
    setIsLoading(false);
  };
  
  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 via-brand-500/5 to-transparent border border-purple-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-medium text-text-primary">Ask AI</h3>
          <p className="text-xs text-text-tertiary">Get insights about your project</p>
        </div>
      </div>
      
      {/* Input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Ask anything about this project..."
          className="w-full px-4 py-3 rounded-xl bg-surface-0/60 border border-white/[0.08] text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-purple-500/30"
        />
        <button
          onClick={handleAsk}
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-400 disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {/* Suggested questions */}
      {!response && (
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(q)}
              className="px-3 py-1.5 rounded-lg bg-surface-0/40 text-xs text-text-tertiary hover:text-text-secondary hover:bg-surface-0/60 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}
      
      {/* Response */}
      {response && (
        <div className="p-4 rounded-xl bg-surface-0/60 border border-white/[0.06]">
          <p className="text-sm text-text-secondary leading-relaxed">{response.text}</p>
          <button 
            onClick={() => setResponse(null)}
            className="mt-3 text-xs text-purple-400 hover:text-purple-300"
          >
            Ask another question
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function InsightsView({ projectId }) {
  const [timeRange, setTimeRange] = useState('sprint');
  
  // Mock data
  const metrics = [
    { icon: Zap, label: 'Velocity', value: '34', subtext: 'points/sprint', trend: -8 },
    { icon: Clock, label: 'Cycle Time', value: '3.2d', subtext: 'avg per task', trend: 12 },
    { icon: Target, label: 'Completion Rate', value: '89%', subtext: 'tasks done', trend: 5 },
    { icon: Users, label: 'Collaboration', value: '4.2', subtext: 'interactions/day', trend: 15 },
  ];
  
  const insights = [
    {
      id: 1,
      type: 'celebration',
      title: 'Sarah is your unblocking champion! 🏆',
      description: 'This sprint, Sarah has unblocked 7 teammates, 3x more than average. Consider recognizing her at retro.',
      actions: [{ label: 'Recognize Sarah', action: 'recognize' }]
    },
    {
      id: 2,
      type: 'warning',
      title: 'Code Review is your bottleneck',
      description: 'Average time in Review: 4.2 days (up from 1.5 days). 6 items stuck waiting for review right now.',
      actions: [{ label: 'View Stuck Items', action: 'view' }, { label: 'Schedule Review Block', action: 'schedule' }]
    },
    {
      id: 3,
      type: 'tip',
      title: 'Your Tuesday mornings are 2.3x more productive',
      description: 'Based on your completion patterns, schedule important deep work on Tuesday mornings for best results.',
      actions: [{ label: 'Apply to Calendar', action: 'apply' }]
    },
  ];
  
  const team = [
    { id: 1, name: 'Sarah', avatar: '👩‍💻', workload: 120 },
    { id: 2, name: 'Alex', avatar: '👨‍💻', workload: 85 },
    { id: 3, name: 'Mike', avatar: '🧑‍💻', workload: 65 },
    { id: 4, name: 'Lisa', avatar: '👩‍🎨', workload: 95 },
  ];
  
  return (
    <div className="p-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Insights</h2>
          <p className="text-sm text-text-tertiary mt-1">AI-powered analytics for your project</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-1 py-1 rounded-xl bg-surface-1 border border-white/[0.08]">
            <button 
              onClick={() => setTimeRange('sprint')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${timeRange === 'sprint' ? 'bg-brand-500/10 text-brand-400 font-medium' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              This Sprint
            </button>
            <button 
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${timeRange === 'month' ? 'bg-brand-500/10 text-brand-400 font-medium' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setTimeRange('quarter')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${timeRange === 'quarter' ? 'bg-brand-500/10 text-brand-400 font-medium' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              Quarter
            </button>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-1 border border-white/[0.08] text-text-secondary text-sm hover:bg-surface-2 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, idx) => (
          <MetricCard key={idx} metric={metric} />
        ))}
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Insights */}
        <div className="col-span-7 space-y-6">
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">AI Insights</h3>
          {insights.map(insight => (
            <InsightCard 
              key={insight.id} 
              insight={insight}
              onAction={(insight, action) => console.log('Action:', action)}
              onDismiss={(insight) => console.log('Dismiss:', insight.id)}
            />
          ))}
        </div>
        
        {/* Right Column: Gauges & AI */}
        <div className="col-span-5 space-y-6">
          <SprintHealthGauge 
            health={72} 
            forecast={{ best: 95, likely: 78, worst: 62 }}
          />
          
          <TeamBalanceChart team={team} />
          
          <AIAssistant />
        </div>
      </div>
    </div>
  );
}
