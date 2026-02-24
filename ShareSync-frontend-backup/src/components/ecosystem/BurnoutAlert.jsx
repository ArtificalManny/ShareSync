import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, TrendingDown, Calendar, Clock, Battery, Moon, Coffee, CheckCircle } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';
import ecosystemApi from '../../services/ecosystemApi';
import useSocket from '../../hooks/useSocket';

const levelStyles = {
  high: { container: 'bg-red-50 dark:bg-danger/10 border-red-200 dark:border-danger/30', icon: 'text-red-500 dark:text-danger', iconBg: 'bg-red-100 dark:bg-danger/20', title: 'text-red-700 dark:text-danger', button: 'bg-red-500 hover:bg-red-600 text-white', accent: 'text-red-600 dark:text-danger' },
  medium: { container: 'bg-orange-50 dark:bg-warning/10 border-orange-200 dark:border-warning/30', icon: 'text-orange-500 dark:text-warning', iconBg: 'bg-orange-100 dark:bg-warning/20', title: 'text-orange-700 dark:text-warning', button: 'bg-orange-500 hover:bg-orange-600 text-white', accent: 'text-orange-600 dark:text-warning' },
  low: { container: 'bg-emerald-50 dark:bg-success/10 border-emerald-200 dark:border-success/30', icon: 'text-emerald-500 dark:text-success', iconBg: 'bg-emerald-100 dark:bg-success/20', title: 'text-emerald-700 dark:text-success', button: 'bg-emerald-500 hover:bg-emerald-600 text-white', accent: 'text-emerald-600 dark:text-success' },
};

const severityStyles = { high: 'text-red-500 dark:text-danger', medium: 'text-orange-500 dark:text-warning', low: 'text-slate-400 dark:text-text-tertiary' };

const BurnoutAlert = ({ onDismiss, demoMode = false }) => {
  const isMobile = useIsMobile();
  const [burnoutData, setBurnoutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => { fetchBurnoutStatus(); }, [demoMode]);
  useSocket(null, { onEvents: { 'user:burnout-alert': (data) => { setBurnoutData({ level: data.level, recommendation: data.recommendation, stats: data.stats || {}, signals: mapSignals(data) }); } } });

  const fetchBurnoutStatus = async () => {
    if (demoMode) {
      setBurnoutData({ level: 'medium', recommendation: 'Take a break this weekend. You are crushing it, but recovery is part of the process.', stats: { consecutiveDays: 14 }, signals: [ { id: 1, text: '14-day work streak', severity: 'high', icon: Calendar }, { id: 2, text: 'Late night work (5 days)', severity: 'medium', icon: Moon } ] });
      setLoading(false); return;
    }
    try {
      const data = await ecosystemApi.getBurnoutStatus();
      if (data && (data.level === 'medium' || data.level === 'high')) { setBurnoutData({ level: data.level, recommendation: data.recommendation?.action || 'Take a break this weekend', stats: data.stats || {}, signals: mapSignals(data) }); }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const mapSignals = (data) => {
    const signals = []; const stats = data.stats || {};
    if (stats.consecutiveDays >= 14) signals.push({ id: 1, text: `${stats.consecutiveDays}-day work streak`, severity: 'high', icon: Calendar });
    if (stats.avgHoursPerDay > 8) signals.push({ id: 2, text: `${stats.avgHoursPerDay} hrs/day average`, severity: 'medium', icon: Clock });
    if (data.signals?.energyDeclining) signals.push({ id: 3, text: 'Energy trending down', severity: 'high', icon: TrendingDown });
    if (stats.lateNightDays >= 5) signals.push({ id: 4, text: `Late night work (${stats.lateNightDays} days)`, severity: 'medium', icon: Moon });
    if (stats.weekendDays >= 4) signals.push({ id: 5, text: 'Worked multiple weekends', severity: 'high', icon: Battery });
    return signals;
  };

  const handleScheduleBreak = () => { handleDismiss(); };
  const handleDismiss = () => { setDismissed(true); onDismiss?.(); };

  if (loading || dismissed || !burnoutData || burnoutData.level === 'low') return null;

  const styles = levelStyles[burnoutData.level] || levelStyles.medium;

  if (isMobile) {
    return (
      <div className={`${styles.container} border-l-4 rounded-xl p-5 mb-4 shadow-sm`}>
        <div className="flex items-start gap-4">
          <AlertTriangle className={`w-6 h-6 ${styles.icon} shrink-0`} />
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold ${styles.title} text-base mb-1`}>Burnout Alert</h4>
            <p className="text-sm font-medium text-slate-600 dark:text-text-secondary mb-4">
              {burnoutData.stats?.consecutiveDays || 0} days straight without a break
            </p>
            <button onClick={handleScheduleBreak} className={`w-full py-2.5 ${styles.button} rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm`}>
              Schedule Break
            </button>
          </div>
          <button onClick={handleDismiss} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500 dark:text-text-tertiary" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} border-2 border-l-4 rounded-2xl p-7 shadow-sm transition-all`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${styles.iconBg} rounded-xl flex items-center justify-center`}>
            <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${styles.title}`}>Burnout Alert</h3>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-text-tertiary">System Wellness Check</p>
          </div>
        </div>
        <button onClick={handleDismiss} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors active:scale-90">
          <X className="w-6 h-6 text-slate-500 dark:text-text-tertiary" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <p className="text-slate-800 dark:text-text-primary text-lg mb-5 font-medium leading-snug">
            You've worked <span className={`font-bold ${styles.accent}`}>{burnoutData.stats?.consecutiveDays || 0} days straight</span> without taking a break.
          </p>
          
          <div className={`bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl p-5 mb-6`}>
            <div className="flex items-center gap-2 mb-2">
              <Coffee className={`w-5 h-5 ${styles.icon}`} />
              <h5 className="font-bold text-slate-800 dark:text-text-primary text-sm">Action Recommended</h5>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-text-secondary leading-relaxed">{burnoutData.recommendation}</p>
          </div>

          {burnoutData.signals && burnoutData.signals.length > 0 && (
            <div>
              <h5 className="font-bold text-slate-800 dark:text-text-primary mb-3 text-xs uppercase tracking-wider">📊 Detected Metrics</h5>
              <div className="space-y-2">
                {burnoutData.signals.map((signal) => {
                  const SignalIcon = signal.icon;
                  return (
                    <div key={signal.id} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-surface-1 border border-black/5 dark:border-white/[0.06] rounded-xl">
                      <SignalIcon className={`w-5 h-5 ${severityStyles[signal.severity]}`} />
                      <span className="text-sm font-bold text-slate-700 dark:text-text-secondary">{signal.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button onClick={handleScheduleBreak} className={`w-full py-4 ${styles.button} rounded-xl font-bold transition-all shadow-md active:scale-95 flex justify-center items-center`}>
            <Calendar className="w-5 h-5 mr-2" />
            Schedule Break Day
          </button>
          
          <button onClick={handleDismiss} className="w-full py-4 bg-white/60 dark:bg-surface-2 hover:bg-white/80 dark:hover:bg-surface-3 text-slate-600 dark:text-text-secondary rounded-xl font-bold transition-all active:scale-95">
            Dismiss Warning
          </button>

          <div className="mt-6 p-5 bg-white/40 dark:bg-surface-1 rounded-xl border border-black/5 dark:border-white/[0.06]">
            <h6 className="font-bold text-slate-800 dark:text-text-primary text-xs uppercase tracking-wider mb-3">💡 Recovery Tips</h6>
            <ul className="space-y-3 text-xs font-bold text-slate-600 dark:text-text-tertiary">
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 dark:text-success shrink-0" /><span>Take short breaks every 90 mins</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 dark:text-success shrink-0" /><span>Get 7-8 hours of sleep tonight</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 dark:text-success shrink-0" /><span>Step away from the screen</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BurnoutAlert;
