import React from 'react';
import { Award, CheckCircle, MessageCircle, HelpCircle, TrendingUp } from 'lucide-react';

export default function RoleClassificationCard({ data }) {
  if (!data) return null;

  const {
    role,
    tasksStarted,
    tasksClosed,
    commentsGiven,
    helpRequests,
    confidence,
    traits
  } = data;

  // Role-specific colors and icons
  const getRoleStyle = () => {
    switch (role) {
      case 'Finisher':
        return { 
          gradient: 'from-emerald-500 to-green-500', 
          bg: 'bg-emerald-500/10', 
          border: 'border-emerald-500/20',
          icon: CheckCircle,
          emoji: '🎯'
        };
      case 'Starter':
        return { 
          gradient: 'from-blue-500 to-cyan-500', 
          bg: 'bg-blue-500/10', 
          border: 'border-blue-500/20',
          icon: TrendingUp,
          emoji: '🚀'
        };
      case 'Support':
        return { 
          gradient: 'from-purple-500 to-fuchsia-500', 
          bg: 'bg-purple-500/10', 
          border: 'border-purple-500/20',
          icon: MessageCircle,
          emoji: '🤝'
        };
      default:
        return { 
          gradient: 'from-yellow-500 to-orange-500', 
          bg: 'bg-yellow-500/10', 
          border: 'border-yellow-500/20',
          icon: Award,
          emoji: '⭐'
        };
    }
  };

  const style = getRoleStyle();
  const RoleIcon = style.icon;

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold">Your Role Classification</h3>
      </div>

      {/* Role Badge */}
      <div className={`${style.bg} border ${style.border} rounded-xl p-6 mb-4`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center text-2xl`}>
            {style.emoji}
          </div>
          <div className="flex-1">
            <h4 className={`text-2xl font-bold bg-gradient-to-r ${style.gradient} bg-clip-text text-transparent`}>
              {role}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 bg-slate-700/50 rounded-full flex-1">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${style.gradient}`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">{confidence}% confidence</span>
            </div>
          </div>
        </div>

        {/* Traits */}
        <div className="space-y-2">
          {traits && traits.map((trait, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-300">{trait}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{tasksStarted}</div>
          <div className="text-xs text-slate-400 mt-1">Tasks Started</div>
        </div>
        
        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{tasksClosed}</div>
          <div className="text-xs text-slate-400 mt-1">Tasks Closed</div>
        </div>
        
        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{commentsGiven}</div>
          <div className="text-xs text-slate-400 mt-1">Comments Given</div>
        </div>
        
        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{helpRequests}</div>
          <div className="text-xs text-slate-400 mt-1">Help Requests</div>
        </div>
      </div>
    </div>
  );
}
