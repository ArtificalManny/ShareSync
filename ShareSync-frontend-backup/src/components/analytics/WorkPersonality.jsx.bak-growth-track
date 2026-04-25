// src/components/analytics/WorkPersonality.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Clock, TrendingUp } from 'lucide-react';
import client from '../../api/client';
import '../../styles/card.css';

export default function WorkPersonality({ userId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await client.get(`/analytics/user/${userId}?range=30`);
        setStats(res.data);
      } catch (err) {
        console.error('[WorkPersonality] Error:', err);
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchStats();
  }, [userId]);

  if (loading) return <div className="card-base card-padding">Loading your personality...</div>;
  if (!stats) return null;

  const collaborationStyle = getCollaborationStyle(stats);
  const reliabilityScore = Math.round((stats.onTimeCompletion?.value || 0) * 100);
  const primaryRole = getPrimaryRole(stats);
  const hotZone = getHotZone(stats);

  return (
    <motion.div 
      className="card-base card-padding rounded-3xl shadow-lg space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400">
          🎭 Your Work Personality
        </h3>
        <span className="text-xs text-gray-500">Last 30 days</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PersonalityCard
          icon={<Brain className="w-5 h-5" />}
          label="Collaboration Style"
          value={collaborationStyle.type}
          description={collaborationStyle.description}
          color="blue"
        />

        <PersonalityCard
          icon={<Target className="w-5 h-5" />}
          label="Reliability Score"
          value={`${reliabilityScore}/100`}
          description={getReliabilityMessage(reliabilityScore)}
          color="green"
        />

        <PersonalityCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Primary Role"
          value={primaryRole.type}
          description={primaryRole.description}
          color="purple"
        />

        <PersonalityCard
          icon={<Clock className="w-5 h-5" />}
          label="Peak Performance"
          value={hotZone.time}
          description={hotZone.description}
          color="orange"
        />
      </div>

      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong className="text-purple-600 dark:text-purple-400">You are becoming:</strong>{' '}
          {getIdentityStatement(collaborationStyle, primaryRole, reliabilityScore)}
        </p>
      </div>
    </motion.div>
  );
}

function PersonalityCard({ icon, label, value, description, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-80">{description}</div>
    </div>
  );
}

function getCollaborationStyle(stats) {
  const activeDays = stats.activeDays?.value || 0;
  const cadence = stats.cadence?.value || 0;

  if (cadence > 2 && activeDays > 20) {
    return {
      type: 'Real-time Collaborator',
      description: 'Thrives in fast-paced team environments'
    };
  }
  
  if (cadence < 1.5 && activeDays > 15) {
    return {
      type: 'Async Specialist',
      description: 'Masters deep work and thoughtful responses'
    };
  }

  if ((stats.throughputPerWeek?.value || 0) > 10 && activeDays < 15) {
    return {
      type: 'Solo Deep Worker',
      description: 'Produces in intense focus sessions'
    };
  }

  return {
    type: 'Balanced Contributor',
    description: 'Adapts to team needs flexibly'
  };
}

function getPrimaryRole(stats) {
  const throughput = stats.throughputPerWeek?.value || 0;
  const onTime = stats.onTimeCompletion?.value || 0;

  if (throughput > 15 && onTime > 0.8) {
    return {
      type: 'The Executor',
      description: 'Ships consistently and reliably'
    };
  }

  if (throughput > 10 && onTime < 0.7) {
    return {
      type: 'The Architect',
      description: 'Tackles complex, ambiguous problems'
    };
  }

  if (throughput < 10 && onTime > 0.85) {
    return {
      type: 'The Specialist',
      description: 'Delivers precision over speed'
    };
  }

  return {
    type: 'The Strategist',
    description: 'Balances planning and execution'
  };
}

function getHotZone(stats) {
  const peakHour = stats.insights?.peakHourLocal;
  const peakDay = stats.insights?.peakDayOfWeek;

  if (peakHour && peakDay) {
    const hour = peakHour < 12 ? `${peakHour}am` : `${peakHour - 12}pm`;
    return {
      time: `${peakDay}s at ${hour}`,
      description: 'Your productivity sweet spot'
    };
  }

  return {
    time: 'Building data...',
    description: 'Keep shipping to reveal patterns'
  };
}

function getReliabilityMessage(score) {
  if (score >= 90) return 'Extremely dependable';
  if (score >= 75) return 'Very reliable';
  if (score >= 60) return 'Generally on-time';
  if (score >= 40) return 'Room to improve';
  return 'Building track record';
}

function getIdentityStatement(collab, role) {
  const statements = {
    'Real-time Collaborator': 'a rapid-response team player who drives momentum',
    'Async Specialist': 'a thoughtful craftsperson who values depth over speed',
    'Solo Deep Worker': 'an intense focus specialist who produces in bursts',
    'Balanced Contributor': 'a versatile teammate who adapts to what is needed',
  };

  const roleStatements = {
    'The Executor': 'who ships relentlessly',
    'The Architect': 'who solves the hardest problems',
    'The Specialist': 'who delivers excellence',
    'The Strategist': 'who balances planning and action',
  };

  return `${statements[collab.type] || 'a valuable contributor'} ${roleStatements[role.type] || ''}`;
}
