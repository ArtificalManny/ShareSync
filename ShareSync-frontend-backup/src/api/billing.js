// src/api/billing.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE L: Billing & Plan Management API
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

// Plan tier definitions
export const PLAN_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    color: 'text-text-tertiary',
    bg: 'bg-surface-2',
    limits: {
      projects: 3,
      membersPerProject: 5,
      storageGB: 1,
      aiCredits: 100,
      historyDays: 30,
      shipsPerMonth: 50,
    },
    features: [
      'Up to 3 projects',
      '5 members per project',
      '1 GB storage',
      '100 AI credits/month',
      '30-day history',
    ],
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price: 12,
    color: 'text-brand',
    bg: 'bg-brand/10',
    limits: {
      projects: 10,
      membersPerProject: 15,
      storageGB: 10,
      aiCredits: 1000,
      historyDays: 365,
      shipsPerMonth: 500,
    },
    features: [
      'Up to 10 projects',
      '15 members per project',
      '10 GB storage',
      '1,000 AI credits/month',
      '1-year history',
      'Priority support',
      'Advanced analytics',
    ],
  },
  team: {
    id: 'team',
    name: 'Team',
    price: 29,
    color: 'text-success',
    bg: 'bg-success/10',
    limits: {
      projects: -1, // unlimited
      membersPerProject: -1,
      storageGB: 100,
      aiCredits: 10000,
      historyDays: -1, // unlimited
      shipsPerMonth: -1,
    },
    features: [
      'Unlimited projects',
      'Unlimited members',
      '100 GB storage',
      '10,000 AI credits/month',
      'Unlimited history',
      'Priority support',
      'Advanced analytics',
      'Custom integrations',
      'SSO & SAML',
      'Admin dashboard',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // Contact sales
    color: 'text-warning',
    bg: 'bg-warning/10',
    limits: {
      projects: -1,
      membersPerProject: -1,
      storageGB: -1,
      aiCredits: -1,
      historyDays: -1,
      shipsPerMonth: -1,
    },
    features: [
      'Everything in Team',
      'Unlimited storage',
      'Unlimited AI credits',
      'Dedicated support',
      'Custom SLA',
      'On-premise option',
      'Custom contracts',
    ],
  },
};

/**
 * Get current user's plan and usage
 */
export async function getPlanAndUsage() {
  try {
    const response = await client.get('/users/me/plan');
    return response.data;
  } catch (error) {
    console.error('[Billing API] Plan error:', error);
    return getMockPlanAndUsage();
  }
}

/**
 * Get organization's billing info (for team admins)
 */
export async function getOrgBilling(orgId) {
  try {
    const response = await client.get(`/organizations/${orgId}/billing`);
    return response.data;
  } catch (error) {
    console.error('[Billing API] Org billing error:', error);
    return getMockOrgBilling(orgId);
  }
}

/**
 * Check if a specific feature is available
 */
export async function checkFeatureAccess(feature) {
  try {
    const response = await client.get(`/users/me/features/${feature}`);
    return response.data;
  } catch (error) {
    console.error('[Billing API] Feature check error:', error);
    return { allowed: false, reason: 'Unable to verify' };
  }
}

/**
 * Get upgrade options for current plan
 */
export async function getUpgradeOptions() {
  try {
    const response = await client.get('/billing/upgrade-options');
    return response.data;
  } catch (error) {
    console.error('[Billing API] Upgrade options error:', error);
    return getMockUpgradeOptions();
  }
}

/**
 * Create checkout session for plan upgrade
 */
export async function createCheckoutSession(planId, billingCycle = 'monthly') {
  try {
    const response = await client.post('/billing/checkout', { planId, billingCycle });
    return response.data;
  } catch (error) {
    console.error('[Billing API] Checkout error:', error);
    throw error;
  }
}

/**
 * Get billing history
 */
export async function getBillingHistory() {
  try {
    const response = await client.get('/billing/history');
    return response.data;
  } catch (error) {
    console.error('[Billing API] History error:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

function getMockPlanAndUsage() {
  return {
    plan: PLAN_TIERS.free,
    planId: 'free',
    billingCycle: null,
    nextBillingDate: null,
    usage: {
      projects: { used: 2, limit: 3, percentage: 67 },
      storage: { used: 0.4, limit: 1, percentage: 40, unit: 'GB' },
      aiCredits: { used: 45, limit: 100, percentage: 45 },
      historyDays: { used: 30, limit: 30, percentage: 100 },
      shipsThisMonth: { used: 12, limit: 50, percentage: 24 },
    },
    role: 'owner', // owner | admin | member
    canManageBilling: true,
  };
}

function getMockOrgBilling(orgId) {
  return {
    orgId,
    plan: PLAN_TIERS.team,
    seats: { used: 8, limit: 15 },
    billingEmail: 'billing@company.com',
    nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    monthlyTotal: 232, // 8 seats × $29
  };
}

function getMockUpgradeOptions() {
  return {
    currentPlan: 'free',
    options: [
      {
        ...PLAN_TIERS.plus,
        monthlyPrice: 12,
        yearlyPrice: 120, // 2 months free
        savings: '17%',
        recommended: true,
      },
      {
        ...PLAN_TIERS.team,
        monthlyPrice: 29,
        yearlyPrice: 290,
        savings: '17%',
        recommended: false,
      },
    ],
  };
}

export default {
  PLAN_TIERS,
  getPlanAndUsage,
  getOrgBilling,
  checkFeatureAccess,
  getUpgradeOptions,
  createCheckoutSession,
  getBillingHistory,
};
