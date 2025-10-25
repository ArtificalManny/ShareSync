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

export default function Discover() {
    const [feedLoading, setFeedLoading] = useState(true);
    const [feedEmpty, setFeedEmpty] = useState(false);
      // Render actions under each project card in the feed
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
      {/* ✅ HERO (Step 7.2) */}
      <h1 className="h-hero">Discover</h1>
      <p className="h-sub mt-1">Fresh public projects, ranked by real momentum.</p>

      {/* Feed */}
      <div className="mt-4">
  {feedLoading ? (
    <SkeletonBlock height={104} repeat={3} />
  ) : feedEmpty ? (
    <EmptyState
      icon="🔎"
      title="No projects to discover yet"
      secondary={{ label: "Refresh", onClick: () => location.reload() }}
    >
      Check back soon—new public projects appear as people start working.
    </EmptyState>
  ) : (
    <DiscoveryFeed
      itemActions={renderItemActions}
      onLoadingChange={setFeedLoading}   // add in DiscoveryFeed (optional)
      onEmptyChange={setFeedEmpty}       // add in DiscoveryFeed (optional)
    />
  )}
</div>
    </div>
  );
}