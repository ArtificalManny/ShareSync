import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Crown,
  Zap,
  Folder,
  Sparkles,
  HardDrive,
  Users,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import api from '../../api/client';
import PricingModal from './PricingModal';
import { useProjectUsageCount } from '../../hooks/useProjectUsageCount';

const REFRESH_INTERVAL_MS = 30000;

const FALLBACK_SUBSCRIPTION = {
  plan: 'free',
  status: 'active',
  billingInterval: 'monthly',
  usage: {
    projects: 0,
    aiCallsThisMonth: 0,
    aiCalls: 0,
    storage: 0,
    storageBytes: 0,
    storageUsedBytes: 0,
  },
  limits: {
    projects: 10,
    membersPerProject: 5,
    aiCallsPerMonth: 100,
    storageBytes: 1024 * 1024 * 1024,
  },
};

function unwrapPayload(responseOrValue) {
  return responseOrValue?.data?.data || responseOrValue?.data || responseOrValue || {};
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mergeSubscription(value) {
  const next = unwrapPayload(value);

  return {
    ...FALLBACK_SUBSCRIPTION,
    ...next,
    usage: {
      ...FALLBACK_SUBSCRIPTION.usage,
      ...(next?.usage || {}),
    },
    limits: {
      ...FALLBACK_SUBSCRIPTION.limits,
      ...(next?.limits || {}),
    },
  };
}

function formatNumber(value) {
  return toNumber(value, 0).toLocaleString();
}

function formatBytes(bytes) {
  const safeBytes = toNumber(bytes, 0);

  if (safeBytes >= 1024 * 1024 * 1024) {
    const gb = safeBytes / 1024 / 1024 / 1024;
    return `${gb.toFixed(gb >= 10 ? 0 : 1)}GB`;
  }

  const mb = safeBytes / 1024 / 1024;
  return `${Math.round(mb)}MB`;
}

function getPlanLabel(plan) {
  if (plan === 'team') return 'Team';
  if (plan === 'enterprise') return 'Enterprise';
  return 'Free';
}

function isActivePaidPlan(subscription) {
  const plan = String(subscription?.plan || 'free').toLowerCase();
  const status = String(subscription?.status || 'active').toLowerCase();

  return plan !== 'free' && ['active', 'trialing'].includes(status);
}

function UsageBar({ value, max, color = 'bg-violet-500', premium = false }) {
  const safeValue = toNumber(value, 0);
  const safeMax = toNumber(max, 0);
  const isUnlimited = safeMax === -1;

  const pct = isUnlimited
    ? 100
    : safeMax <= 0
      ? 0
      : Math.min((safeValue / safeMax) * 100, 100);

  const warn = !isUnlimited && pct >= 80;

  const barColor = premium
    ? 'bg-gradient-to-r from-amber-400 via-violet-500 to-cyan-400'
    : warn
      ? 'bg-amber-500'
      : color;

  return (
    <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function UsageRow({
  icon: Icon,
  label,
  used,
  limit,
  color = 'bg-violet-500',
  suffix = '',
  formatter = formatNumber,
  premium = false,
}) {
  const safeUsed = toNumber(used, 0);
  const safeLimit = toNumber(limit, 0);
  const isUnlimited = safeLimit === -1;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon
            className={`w-3.5 h-3.5 ${
              premium
                ? 'text-amber-500 dark:text-amber-300'
                : 'text-slate-400 dark:text-zinc-500'
            }`}
          />
          <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">
            {label}
          </span>
        </div>

        <span className="text-xs font-bold text-slate-800 dark:text-white">
          {formatter(safeUsed)}
          <span className="font-normal text-slate-400 dark:text-zinc-500">
            {' '}/ {isUnlimited ? '∞' : formatter(safeLimit)}
            {suffix}
          </span>
        </span>
      </div>

      <UsageBar
        value={safeUsed}
        max={isUnlimited ? -1 : safeLimit}
        color={color}
        premium={premium}
      />
    </div>
  );
}

function FeaturePill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-white/70 px-2 py-1 text-[10px] font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
      {children}
    </span>
  );
}

export default function SubscriptionButton() {
  const location = useLocation();
  const [subscription, setSubscription] = useState(FALLBACK_SUBSCRIPTION);
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const dropRef = useRef(null);
  const mountedRef = useRef(false);

  const {
    projectCount,
    refresh: refreshProjectCount,
  } = useProjectUsageCount({ refreshMs: REFRESH_INTERVAL_MS });

  const loadSubscription = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      const response = await api.get('/subscriptions/current');
      const next = mergeSubscription(response);

      if (!mountedRef.current) return;

      setSubscription(next);
      setLastLoadedAt(Date.now());
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      if (!silent && mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadSubscription({ silent: true });

    return () => {
      mountedRef.current = false;
    };
  }, [loadSubscription]);

  useEffect(() => {
    if (!showDropdown) return undefined;

    loadSubscription({ silent: true });

    const close = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', close);

    return () => {
      document.removeEventListener('mousedown', close);
    };
  }, [showDropdown, loadSubscription]);

  useEffect(() => {
    const id = window.setInterval(() => {
      loadSubscription({ silent: true });
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [loadSubscription]);

  useEffect(() => {
    loadSubscription({ silent: true });
  }, [location.pathname, location.search, loadSubscription]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const checkoutSucceeded = params.get('subscription') === 'success';
    const hasSessionId = Boolean(params.get('session_id'));

    if (!checkoutSucceeded && !hasSessionId) return undefined;

    const timers = [
      window.setTimeout(() => loadSubscription({ silent: true }), 250),
      window.setTimeout(() => loadSubscription({ silent: true }), 1000),
      window.setTimeout(() => loadSubscription({ silent: true }), 2500),
      window.setTimeout(() => loadSubscription({ silent: true }), 5000),
    ];

    window.dispatchEvent(new Event('subscription:refresh'));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [location.search, loadSubscription]);

  useEffect(() => {
    const refresh = () => loadSubscription({ silent: true });

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('subscription:refresh', refresh);
    window.addEventListener('subscription:changed', refresh);
    window.addEventListener('vault:storage-updated', refresh);
    window.addEventListener('ai:usage-updated', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('subscription:refresh', refresh);
      window.removeEventListener('subscription:changed', refresh);
      window.removeEventListener('vault:storage-updated', refresh);
      window.removeEventListener('ai:usage-updated', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [loadSubscription]);

  const handleUpgrade = async (plan) => {
    setLoading(true);

    try {
      const response = await api.post('/subscriptions/checkout', { plan });
      const url = response.data?.data?.url || response.data?.url;

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
    } finally {
      setLoading(false);
    }
  };

  const plan = String(subscription?.plan || 'free').toLowerCase();
  const isPremium = isActivePaidPlan(subscription);

  const usage = subscription?.usage || {};
  const limits = subscription?.limits || {};

  const subscriptionProjectsUsed = toNumber(usage.projects, 0);
  const projectsUsed = toNumber(
    projectCount ?? subscriptionProjectsUsed,
    subscriptionProjectsUsed
  );
  const projectsLimit = toNumber(limits.projects, 10);

  const displayUsage = useMemo(
    () => ({
      ...usage,
      projects: projectsUsed,
    }),
    [usage, projectsUsed]
  );

  const aiUsed = toNumber(usage.aiCallsThisMonth ?? usage.aiCalls, 0);
  const aiLimit = toNumber(limits.aiCallsPerMonth, 100);

  const storageUsed = toNumber(
    usage.storageBytes ?? usage.storageUsedBytes ?? usage.storage,
    0
  );
  const storageLimit = toNumber(limits.storageBytes, 1024 * 1024 * 1024);

  const membersUsed = toNumber(
    usage.membersPerProject ?? usage.maxMembersInProject ?? subscription?.activeMembers,
    0
  );
  const membersLimit = toNumber(limits.membersPerProject, 5);

  const primaryPct =
    projectsLimit > 0 ? Math.min((projectsUsed / projectsLimit) * 100, 100) : 0;

  const planLabel = getPlanLabel(plan);

  const refreshAgeLabel = useMemo(() => {
    if (!lastLoadedAt) return 'Loading usage...';

    const seconds = Math.max(0, Math.round((Date.now() - lastLoadedAt) / 1000));

    if (seconds < 5) return 'Updated now';
    if (seconds < 60) return `Updated ${seconds}s ago`;

    return 'Updated recently';
  }, [lastLoadedAt, showDropdown]);

  const titleLabel = isPremium
    ? `${planLabel} Plan active`
    : `${planLabel} Plan usage`;

  const buttonMainLabel = isPremium
    ? `${planLabel} Plan`
    : `${projectsUsed}/${projectsLimit === -1 ? '∞' : projectsLimit} projects`;

  const buttonSubLabel = isPremium
    ? `${projectsUsed}/${projectsLimit === -1 ? '∞' : projectsLimit} projects`
    : 'Free usage';

  return (
    <div className="relative" ref={dropRef}>
      <button
        type="button"
        onClick={() => setShowDropdown((current) => !current)}
        className={`relative flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isPremium
            ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-violet-600 text-white shadow-sm shadow-amber-500/25 hover:shadow-md hover:-translate-y-0.5'
            : 'bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-300 hover:border-violet-300 dark:hover:border-violet-500/30 shadow-sm'
        }`}
        title={titleLabel}
      >
        {isPremium ? (
          <Crown className="w-3.5 h-3.5" />
        ) : (
          <Zap className="w-3.5 h-3.5 text-violet-500" />
        )}

        <div className="flex flex-col items-start leading-none">
          <span className="text-[11px] font-bold">
            {buttonMainLabel}
          </span>

          <span
            className={`text-[9px] font-bold mt-0.5 ${
              isPremium
                ? 'text-white/80'
                : 'text-slate-400 dark:text-zinc-500'
            }`}
          >
            {buttonSubLabel}
          </span>

          <div className="w-16 h-0.5 mt-0.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                primaryPct >= 80 && !isPremium
                  ? 'bg-amber-500'
                  : isPremium
                    ? 'bg-white/75'
                    : 'bg-violet-500'
              }`}
              style={{ width: `${primaryPct}%` }}
            />
          </div>
        </div>

        {isPremium && (
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#1a1a1f]" />
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1a1a1f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-none overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] ${
              isPremium
                ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-violet-50 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-violet-500/10'
                : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`grid h-9 w-9 place-items-center rounded-xl ${
                    isPremium
                      ? 'bg-gradient-to-br from-amber-400 to-violet-600 text-white shadow-sm shadow-amber-500/25'
                      : 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300'
                  }`}
                >
                  {isPremium ? (
                    <Crown className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <span className="block text-sm font-bold text-slate-800 dark:text-white">
                    {planLabel} Plan
                  </span>
                  <span className="block text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                    {isPremium ? 'Premium limits unlocked' : refreshAgeLabel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loadSubscription({ silent: true });
                    refreshProjectCount();
                  }}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:text-violet-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-500 dark:hover:text-violet-300"
                  title="Refresh subscription"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                {!isPremium && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      setShowModal(true);
                    }}
                    className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </div>

            {isPremium && (
              <div className="mt-3 rounded-2xl border border-amber-200/80 bg-white/70 p-3 dark:border-amber-400/20 dark:bg-white/[0.04]">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Team features active
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <FeaturePill>50 projects</FeaturePill>
                  <FeaturePill>25 members/project</FeaturePill>
                  <FeaturePill>10GB storage</FeaturePill>
                  <FeaturePill>1,000 AI calls/mo</FeaturePill>
                </div>
              </div>
            )}

            {!isPremium && (
              <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-3 dark:border-violet-400/20 dark:bg-violet-500/10">
                <div className="text-xs font-bold text-violet-700 dark:text-violet-200">
                  Upgrade to Team
                </div>
                <div className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">
                  Unlock 50 projects, 25 members per project, 10GB storage, and 1,000 AI calls per month.
                </div>
              </div>
            )}
          </div>

          <div className="p-4 space-y-4">
            <UsageRow
              icon={Folder}
              label="Projects"
              used={projectsUsed}
              limit={projectsLimit}
              color="bg-violet-500"
              premium={isPremium}
            />

            <UsageRow
              icon={Sparkles}
              label="AI Calls"
              used={aiUsed}
              limit={aiLimit}
              color="bg-blue-500"
              suffix="/mo"
              premium={isPremium}
            />

            <UsageRow
              icon={HardDrive}
              label="Storage"
              used={storageUsed}
              limit={storageLimit}
              color="bg-teal-500"
              formatter={formatBytes}
              premium={isPremium}
            />

            <UsageRow
              icon={Users}
              label="Members/Project"
              used={membersUsed}
              limit={membersLimit}
              color="bg-emerald-500"
              premium={isPremium}
            />
          </div>

          <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
            <button
              type="button"
              onClick={() => {
                setShowDropdown(false);
                setShowModal(true);
              }}
              className="w-full flex items-center justify-between text-sm font-medium text-slate-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <span>{isPremium ? 'Manage plan' : 'View all plans'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <PricingModal
          currentPlan={plan}
          usage={displayUsage}
          limits={limits}
          onUpgrade={handleUpgrade}
          onClose={() => setShowModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
}
