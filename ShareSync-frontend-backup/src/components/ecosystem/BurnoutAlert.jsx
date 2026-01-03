import React, { useState } from 'react';
import { 
  AlertTriangle, X, TrendingDown, Calendar, Clock, 
  Battery, Moon, Coffee, CheckCircle 
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

const BurnoutAlert = ({ onDismiss }) => {
  const isMobile = useIsMobile();
  
  // Mock data - will be replaced with real burnout detection
  const [burnoutData, setBurnoutData] = useState({
    level: 'medium', // low, medium, high
    consecutiveDays: 14,
    avgHoursPerDay: 8.5,
    energyTrend: 'down', // up, stable, down
    taskCompletionRate: 55,
    lateNightDays: 5,
    workedLastWeekend: true,
    signals: [
      { id: 1, text: '14-day work streak', severity: 'high', icon: Calendar },
      { id: 2, text: '8.5 hrs/day average', severity: 'medium', icon: Clock },
      { id: 3, text: 'Energy trending down', severity: 'high', icon: TrendingDown },
      { id: 4, text: 'Late night work (5 days)', severity: 'medium', icon: Moon },
      { id: 5, text: 'Worked last weekend', severity: 'high', icon: Battery },
    ],
    recommendation: 'Take a recovery day this weekend'
  });

  const [dismissed, setDismissed] = useState(false);

  const getLevelColor = (level) => {
    switch(level) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'yellow';
      default: return 'slate';
    }
  };

  const handleScheduleBreak = () => {
    console.log('Schedule break day');
    // TODO: Integrate with calendar
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed || burnoutData.level === 'low') {
    return null;
  }

  const color = getLevelColor(burnoutData.level);

  if (isMobile) {
    // Mobile compact version
    return (
      <div className={`bg-${color}-500/10 border border-${color}-500/30 rounded-2xl p-4 mb-6`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 text-${color}-400 flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-sm mb-1">Burnout Alert</h4>
            <p className="text-xs text-slate-300 mb-3">
              {burnoutData.consecutiveDays} days straight without a break
            </p>
            <button
              onClick={handleScheduleBreak}
              className={`w-full py-2 bg-${color}-600 hover:bg-${color}-700 rounded-lg font-semibold text-sm transition-all active:scale-95`}
            >
              Schedule Break
            </button>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    );
  }

  // Desktop full version
  return (
    <div className={`bg-${color}-500/10 border-2 border-${color}-500/30 rounded-2xl p-6 mb-6 backdrop-blur-xl`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-${color}-500/20 rounded-xl flex items-center justify-center`}>
            <AlertTriangle className={`w-6 h-6 text-${color}-400`} />
          </div>
          <div>
            <h3 className={`text-xl font-bold text-${color}-400`}>Burnout Alert</h3>
            <p className="text-sm text-slate-400">Your wellbeing matters</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Message */}
        <div className="lg:col-span-2">
          <p className="text-white text-lg mb-4">
            You've worked <span className="font-bold text-orange-400">{burnoutData.consecutiveDays} days straight</span> without a break.
          </p>
          
          <div className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4 mb-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Coffee className={`w-5 h-5 text-${color}-400`} />
              <h5 className="font-semibold text-white">Recommendation</h5>
            </div>
            <p className="text-slate-300">{burnoutData.recommendation}</p>
          </div>

          {/* Signals */}
          <div>
            <h5 className="font-semibold text-white mb-3 text-sm">📊 Your Stats:</h5>
            <div className="space-y-2">
              {burnoutData.signals.map((signal) => (
                <div 
                  key={signal.id}
                  className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg"
                >
                  <signal.icon className={`w-4 h-4 text-${
                    signal.severity === 'high' ? 'red' : 
                    signal.severity === 'medium' ? 'orange' : 
                    'yellow'
                  }-400`} />
                  <span className="text-sm text-slate-300">{signal.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleScheduleBreak}
            className={`w-full py-4 bg-${color}-600 hover:bg-${color}-700 rounded-xl font-bold transition-all shadow-lg hover:shadow-${color}-500/50`}
          >
            <Calendar className="w-5 h-5 inline-block mr-2" />
            Schedule Break Day
          </button>
          
          <button
            onClick={handleDismiss}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-all"
          >
            I'll Take Care of Myself
          </button>

          {/* Tips */}
          <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
            <h6 className="font-semibold text-white text-sm mb-2">💡 Quick Tips:</h6>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Take short breaks every 90 minutes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Get 7-8 hours of sleep tonight</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Plan a full recovery day this weekend</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BurnoutAlert;
