// src/hooks/useCommitments.js
// ═══════════════════════════════════════════════════════════════════════════════
// Behavioral: Track User Commitments/Promises
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';

/**
 * Hook for tracking user commitments
 */
export function useCommitments(userId) {
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCommitments = useCallback(async () => {
    try {
      const response = await client.get(`/users/${userId}/commitments`);
      setCommitments(response.data || []);
    } catch (err) {
      console.error('Commitments error:', err);
      // Mock data fallback
      setCommitments(getMockCommitments());
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchCommitments();
  }, [userId, fetchCommitments]);

  const addCommitment = useCallback(async (commitment) => {
    try {
      const response = await client.post('/commitments', commitment);
      setCommitments(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      // Optimistic add
      const newCommitment = {
        id: `c_${Date.now()}`,
        ...commitment,
        createdAt: new Date().toISOString(),
        status: 'active',
      };
      setCommitments(prev => [newCommitment, ...prev]);
      return newCommitment;
    }
  }, []);

  const completeCommitment = useCallback(async (commitmentId) => {
    try {
      await client.patch(`/commitments/${commitmentId}`, { status: 'completed' });
      setCommitments(prev => 
        prev.map(c => c.id === commitmentId ? { ...c, status: 'completed' } : c)
      );
    } catch (err) {
      // Optimistic update
      setCommitments(prev => 
        prev.map(c => c.id === commitmentId ? { ...c, status: 'completed' } : c)
      );
    }
  }, []);

  const breakCommitment = useCallback(async (commitmentId, reason) => {
    try {
      await client.patch(`/commitments/${commitmentId}`, { status: 'broken', breakReason: reason });
      setCommitments(prev => 
        prev.map(c => c.id === commitmentId ? { ...c, status: 'broken', breakReason: reason } : c)
      );
    } catch (err) {
      setCommitments(prev => 
        prev.map(c => c.id === commitmentId ? { ...c, status: 'broken', breakReason: reason } : c)
      );
    }
  }, []);

  const activeCommitments = commitments.filter(c => c.status === 'active');
  const atRisk = activeCommitments.filter(c => {
    if (!c.deadline) return false;
    const deadline = new Date(c.deadline);
    const now = new Date();
    const hoursRemaining = (deadline - now) / (1000 * 60 * 60);
    return hoursRemaining < 24 && hoursRemaining > 0;
  });

  return {
    commitments,
    activeCommitments,
    atRisk,
    loading,
    addCommitment,
    completeCommitment,
    breakCommitment,
    refresh: fetchCommitments,
  };
}

function getMockCommitments() {
  const now = new Date();
  return [
    {
      id: 'c1',
      text: 'Ship the momentum engine by Friday',
      deadline: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      projectId: 'p1',
    },
    {
      id: 'c2',
      text: 'Review all pending PRs',
      deadline: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      projectId: 'p1',
    },
    {
      id: 'c3',
      text: 'Complete documentation for API v2',
      deadline: null,
      status: 'completed',
      createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
      projectId: 'p2',
    },
  ];
}

export default useCommitments;
