import React, { useState, useEffect, useRef } from 'react';
import { Crown, Zap, Folder, Sparkles, HardDrive, ChevronRight } from 'lucide-react';
import api from '../../api/client';
import PricingModal from './PricingModal';

function UsageBar({ value, max, color = 'bg-violet-500' }) {
  const pct = max <= 0 ? 0 : Math.min((value / max) * 100, 100);
  const warn = pct >= 80;
  return (
    <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
      <div
        className={"h-full rounded-full transition-all duration-500 " + (warn ? 'bg-amber-500' : color)}
        style={{ width: pct + '%' }}
      />
    </div>
  );
}

export default function SubscriptionButton() {
  const [subscription, setSubscription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDropdown(false);
    };
    if (showDropdown) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showDropdown]);

  const loadSubscription = async () => {
    try {
      const response = await api.get('/subscriptions/current');
      const d = response.data?.data || response.data;
      setSubscription(d);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const handleUpgrade = async (plan) => {
    setLoading(true);
    try {
      const response = await api.post('/subscriptions/checkout', { plan });
      const url = response.data?.data?.url || response.data?.url;
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout:', error);
    } finally {
      setLoading(false);
    }
  };

  const plan = subscription?.plan || 'free';
  const isPremium = plan !== 'free';
  const usage = subscription?.usage || {};
  const limits = subscription?.limits || {};

  // Primary usage metric for the pill
  const projectsUsed = usage.projects || 0;
  const projectsLimit = limits.projects || 10;
  const aiUsed = usage.aiCallsThisMonth || usage.aiCalls || 0;
  const aiLimit = limits.aiCallsPerMonth || 100;
  const primaryPct = projectsLimit > 0 ? Math.min((projectsUsed / projectsLimit) * 100, 100) : 0;

  const planLabel = plan === 'team' ? 'Team' : plan === 'enterprise' ? 'Enterprise' : 'Free';

  return (
    <div className="relative" ref={dropRef}>
      {/* ── Navbar Pill ── */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={"flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 " + (
          isPremium
            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-500/20 hover:shadow-md hover:-translate-y-0.5'
            : 'bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-300 hover:border-violet-300 dark:hover:border-violet-500/30 shadow-sm'
        )}
      >
        {isPremium ? (
          <Crown className="w-3.5 h-3.5" />
        ) : (
          <Zap className="w-3.5 h-3.5 text-violet-500" />
        )}
        <div className="flex flex-col items-start leading-none">
          <span className="text-[11px] font-bold">{projectsUsed}/{projectsLimit} projects</span>
          <div className="w-16 h-0.5 mt-0.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className={"h-full rounded-full transition-all " + (primaryPct >= 80 ? 'bg-amber-500' : isPremium ? 'bg-white/60' : 'bg-violet-500')}
              style={{ width: primaryPct + '%' }}
            />
          </div>
        </div>
      </button>

      {/* ── Usage Dropdown ── */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#1a1a1f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-none overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Plan header */}
          <div className={"px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] " + (
            isPremium ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10' : ''
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPremium ? <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <Zap className="w-4 h-4 text-violet-500" />}
                <span className="text-sm font-bold text-slate-800 dark:text-white">{planLabel} Plan</span>
              </div>
              {!isPremium && (
                <button
                  onClick={() => { setShowDropdown(false); setShowModal(true); }}
                  className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>

          {/* Usage items */}
          <div className="p-4 space-y-4">
            <UsageRow icon={Folder} label="Projects" used={projectsUsed} limit={projectsLimit} color="bg-violet-500" />
            <UsageRow icon={Sparkles} label="AI Calls" used={aiUsed} limit={aiLimit} color="bg-blue-500" suffix="/mo" />
            <UsageRow
              icon={HardDrive}
              label="Storage"
              used={Math.round((usage.storage || 0) / 1024 / 1024)}
              limit={Math.round((limits.storageBytes || 1073741824) / 1024 / 1024)}
              color="bg-teal-500"
              unit="MB"
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
            <button
              onClick={() => { setShowDropdown(false); setShowModal(true); }}
              className="w-full flex items-center justify-between text-sm font-medium text-slate-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <span>{isPremium ? 'Manage plan' : 'View all plans'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Pricing Modal ── */}
      {showModal && (
        <PricingModal
          currentPlan={plan}
          usage={usage}
          limits={limits}
          onUpgrade={handleUpgrade}
          onClose={() => setShowModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
}

function UsageRow({ icon: Icon, label, used, limit, color = 'bg-violet-500', unit = '', suffix = '' }) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const warn = pct >= 80;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
          <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">{label}</span>
        </div>
        <span className="text-xs font-bold text-slate-800 dark:text-white">
          {used.toLocaleString()}{unit}
          <span className="font-normal text-slate-400 dark:text-zinc-500">
            {' '}/ {isUnlimited ? '\u221e' : limit.toLocaleString() + unit}{suffix}
          </span>
        </span>
      </div>
      <UsageBar value={used} max={isUnlimited ? 1 : limit} color={warn ? 'bg-amber-500' : color} />
    </div>
  );
}
