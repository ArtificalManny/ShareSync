// src/api/subscriptions.js
import api from './client';

export async function getCurrentSubscription() {
  const response = await api.get('/subscriptions/current');
  return response.data?.data || response.data;
}

// openshare-downgrade-selection-api-v1
//
// These helpers mirror the backend downgrade-selection endpoints.
// They intentionally contain no lifecycle/business logic; the backend remains
// authoritative for limits, ownership, accepted membership, and validation.
export async function getDowngradeProjectSelection() {
  const response = await api.get(
    '/subscriptions/downgrade/projects'
  );

  return response.data?.data || response.data;
}

export async function updateDowngradeProjectSelection(
  projectIds
) {
  const response = await api.patch(
    '/subscriptions/downgrade/projects',
    {
      projectIds,
    }
  );

  return response.data?.data || response.data;
}

export async function getDowngradeMemberSelection() {
  const response = await api.get(
    '/subscriptions/downgrade/members'
  );

  return response.data?.data || response.data;
}

export async function updateDowngradeMemberSelection(
  memberUserIds
) {
  const response = await api.patch(
    '/subscriptions/downgrade/members',
    {
      memberUserIds,
    }
  );

  return response.data?.data || response.data;
}

export async function getUsage() {
  const response = await api.get('/subscriptions/usage');
  return response.data?.data || response.data;
}

export async function getPlans() {
  const response = await api.get('/subscriptions/plans');
  return response.data?.data || response.data;
}

export async function createCheckout({ plan, interval = 'monthly' }) {
  const response = await api.post('/subscriptions/checkout', { plan, interval });
  return response.data?.data || response.data;
}

export async function createPortalSession() {
  const response = await api.post('/subscriptions/portal');
  return response.data?.data || response.data;
}

export async function cancelSubscription() {
  const response = await api.post('/subscriptions/cancel');
  return response.data;
}

export async function resumeSubscription() {
  const response = await api.post('/subscriptions/resume');
  return response.data;
}

export async function updateBudgetCap(params) {
  const response = await api.patch('/subscriptions/budget-cap', params);
  return response.data;
}

export async function updateBillingDetails(details) {
  const response = await api.patch('/subscriptions/billing-details', details);
  return response.data;
}

export async function checkLimit(resource) {
  const response = await api.get(`/subscriptions/check-limit/${resource}`);
  return response.data?.data || response.data;
}

export default {
  getCurrentSubscription,
  getDowngradeProjectSelection,
  updateDowngradeProjectSelection,
  getDowngradeMemberSelection,
  updateDowngradeMemberSelection,
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
