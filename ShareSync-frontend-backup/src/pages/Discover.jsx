// src/pages/Discover.jsx
import React from 'react';
import { DISCOVERY_V1, SOCIAL_MINI_V1 } from '../config/flags';
import DiscoveryFeed from '../components/discovery/DiscoveryFeed.jsx';
import FollowButton from '../components/social/FollowButton.jsx';
import ReactionBar from '../components/social/ReactionBar.jsx';
import { track } from '../utils/telemetry.js';
import { useState } from "react";
import EmptyState from '../components/ui/EmptyState.jsx';
import SkeletonBlock from '../components/skeleton/SkeletonBlock.jsx';
import LeaderboardDock from '../components/momentum/LeaderboardDock.jsx';

export default function Discover() {
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedEmpty, setFeedEmpty] = useState(false);

  const renderItemActions = (project) => {
    if (!SOCIAL_MINI_V1 || !project) return null;
    const pid = project._id || project.id || project.slug || '';
    const ownerId = project.userId || project.ownerId || null;

    return (
      <div className="mt-2 flex items-center gap-2">
        <FollowButton
          projectId={pid}
          onChange={(following) => {
            try { track(following ? 'follow_clicked' : 'unfollow_clicked', { projectId: pid }); } catch {}
          }}
        />
        <ReactionBar
          compact
          targetId={`project:${pid}`}
          ownerId={ownerId}
          meId={"me"}
          label="Project"
          onReact={(emoji) => { try { track('reaction_clicked', { projectId: pid, emoji }); } catch {} }}
        />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <h1 className="h-hero">Discover</h1>
      <p className="h-sub mt-1">Leaderboard + Fresh Projects</p>

      {/* Leaderboard */}
      <div className="card glass mb-6 p-6">
        <h2 className="text-lg font-semibold mb-4">Top 10 Momentum</h2>
        <LeaderboardDock />
      </div>

      {/* Fresh Projects */}
      <div className="card glass p-6">
        <h2 className="text-lg font-semibold mb-4">Fresh Projects</h2>
        {feedLoading ? (
          <SkeletonBlock height={120} repeat={3} />
        ) : feedEmpty ? (
          <EmptyState title="No fresh projects" />
        ) : (
          <DiscoveryFeed itemActions={renderItemActions} />
        )}
      </div>
    </div>
  );
}