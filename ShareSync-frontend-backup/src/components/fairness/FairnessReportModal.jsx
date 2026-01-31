// src/components/fairness/FairnessReportModal.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE I: End-of-Project Fairness Report Modal
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Trophy, 
  Medal,
  Award,
  Star,
  CheckCircle2,
  Rocket,
  MessageSquare,
  Flame,
  GitPullRequest,
  PieChart,
  TrendingUp,
  Users,
} from 'lucide-react';
import BalancePanel from './BalancePanel';
import FairnessRadar from './FairnessRadar';
import { formatScore } from '../../utils/contributionScore';

const AWARD_CONFIG = {
  mostTasks: { icon: CheckCircle2, label: 'Task Master', color: 'text-success', bg: 'bg-success/10' },
  mostShips: { icon: Rocket, label: 'Ship Captain', color: 'text-brand', bg: 'bg-brand/10' },
  mostUnblocking: { icon: MessageSquare, label: 'Team Enabler', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  mostFocus: { icon: Flame, label: 'Focus Champion', color: 'text-energy-500', bg: 'bg-energy-500/10' },
  mostReviews: { icon: GitPullRequest, label: 'Quality Guardian', color: 'text-warning', bg: 'bg-warning/10' },
};

function AwardCard({ type, member, value }) {
  const config = AWARD_CONFIG[type];
  if (!config || !member) return null;
  
  const Icon = config.icon;
  
  return (
    <div className={`
      p-4 rounded-xl ${config.bg} border border-white/[0.04]
      flex items-center gap-3
    `}>
      <div className={`p-2 rounded-lg bg-surface-0/50`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${config.color}`}>{config.label}</p>
        <p className="text-sm font-semibold text-text-primary truncate">{member.name}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-text-primary">{formatScore(value)}</p>
      </div>
    </div>
  );
}

function TopContributorCard({ member, rank }) {
  const medals = [
    { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { icon: Medal, color: 'text-slate-300', bg: 'bg-slate-300/10' },
    { icon: Award, color: 'text-amber-600', bg: 'bg-amber-600/10' },
  ];
  
  const medal = medals[rank - 1] || medals[2];
  const MedalIcon = medal.icon;
  
  return (
    <div className={`
      relative p-5 rounded-xl ${medal.bg} border border-white/[0.04]
      ${rank === 1 ? 'ring-2 ring-yellow-400/30' : ''}
    `}>
      {/* Rank Badge */}
      <div className={`
        absolute -top-3 -right-3 w-8 h-8 rounded-full
        ${medal.bg} border-2 border-surface-0
        flex items-center justify-center
      `}>
        <MedalIcon className={`w-4 h-4 ${medal.color}`} />
      </div>

      {/* Avatar */}
      <div className="w-16 h-16 rounded-full bg-surface-2 mx-auto mb-3 overflow-hidden">
        {member.avatar ? (
          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl font-bold text-text-tertiary">
            {member.name?.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center">
        <h4 className="font-semibold text-text-primary">{member.name}</h4>
        <p className="text-xs text-text-tertiary mb-2">{member.role}</p>
        
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg font-bold text-brand">{formatScore(member.score)}</span>
          <span className="text-xs text-text-tertiary">pts</span>
        </div>
        <p className={`text-sm font-medium ${member.percentage >= 40 ? 'text-warning' : 'text-text-secondary'}`}>
          {member.percentage}% contribution
        </p>
      </div>
    </div>
  );
}

export default function FairnessReportModal({
  isOpen,
  onClose,
  report,
  onDownload,
  onShare,
}) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen || !report) return null;

  const { summary, contributions, categoryLeaders, recommendations, teamTotals } = report;
  const topThree = contributions.slice(0, 3);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="
        relative w-full max-w-4xl max-h-[90vh] overflow-hidden
        bg-surface-1 border border-white/[0.08] rounded-2xl
        shadow-2xl
        animate-in fade-in zoom-in-95 duration-200
      ">
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 bg-surface-1 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand/10">
                <PieChart className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Fairness Report</h2>
                <p className="text-sm text-text-tertiary">
                  {report.project?.name} · {report.timeframe}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
                  title="Download Report"
                >
                  <Download className="w-5 h-5 text-text-tertiary" />
                </button>
              )}
              {onShare && (
                <button
                  onClick={onShare}
                  className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
                  title="Share Report"
                >
                  <Share2 className="w-5 h-5 text-text-tertiary" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
              >
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {['overview', 'breakdown', 'awards'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium capitalize
                  ${activeTab === tab 
                    ? 'bg-brand/10 text-brand' 
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'}
                  transition-colors
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-surface-2/50 border border-white/[0.04]">
                  <Users className="w-5 h-5 text-text-tertiary mb-2" />
                  <p className="text-2xl font-bold text-text-primary">{summary.totalMembers}</p>
                  <p className="text-xs text-text-tertiary">Team Members</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-2/50 border border-white/[0.04]">
                  <Zap className="w-5 h-5 text-brand mb-2" />
                  <p className="text-2xl font-bold text-brand">{formatScore(summary.totalScore)}</p>
                  <p className="text-xs text-text-tertiary">Total Score</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-2/50 border border-white/[0.04]">
                  <TrendingUp className="w-5 h-5 text-success mb-2" />
                  <p className="text-2xl font-bold text-success">{formatScore(summary.averageScore)}</p>
                  <p className="text-xs text-text-tertiary">Avg Score</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-2/50 border border-white/[0.04]">
                  <PieChart className={`w-5 h-5 mb-2 ${
                    summary.balanceScore >= 70 ? 'text-success' :
                    summary.balanceScore >= 50 ? 'text-warning' : 'text-error-500'
                  }`} />
                  <p className={`text-2xl font-bold ${
                    summary.balanceScore >= 70 ? 'text-success' :
                    summary.balanceScore >= 50 ? 'text-warning' : 'text-error-500'
                  }`}>
                    {summary.balanceScore}%
                  </p>
                  <p className="text-xs text-text-tertiary">Balance Score</p>
                </div>
              </div>

              {/* Top Contributors */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Top Contributors</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {topThree.map((member, i) => (
                    <TopContributorCard key={member.userId} member={member} rank={i + 1} />
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {recommendations && recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Recommendations</h3>
                  <div className="space-y-3">
                    {recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className={`
                          p-4 rounded-xl border
                          ${rec.priority === 'high' ? 'bg-warning/5 border-warning/20' :
                            rec.priority === 'low' ? 'bg-success/5 border-success/20' :
                            'bg-surface-2/50 border-white/[0.04]'}
                        `}
                      >
                        <h4 className="font-medium text-text-primary mb-1">{rec.title}</h4>
                        <p className="text-sm text-text-secondary">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'breakdown' && (
            <BalancePanel
              contributions={contributions}
              skewAnalysis={report.skewAnalysis}
              entropyScore={summary.balanceScore / 100}
              showHeader={false}
            />
          )}

          {activeTab === 'awards' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Category Awards</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AwardCard
                  type="mostTasks"
                  member={categoryLeaders?.mostTasks}
                  value={categoryLeaders?.mostTasks?.breakdown?.tasks}
                />
                <AwardCard
                  type="mostShips"
                  member={categoryLeaders?.mostShips}
                  value={categoryLeaders?.mostShips?.breakdown?.ships}
                />
                <AwardCard
                  type="mostUnblocking"
                  member={categoryLeaders?.mostUnblocking}
                  value={categoryLeaders?.mostUnblocking?.breakdown?.unblocking}
                />
                <AwardCard
                  type="mostFocus"
                  member={categoryLeaders?.mostFocus}
                  value={categoryLeaders?.mostFocus?.breakdown?.fireMode}
                />
                <AwardCard
                  type="mostReviews"
                  member={categoryLeaders?.mostReviews}
                  value={categoryLeaders?.mostReviews?.breakdown?.codeReviews}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
