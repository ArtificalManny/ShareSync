// src/components/activity/ActivityFeed.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchActivities } from '../../api/activity';
import ActivityCard from './ActivityCard';

const ActivityFeed = ({ userId, projectId }) => {
  const [filter, setFilter] = useState('user');
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loader = useRef(null);

  const loadActivities = useCallback(async () => {
    try {
      const newActivities = await fetchActivities(filter, userId, projectId, page);
      if (newActivities.length === 0) {
        setHasMore(false);
      } else {
        setActivities((prev) => [...prev, ...newActivities]);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  }, [filter, userId, projectId, page]);

  // Initial & filter-change reset
  useEffect(() => {
    setActivities([]);
    setPage(1);
    setHasMore(true);
  }, [filter, userId, projectId]);

  // Load on page change
  useEffect(() => {
    if (hasMore) loadActivities();
  }, [page, loadActivities, hasMore]);

  // IntersectionObserver to trigger next page
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (loader.current) observer.observe(loader.current);
    return () => loader.current && observer.unobserve(loader.current);
  }, [hasMore]);

  return (
    <div className="activity-feed">
      <select onChange={(e) => setFilter(e.target.value)} value={filter}>
        <option value="user">My Activity</option>
        <option value="project">Project Activity</option>
        <option value="global">Global Activity</option>
      </select>

      <div className="activity-list">
        {activities.map((item) => (
          <ActivityCard
            key={item._id}
            user={item.user}
            action={item.action}
            description={item.description}
            timestamp={item.timestamp}
            streakDays={item.streakDays}
            xp={item.xp}
            tier={item.tier}
          />
        ))}
        {hasMore && <div ref={loader} className="loader">Loading more...</div>}
        {!hasMore && <div className="end-message">You've reached the end.</div>}
      </div>
    </div>
  );
};

export default ActivityFeed;
