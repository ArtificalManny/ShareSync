// src/hooks/useFocusStatus.js
import { useState, useEffect } from 'react';

/**
 * useFocusStatus - Track which team members are in focus mode
 * 
 * Phase 3: Mock data implementation
 * Future: Connect to real presence API
 */
export default function useFocusStatus(projectId) {
  const [focusedMembers, setFocusedMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFocusStatus();

    // Poll for updates every 30 seconds
    const interval = setInterval(loadFocusStatus, 30000);

    return () => clearInterval(interval);
  }, [projectId]);

  async function loadFocusStatus() {
    try {
      setLoading(true);

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/projects/${projectId}/focus-status`);
      // const data = await response.json();
      // setFocusedMembers(data.focusedMembers);

      // Mock data - simulate team members in focus mode
      const mockFocusedMembers = getMockFocusedMembers();
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setFocusedMembers(mockFocusedMembers);
    } catch (err) {
      console.error('[useFocusStatus] Load error:', err);
      setFocusedMembers([]);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Check if specific users are in focus mode
   * @param {Array} userIds - Array of user IDs to check
   * @returns {Array} - Subset of users who are focused
   */
  function checkFocus(userIds = []) {
    if (!userIds.length) return focusedMembers;
    
    return focusedMembers.filter(member => 
      userIds.includes(member.userId)
    );
  }

  return {
    focusedMembers,
    checkFocus,
    loading,
    refresh: loadFocusStatus
  };
}

/**
 * Mock focused members data
 */
function getMockFocusedMembers() {
  const now = Date.now();
  
  // Simulate Sarah and Jordan in focus mode
  return [
    {
      userId: 'user_2',
      name: 'Sarah',
      avatar: '/avatars/sarah.jpg',
      activity: 'Design review',
      startTime: new Date(now - 23 * 60 * 1000).toISOString(), // Started 23 min ago
      endTime: new Date(now + 27 * 60 * 1000).toISOString(),   // Ends in 27 min
      remainingMinutes: 27,
      sessionType: 'pomodoro' // or 'deep-work', 'meeting'
    },
    {
      userId: 'user_3',
      name: 'Jordan',
      avatar: '/avatars/jordan.jpg',
      activity: 'Beta testing',
      startTime: new Date(now - 47 * 60 * 1000).toISOString(),
      endTime: new Date(now + 13 * 60 * 1000).toISOString(),
      remainingMinutes: 13,
      sessionType: 'deep-work'
    }
  ];
}
