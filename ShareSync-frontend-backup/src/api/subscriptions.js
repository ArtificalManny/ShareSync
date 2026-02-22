// src/api/subscriptions.js
// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTIONS API - Frontend client for subscription management
// ═══════════════════════════════════════════════════════════════════════════════

import api from './client';

/**
 * Get current user's subscription
 */
export async function getCurrentSubscription() {
  const response = await api.get('/api/subscriptions/current');
  return response.data?.data || response.data;
}

/**
 * Get usage and limits
 */
export async function getUsage() {
  const response = await api.get('/api/subscriptions/usage');
  return response.data?.data || response.data;
}

/**
 * Get all available plans
 */
export async function getPlans() {
  const response = await api.get('/api/subscriptions/plans');
  return response.data?.data || response.data;
}

/**
 * Create checkout session for upgrade
 * @param {Object} params
 * @param {string} params.plan - 'team' or 'enterprise'
 * @param {string} [params.interval='monthly'] - 'monthly' or 'yearly'
 */
export async function createCheckout({ plan, interval = 'monthly' }) {
  const response = await api.post('/api/subscriptions/checkout', { plan, interval });
  return response.data?.data || response.data;
}

/**
 * Create billing portal session
 */
export async function createPortalSession() {
  const response = await api.post('/api/subscriptions/portal');
  return response.data?.data || response.data;
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription() {
  const response = await api.post('/api/subscriptions/cancel');
  return response.data;
}

/**
 * Resume canceled subscription
 */
export async function resumeSubscription() {
  const response = await api.post('/api/subscriptions/resume');
  return response.data;
}

/**
 * Update budget cap settings
 * @param {Object} params
 * @param {number} [params.budgetCapCents]
 * @param {boolean} [params.budgetCapEnabled]
 */
export async function updateBudgetCap(params) {
  const response = await api.patch('/api/subscriptions/budget-cap', params);
  return response.data;
}

/**
 * Update billing details
 */
export async function updateBillingDetails(details) {
  const response = await api.patch('/api/subscriptions/billing-details', details);
  return response.data;
}

/**
 * Check resource limit
 * @param {string} resource - 'projects' | 'storage' | 'aiCalls'
 */
export async function checkLimit(resource) {
  const response = await api.get(`/api/subscriptions/check-limit/${resource}`);
  return response.data?.data || response.data;
}

export default {
  getCurrentSubscription,
  getUsage,
  getPlans,
  createCheckout,
  createPortalSession,
  cancelSubscription,
  resumeSubscription,
  updateBudgetCap,
  updateBillingDetails,
  checkLimit,
};
