// src/components/fairness/BalancePanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE I: Balance Panel - Detailed Contribution Breakdown
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  Users, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  Rocket, 
  MessageSquare,
  Flame,
  GitPullRequest,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import ContributionScore from './ContributionScore';
import FairnessRadar, { MiniRadar } from './FairnessRadar';
import SkewWarning from './SkewWarning';
import { formatScore, getContributionTier } from '../../utils/contributionScore';

const CATEGORY_CONFIG = {
  tasks: { icon: CheckCircle2, label: 'Tasks Completed', color: 'text-success' },
  ships: { icon: Rocket, label: 'Ships Participated', color: 'text-brand' },
  unblocking: { icon: MessageSquare, label: 'Unblocking Comments', color: 'text-cyan-400' },
  fireMode: { icon: Flame, label: 'Fire Mode Minutes', color: 'text-energy-500' },
  codeReviews: { icon: GitPullRequest, label: 'Code Reviews', color: 'text-warning' },
};

function ContributionBar({ contributions }) {
  const colors = ['bg-brand', 'bg-cyan-400', 'bg-success', 'bg-warning', 'bg-error-500'];
  
  return (
    <div className="h-3 rounded-full bg-surface-3 overflow-hidden flex">
      {contributions.slice(0, 5).map((c, i) => (
        <div
          key={c.userId}
          className={`${colors[i % colors.length]} transition-all duration-500`}
          style={{ width: `${c.percentage}%` }}
          title={`${c.name}: ${c.percentage}%`}
        />
      ))}
    </div>
  );
}

function MemberRow({ member, rank, isExpanded, onToggle }) {
  const tier = getContributionTier(member.percentage);
  
  return (
    <div className="border-b border-white/[0.04] last:border-0">
      <button
        onClick={onToggle}
        className="
          w-full p-4 flex items-center gap-4
          hover:bg-surface-2/50 transition-colors text-left
        "
      >
        {/* Rank */}
        <div className="w-6 text-center text-sm font-medium text-text-tertiary">
          #{rank}
        </div>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-surface-3 overflow-hidden shrink-0">
          {member.avatar ? (
            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-medium text-text-tertiary">
              {member.name?.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary truncate">{member.name}</span>
            {member.role && (
              <span className="text-xs text-text-tertiary hidden sm:inline">{member.role}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs ${tier.color === 'warning' ? 'text-warning' : 'text-text-tertiary'}`}>
              {tier.label}
            </span>
          </div>
        </div>

        {/* Score & Percentage */}
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-sm font-medium text-brand">
            <Zap className="w-3 h-3" />
            {formatScore(member.score)}
          </div>
          <div className={`text-xs ${member.percentage >= 40 ? 'text-warning' : 'text-text-tertiary'}`}>
            {member.percentage}%
          </div>
        </div>

        {/* Expand Icon */}
        <div className="shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-text-tertiary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-tertiary" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 rounded-xl bg-surface-2/50 border border-white/[0.04]">
            <div className="grid grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="flex items-center justify-center">
                <MiniRadar breakdown={member.breakdown} size={120} />
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  const value = member.breakdown?.[key] || 0;
                  return (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-text-tertiary">
                        <Icon className={`w-3 h-3 ${config.color}`} />
                        {config.label}
                      </span>
                      <span className="font-medium text-text-secondary">
                        {formatScore(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BalancePanel({
  contributions = [],
  skewAnalysis,
  entropyScore = 1,
  onRebalance,
  showHeader = true,
  className = '',
}) {
  const [expandedMember, setExpandedMember] = useState(null);
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'name' | 'percentage'

  const sortedContributions = useMemo(() => {
    const sorted = [...contributions];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'percentage':
        return sorted.sort((a, b) => b.percentage - a.percentage);
      default:
        return sorted.sort((a, b) => b.score - a.score);
    }
  }, [contributions, sortBy]);

  const balancePercent = Math.round(entropyScore * 100);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand/10">
              <PieChart className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Team Balance</h3>
              <p className="text-xs text-text-tertiary">{contributions.length} members</p>
            </div>
          </div>

          {/* Balance Score */}
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              balancePercent >= 70 ? 'text-success' :
              balancePercent >= 50 ? 'text-warning' : 'text-error-500'
            }`}>
              {balancePercent}%
            </div>
            <p className="text-xs text-text-tertiary">Balance Score</p>
          </div>
        </div>
      )}

      {/* Warnings */}
      {skewAnalysis?.warnings?.length > 0 && (
        <SkewWarning
          warning={skewAnalysis.warnings[0]}
          onAction={onRebalance}
          variant="banner"
        />
      )}

      {/* Distribution Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-tertiary">Contribution Distribution</span>
          <span className="text-xs text-text-tertiary">
            {skewAnalysis?.isSkewed ? '⚠️ Skewed' : '✓ Balanced'}
          </span>
        </div>
        <ContributionBar contributions={contributions} />
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {contributions.slice(0, 5).map((c, i) => {
            const colors = ['bg-brand', 'bg-cyan-400', 'bg-success', 'bg-warning', 'bg-error-500'];
            return (
              <div key={c.userId} className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`} />
                <span className="text-text-tertiary">{c.name}</span>
                <span className="text-text-secondary font-medium">{c.percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-tertiary">Sort by:</span>
        {['score', 'percentage', 'name'].map(option => (
          <button
            key={option}
            onClick={() => setSortBy(option)}
            className={`
              px-2 py-1 rounded text-xs capitalize
              ${sortBy === option 
                ? 'bg-brand/10 text-brand font-medium' 
                : 'text-text-tertiary hover:text-text-secondary'}
              transition-colors
            `}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Member List */}
      <div className="rounded-xl bg-surface-1 border border-white/[0.06] overflow-hidden">
        {sortedContributions.map((member, index) => (
          <MemberRow
            key={member.userId}
            member={member}
            rank={index + 1}
            isExpanded={expandedMember === member.userId}
            onToggle={() => setExpandedMember(
              expandedMember === member.userId ? null : member.userId
            )}
          />
        ))}
      </div>
    </div>
  );
}
