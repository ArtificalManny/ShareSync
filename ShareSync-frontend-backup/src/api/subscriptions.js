// src/api/subscriptions.js
import api from './client';

export async function getCurrentSubscription() {
  const response = await api.get('/subscriptions/current');
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

export default { getCurrentSubscription, getUsage, getPlans, createCheckout, createPortalSession, cancelSubscription, resumeSubscription, updateBudgetCap, updateBillingDetails, checkLimit };
