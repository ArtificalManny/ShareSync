// src/components/project/bio-feed/BioFeed.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: Bio-Feed Container (Announcements + Activity)
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import PinnedAnnouncement from './PinnedAnnouncement';
import ProjectActivityFeed from './ProjectActivityFeed';

export default function BioFeed({
  announcements = [],
  activity = [],
  onAnnouncementClick,
  onActivityClick,
  onNewAnnouncement,
}) {
  const pinnedAnnouncement = announcements.find(a => a.pinned);

  return (
    <div className="space-y-6">
      {/* Pinned Announcement */}
      {pinnedAnnouncement && (
        <PinnedAnnouncement
          announcement={pinnedAnnouncement}
          onClick={() => onAnnouncementClick?.(pinnedAnnouncement)}
          onNew={onNewAnnouncement}
        />
      )}

      {/* Activity Feed */}
      <ProjectActivityFeed
        activity={activity}
        onActivityClick={onActivityClick}
      />
    </div>
  );
}
