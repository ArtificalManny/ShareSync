// src/api/handoff.js - Week 8 Day 5-6
import api from './index';

/**
 * Request help on a task (hand-off)
 */
export const requestHandoff = async (handoffData) => {
  const response = await api.post('/api/handoffs/request', handoffData);
  return response.data;
};

/**
 * Accept a hand-off request
 */
export const acceptHandoff = async (requestId) => {
  const response = await api.post(`/api/handoffs/${requestId}/accept`);
  return response.data;
};

/**
 * Decline a hand-off request
 */
export const declineHandoff = async (requestId) => {
  const response = await api.post(`/api/handoffs/${requestId}/decline`);
  return response.data;
};

/**
 * Get pending hand-off requests for current user
 */
export const getPendingHandoffs = async () => {
  const response = await api.get('/api/handoffs/pending');
  return response.data;
};

export default {
  requestHandoff,
  acceptHandoff,
  declineHandoff,
  getPendingHandoffs
};
