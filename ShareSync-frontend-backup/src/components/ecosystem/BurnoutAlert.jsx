// src/components/ecosystem/BurnoutAlert.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 5: Quiet Confidence
// ═══════════════════════════════════════════════════════════════════════════════
// FIXED: Dynamic Tailwind classes don't work (can't purge `bg-${color}-500`)
// SOLUTION: Use explicit class maps + design tokens
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, X, TrendingDown, Calendar, Clock, 
  Battery, Moon, Coffee, CheckCircle 
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';
import ecosystemApi from '../../services/ecosystemApi';
import useSocket from '../../hooks/useSocket';

/* ─────────────────────────────────────────────────────────────────────────
   COLOR CONFIG - Explicit classes (Tailwind-safe)
───────────────────────────────────────────────────────────────────────── */
const levelStyles = {
  high: {
    container: 'bg-danger/10 border-danger/30',
    icon: 'text-danger',
    iconBg: 'bg-danger/20',
    title: 'text-danger',
    button: 'bg-danger hover:bg-danger/80',
    accent: 'text-danger',
  },
  medium: {
    container: 'bg-warning/10 border-warning/30',
    icon: 'text-warning',
    iconBg: 'bg-warning/20',
    title: 'text-warning',
    button: 'bg-warning hover:bg-warning/80 text-surface-0',
    accent: 'text-warning',
  },
  low: {
    container: 'bg-success/10 border-success/30',
    icon: 'text-success',
    iconBg: 'bg-success/20',
    title: 'text-success',
    button: 'bg-success hover:bg-success/80',
    accent: 'text-success',
  },
};

const severityStyles = {
  high: 'text-danger',
  medium: 'text-warning',
  low: 'text-text-tertiary',
};

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────── */
const BurnoutAlert = ({ onDismiss }) => {
  const isMobile = useIsMobile();
  
  const [burnoutData, setBurnoutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchBurnoutStatus();
  }, []);

  useSocket(null, {
    onEvents: {
      'user:burnout-alert': (data) => {
        console.log('Burnout alert received:', data);
        setBurnoutData({
          level: data.level,
          recommendation: data.recommendation,
          stats: data.stats || {},
          signals: mapSignals(data)
        });
      }
    }
  });

  const fetchBurnoutStatus = async () => {
    try {
      const data = await ecosystemApi.getBurnoutStatus();
      if (data && (data.level === 'medium' || data.level === 'high')) {
        setBurnoutData({
          level: data.level,
          recommendation: data.recommendation?.action || 'Take a break this weekend',
          stats: data.stats || {},
          signals: mapSignals(data)
        });
      }
    } catch (error) {
      console.error('Failed to fetch burnout status:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapSignals = (data) => {
    const signals = [];
    const stats = data.stats || {};
    
    if (stats.consecutiveDays >= 14) {
      signals.push({
        id: 1,
        text: `${stats.consecutiveDays}-day work streak`,
        severity: 'high',
        icon: Calendar
      });
    }
    
    if (stats.avgHoursPerDay > 8) {
      signals.push({
        id: 2,
        text: `${stats.avgHoursPerDay} hrs/day average`,
        severity: 'medium',
        icon: Clock
      });
    }
    
    if (data.signals?.energyDeclining) {
      signals.push({
        id: 3,
        text: 'Energy trending down',
        severity: 'high',
        icon: TrendingDown
      });
    }
    
    if (stats.lateNightDays >= 5) {
      signals.push({
        id: 4,
        text: `Late night work (${stats.lateNightDays} days)`,
        severity: 'medium',
        icon: Moon
      });
    }
    
    if (stats.weekendDays >= 4) {
      signals.push({
        id: 5,
        text: 'Worked multiple weekends',
        severity: 'high',
        icon: Battery
      });
    }
    
    return signals;
  };

  const handleScheduleBreak = () => {
    console.log('Schedule break day');
    handleDismiss();
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Don't show if loading, dismissed, low risk, or no data
  if (loading || dismissed || !burnoutData || burnoutData.level === 'low') {
    return null;
  }

  const styles = levelStyles[burnoutData.level] || levelStyles.medium;

  /* ─────────────────────────────────────────────────────────────────────────
     MOBILE VERSION
  ───────────────────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className={`${styles.container} border rounded-xl p-4 mb-4`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 ${styles.icon} shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-text-primary text-sm mb-1">Burnout Alert</h4>
            <p className="text-xs text-text-secondary mb-3">
              {burnoutData.stats?.consecutiveDays || 0} days straight without a break
            </p>
            <button
              onClick={handleScheduleBreak}
              className={`w-full py-2 ${styles.button} rounded-lg font-medium text-sm transition-all active:scale-[0.98]`}
            >
              Schedule Break
            </button>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-surface-2 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     DESKTOP VERSION
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div className={`${styles.container} border-2 rounded-xl p-6 mb-6`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 ${styles.iconBg} rounded-xl flex items-center justify-center`}>
            <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${styles.title}`}>Burnout Alert</h3>
            <p className="text-sm text-text-tertiary">Your wellbeing matters</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-text-tertiary" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Message */}
        <div className="lg:col-span-2">
          <p className="text-text-primary mb-4">
            You've worked <span className={`font-semibold ${styles.accent}`}>{burnoutData.stats?.consecutiveDays || 0} days straight</span> without a break.
          </p>
          
          {/* Recommendation */}
          <div className={`${styles.container} border rounded-xl p-4 mb-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Coffee className={`w-4 h-4 ${styles.icon}`} />
              <h5 className="font-medium text-text-primary text-sm">Recommendation</h5>
            </div>
            <p className="text-sm text-text-secondary">{burnoutData.recommendation}</p>
          </div>

          {/* Signals */}
          {burnoutData.signals && burnoutData.signals.length > 0 && (
            <div>
              <h5 className="font-medium text-text-primary mb-3 text-sm">📊 Your Stats:</h5>
              <div className="space-y-2">
                {burnoutData.signals.map((signal) => {
                  const SignalIcon = signal.icon;
                  return (
                    <div 
                      key={signal.id}
                      className="flex items-center gap-3 p-3 bg-surface-1 border border-white/[0.06] rounded-lg"
                    >
                      <SignalIcon className={`w-4 h-4 ${severityStyles[signal.severity] || 'text-text-tertiary'}`} />
                      <span className="text-sm text-text-secondary">{signal.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleScheduleBreak}
            className={`w-full py-3 ${styles.button} rounded-xl font-semibold transition-all`}
          >
            <Calendar className="w-4 h-4 inline-block mr-2" />
            Schedule Break Day
          </button>
          
          <button
            onClick={handleDismiss}
            className="w-full py-3 bg-surface-2 hover:bg-surface-3 text-text-secondary rounded-xl font-medium transition-all"
          >
            I'll Take Care of Myself
          </button>

          {/* Tips */}
          <div className="mt-4 p-4 bg-surface-1 rounded-xl border border-white/[0.06]">
            <h6 className="font-medium text-text-primary text-sm mb-2">💡 Quick Tips:</h6>
            <ul className="space-y-2 text-xs text-text-tertiary">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-success mt-0.5 shrink-0" />
                <span>Take short breaks every 90 minutes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-success mt-0.5 shrink-0" />
                <span>Get 7-8 hours of sleep tonight</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-success mt-0.5 shrink-0" />
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
