// src/components/activity/ActivityCard.jsx
import React from 'react';
import './ActivityCard.css'; // Make sure this is the CSS file below

export default function ActivityCard({ user, action, description, timestamp, streakDays, xp, tier }) {
  const formatTimeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="activity-card glass">
      <div className="activity-header">
        <img src={user.avatar} alt="avatar" className={`avatar ${tier?.toLowerCase()}`} />
        <div className="activity-info">
          <span className="username">{user.name}</span>
          <span className="action">{action}</span>
        </div>
        <span className="timestamp">{formatTimeAgo(timestamp)}</span>
      </div>

      <div className="activity-body">
        {description}
      </div>

      <div className="activity-tags">
        {streakDays > 0 && <span className="badge streak">🔥 {streakDays}d</span>}
        {xp > 0 && <span className="badge xp">⭐ {xp} XP</span>}
        {tier && <span className={`tier-badge ${tier.toLowerCase()}`}>{tier}</span>}
      </div>
    </div>
  );
}
