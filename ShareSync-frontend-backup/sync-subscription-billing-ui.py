from pathlib import Path
import shutil
import datetime
import re

root = Path.cwd()

billing_path = root / "src/components/settings/BillingSettings.jsx"
subscription_button_path = root / "src/components/subscription/SubscriptionButton.jsx"
theme_path = root / "src/theme.css"

stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")

def backup(path):
    if path.exists():
        backup_path = path.with_suffix(path.suffix + f".backup-before-billing-sync-{stamp}")
        shutil.copy2(path, backup_path)
        return backup_path
    return None

billing_backup = backup(billing_path)
button_backup = backup(subscription_button_path)
theme_backup = backup(theme_path)

billing_code = r'''import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Crown,
  Folder,
  Sparkles,
  HardDrive,
  Users,
  CreditCard,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import api from "../../api/client";
import { useProjectUsageCount } from "../../hooks/useProjectUsageCount";

const REFRESH_INTERVAL_MS = 30000;

const FALLBACK_SUBSCRIPTION = {
  plan: "free",
  status: "active",
  billingInterval: "monthly",
  usage: {
    projects: 0,
    aiCallsThisMonth: 0,
    aiCalls: 0,
    storage: 0,
    storageBytes: 0,
    storageUsedBytes: 0,
    membersPerProject: 0,
    maxMembersInProject: 0,
  },
  limits: {
    projects: 10,
    membersPerProject: 5,
    aiCallsPerMonth: 100,
    storageBytes: 1024 * 1024 * 1024,
  },
};

const PLAN_LIMIT_DEFAULTS = {
  free: {
    projects: 10,
    membersPerProject: 5,
    aiCallsPerMonth: 100,
    storageBytes: 1024 * 1024 * 1024,
  },
  team: {
    projects: 50,
    membersPerProject: 25,
    aiCallsPerMonth: 1000,
    storageBytes: 10 * 1024 * 1024 * 1024,
  },
  enterprise: {
    projects: -1,
    membersPerProject: -1,
    aiCallsPerMonth: -1,
    storageBytes: -1,
  },
};

function unwrapPayload(responseOrValue) {
  return responseOrValue?.data?.data || responseOrValue?.data || responseOrValue || {};
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getPlanKey(plan) {
  const normalized = String(plan || "free").toLowerCase();
  if (normalized === "team") return "team";
  if (normalized === "enterprise") return "enterprise";
  return "free";
}

function mergeSubscription(value) {
  const next = unwrapPayload(value);
  const planKey = getPlanKey(next?.plan || FALLBACK_SUBSCRIPTION.plan);
  const planDefaults = PLAN_LIMIT_DEFAULTS[planKey] || PLAN_LIMIT_DEFAULTS.free;

  return {
    ...FALLBACK_SUBSCRIPTION,
    ...next,
    plan: planKey,
    usage: {
      ...FALLBACK_SUBSCRIPTION.usage,
      ...(next?.usage || {}),
    },
    limits: {
      ...FALLBACK_SUBSCRIPTION.limits,
      ...planDefaults,
      ...(next?.limits || {}),
    },
  };
}

function formatNumber(value) {
  return toNumber(value, 0).toLocaleString();
}

function formatBytes(bytes) {
  const safeBytes = toNumber(bytes, 0);

  if (safeBytes === -1) return "∞";

  if (safeBytes >= 1024 * 1024 * 1024) {
    const gb = safeBytes / 1024 / 1024 / 1024;
    return `${gb.toFixed(gb >= 10 ? 0 : 1)}GB`;
  }

  const mb = safeBytes / 1024 / 1024;
  return `${Math.round(mb)}MB`;
}

function getStorageBytesFromUsage(usage = {}) {
  const explicitBytes = usage.storageBytes ?? usage.storageUsedBytes;

  if (explicitBytes !== undefined && explicitBytes !== null) {
    return toNumber(explicitBytes, 0);
  }

  const legacyStorage = toNumber(usage.storage, 0);

  // Legacy fallback:
  // Some older billing cards stored storage as MB, while the subscription
  // dropdown expects bytes. Treat small legacy values as MB.
  if (legacyStorage > 0 && legacyStorage < 1024 * 1024) {
    return legacyStorage * 1024 * 1024;
  }

  return legacyStorage;
}

function getPlanLabel(plan) {
  if (plan === "team") return "Team";
  if (plan === "enterprise") return "Enterprise";
  return "Free";
}

function getPlanPrice(plan, interval) {
  if (plan === "enterprise") return "Custom";
  if (plan === "team") return interval === "yearly" ? "$390/year" : "$39/month";
  return "$0/month";
}

function isActivePaidPlan(subscription) {
  const plan = String(subscription?.plan || "free").toLowerCase();
  const status = String(subscription?.status || "active").toLowerCase();

  return plan !== "free" && ["active", "trialing"].includes(status);
}

function UsageBar({ value, max, premium = false }) {
  const safeValue = toNumber(value, 0);
  const safeMax = toNumber(max, 0);
  const isUnlimited = safeMax === -1;

  const pct = isUnlimited
    ? 100
    : safeMax <= 0
      ? 0
      : Math.min((safeValue / safeMax) * 100, 100);

  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/[0.08]">
      <div
        className={
          "h-full rounded-full transition-all duration-500 " +
          (premium
            ? "bg-gradient-to-r from-amber-400 via-violet-500 to-cyan-400"
            : pct >= 80
              ? "bg-amber-500"
              : "bg-teal-500")
        }
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function UsageMetric({
  icon: Icon,
  label,
  used,
  limit,
  formatter = formatNumber,
  suffix = "",
  premium = false,
}) {
  const safeUsed = toNumber(used, 0);
  const safeLimit = toNumber(limit, 0);
  const isUnlimited = safeLimit === -1;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.045]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon
            className={
              "h-4 w-4 " +
              (premium
                ? "text-amber-500 dark:text-amber-300"
                : "text-slate-400 dark:text-zinc-500")
            }
          />
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            {label}
          </span>
        </div>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black text-slate-950 dark:text-white">
          {formatter(safeUsed)}
        </span>
        <span className="text-sm font-medium text-slate-400 dark:text-zinc-500">
          / {isUnlimited ? "∞" : formatter(safeLimit)}
          {suffix}
        </span>
      </div>

      <UsageBar value={safeUsed} max={safeLimit} premium={premium} />
    </div>
  );
}

function FeaturePill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-white/70 px-2.5 py-1 text-[10px] font-black text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200">
      {children}
    </span>
  );
}

export default function BillingSettings() {
  const [subscription, setSubscription] = useState(FALLBACK_SUBSCRIPTION);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const mountedRef = useRef(false);

  const {
    projectCount,
    refresh: refreshProjectCount,
  } = useProjectUsageCount({ refreshMs: REFRESH_INTERVAL_MS });

  const loadSubscription = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      const response = await api.get("/subscriptions/current");
      const next = mergeSubscription(response);

      if (!mountedRef.current) return;

      setSubscription(next);
      setLastLoadedAt(Date.now());
    } catch (error) {
      console.error("Failed to load billing settings:", error);
    } finally {
      if (!silent && mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadSubscription({ silent: true });

    const interval = window.setInterval(() => {
      loadSubscription({ silent: true });
    }, REFRESH_INTERVAL_MS);

    const refresh = () => loadSubscription({ silent: true });

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("subscription:refresh", refresh);
    window.addEventListener("subscription:changed", refresh);
    window.addEventListener("vault:storage-updated", refresh);
    window.addEventListener("ai:usage-updated", refresh);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("subscription:refresh", refresh);
      window.removeEventListener("subscription:changed", refresh);
      window.removeEventListener("vault:storage-updated", refresh);
      window.removeEventListener("ai:usage-updated", refresh);
    };
  }, [loadSubscription]);

  const plan = getPlanKey(subscription?.plan);
  const planLabel = getPlanLabel(plan);
  const isPremium = isActivePaidPlan(subscription);

  const usage = subscription?.usage || {};
  const limits = subscription?.limits || {};

  const subscriptionProjectsUsed = toNumber(usage.projects, 0);
  const projectsUsed = toNumber(
    projectCount ?? subscriptionProjectsUsed,
    subscriptionProjectsUsed
  );
  const projectsLimit = toNumber(limits.projects, PLAN_LIMIT_DEFAULTS[plan].projects);

  const aiUsed = toNumber(usage.aiCallsThisMonth ?? usage.aiCalls, 0);
  const aiLimit = toNumber(limits.aiCallsPerMonth, PLAN_LIMIT_DEFAULTS[plan].aiCallsPerMonth);

  const storageUsed = getStorageBytesFromUsage(usage);
  const storageLimit = toNumber(limits.storageBytes, PLAN_LIMIT_DEFAULTS[plan].storageBytes);

  const membersUsed = toNumber(
    usage.membersPerProject ?? usage.maxMembersInProject ?? subscription?.activeMembers,
    0
  );
  const membersLimit = toNumber(
    limits.membersPerProject,
    PLAN_LIMIT_DEFAULTS[plan].membersPerProject
  );

  const refreshAgeLabel = useMemo(() => {
    if (!lastLoadedAt) return "Loading usage...";

    const seconds = Math.max(0, Math.round((Date.now() - lastLoadedAt) / 1000));

    if (seconds < 5) return "Updated now";
    if (seconds < 60) return `Updated ${seconds}s ago`;

    return "Updated recently";
  }, [lastLoadedAt, loading]);

  const handleRefresh = () => {
    loadSubscription({ silent: true });
    refreshProjectCount();
    window.dispatchEvent(new Event("subscription:refresh"));
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);

    try {
      const response = await api.post("/subscriptions/portal");
      const url = response?.data?.data?.url || response?.data?.url;

      if (url) {
        window.location.href = url;
        return;
      }

      window.dispatchEvent(new Event("subscription:refresh"));
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="settings-billing-live-sync space-y-6">
      <div
        className={
          "rounded-3xl border p-5 transition-colors " +
          (isPremium
            ? "border-amber-300/80 bg-gradient-to-br from-amber-50 via-orange-50 to-violet-50 dark:border-amber-400/30 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-violet-500/10"
            : "border-slate-200/80 bg-slate-50/80 dark:border-white/[0.08] dark:bg-white/[0.04]")
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={
                "grid h-12 w-12 place-items-center rounded-2xl shadow-sm " +
                (isPremium
                  ? "bg-gradient-to-br from-amber-400 to-violet-600 text-white shadow-amber-500/25"
                  : "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300")
              }
            >
              {isPremium ? <Crown className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black text-slate-950 dark:text-white">
                  {planLabel} Plan
                </h3>

                {isPremium && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-200">
                    Active
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-zinc-400">
                {getPlanPrice(plan, subscription?.billingInterval)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-700 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-300 dark:hover:border-violet-400/30 dark:hover:text-violet-300"
          >
            <RefreshCw className={"h-3.5 w-3.5 " + (loading ? "animate-spin" : "")} />
            {refreshAgeLabel}
          </button>
        </div>

        {isPremium && (
          <div className="mt-5 rounded-2xl border border-amber-200/80 bg-white/70 p-4 dark:border-amber-400/20 dark:bg-white/[0.04]">
            <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-200">
              <ShieldCheck className="h-4 w-4" />
              Team features active
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <FeaturePill>{projectsLimit === -1 ? "Unlimited" : formatNumber(projectsLimit)} projects</FeaturePill>
              <FeaturePill>{membersLimit === -1 ? "Unlimited" : formatNumber(membersLimit)} members/project</FeaturePill>
              <FeaturePill>{storageLimit === -1 ? "Unlimited" : formatBytes(storageLimit)} storage</FeaturePill>
              <FeaturePill>{aiLimit === -1 ? "Unlimited" : formatNumber(aiLimit)} AI calls/mo</FeaturePill>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UsageMetric
          icon={Folder}
          label="Projects"
          used={projectsUsed}
          limit={projectsLimit}
          premium={isPremium}
        />

        <UsageMetric
          icon={HardDrive}
          label="Storage"
          used={storageUsed}
          limit={storageLimit}
          formatter={formatBytes}
          premium={isPremium}
        />

        <UsageMetric
          icon={Sparkles}
          label="AI Calls"
          used={aiUsed}
          limit={aiLimit}
          suffix="/mo"
          premium={isPremium}
        />

        <UsageMetric
          icon={Users}
          label="Members/Project"
          used={membersUsed}
          limit={membersLimit}
          premium={isPremium}
        />
      </div>

      <button
        type="button"
        onClick={handleManageBilling}
        disabled={portalLoading}
        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-300 dark:hover:text-violet-300"
      >
        <CreditCard className="h-4 w-4" />
        <span>{portalLoading ? "Opening billing..." : "Manage Billing"}</span>
        <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
}
'''

billing_path.parent.mkdir(parents=True, exist_ok=True)
billing_path.write_text(billing_code)

# Patch SubscriptionButton.jsx for storage consistency + dark mode legibility.
if subscription_button_path.exists():
    text = subscription_button_path.read_text()

    if "function getStorageBytesFromUsage" not in text:
        helper = r'''
function getStorageBytesFromUsage(usage = {}) {
  const explicitBytes = usage.storageBytes ?? usage.storageUsedBytes;

  if (explicitBytes !== undefined && explicitBytes !== null) {
    return toNumber(explicitBytes, 0);
  }

  const legacyStorage = toNumber(usage.storage, 0);

  // Legacy fallback:
  // Some older billing UI stored storage as MB, while the dropdown expects bytes.
  if (legacyStorage > 0 && legacyStorage < 1024 * 1024) {
    return legacyStorage * 1024 * 1024;
  }

  return legacyStorage;
}

'''
        text = text.replace("function getPlanLabel(plan) {", helper + "function getPlanLabel(plan) {", 1)

    text = re.sub(
        r"const storageUsed = toNumber\(\s*usage\.storageBytes\s*\?\?\s*usage\.storageUsedBytes\s*\?\?\s*usage\.storage,\s*0\s*\);",
        "const storageUsed = getStorageBytesFromUsage(usage);",
        text,
        count=1,
        flags=re.DOTALL,
    )

    text = text.replace(
        'className="absolute right-0 top-full mt-2 w-80 ',
        'className="openshare-subscription-menu absolute right-0 top-full mt-2 w-80 ',
        1,
    )

    text = text.replace(
        'className="inline-flex items-center rounded-full border border-amber-200',
        'className="openshare-feature-pill inline-flex items-center rounded-full border border-amber-200',
        1,
    )

    subscription_button_path.write_text(text)

# Add global dark-mode contrast hardening for SubscriptionButton dropdown.
if theme_path.exists():
    css = theme_path.read_text()
    marker = "/* openshare-subscription-button-dark-legibility-v1 */"

    block = r'''
/* openshare-subscription-button-dark-legibility-v1 */
html.dark .openshare-subscription-menu,
html[data-theme="dark"] .openshare-subscription-menu {
  background: #121216 !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: #f8fafc !important;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.52) !important;
}

html.dark .openshare-subscription-menu > div:first-child,
html[data-theme="dark"] .openshare-subscription-menu > div:first-child {
  background:
    radial-gradient(circle at 12% 0%, rgba(245, 158, 11, 0.16), transparent 34%),
    radial-gradient(circle at 90% 0%, rgba(124, 58, 237, 0.14), transparent 36%),
    linear-gradient(180deg, rgba(24, 24, 27, 0.98), rgba(18, 18, 22, 0.98)) !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
}

html.dark .openshare-subscription-menu .text-slate-800,
html[data-theme="dark"] .openshare-subscription-menu .text-slate-800 {
  color: #f8fafc !important;
}

html.dark .openshare-subscription-menu .text-slate-600,
html[data-theme="dark"] .openshare-subscription-menu .text-slate-600 {
  color: #d4d4d8 !important;
}

html.dark .openshare-subscription-menu .text-slate-500,
html[data-theme="dark"] .openshare-subscription-menu .text-slate-500,
html.dark .openshare-subscription-menu .text-slate-400,
html[data-theme="dark"] .openshare-subscription-menu .text-slate-400 {
  color: #a1a1aa !important;
}

html.dark .openshare-subscription-menu .openshare-feature-pill,
html[data-theme="dark"] .openshare-subscription-menu .openshare-feature-pill {
  background: rgba(245, 158, 11, 0.12) !important;
  border-color: rgba(251, 191, 36, 0.38) !important;
  color: #fde68a !important;
}

html.dark .openshare-subscription-menu button,
html[data-theme="dark"] .openshare-subscription-menu button {
  color: #e5e7eb !important;
}
'''

    if marker not in css:
        css = css.rstrip() + "\n\n" + block.strip() + "\n"
        theme_path.write_text(css)

print("✅ Subscription & Billing synced with SubscriptionButton usage logic.")
print("")
print("Updated:")
print(f"- {billing_path}")
print(f"- {subscription_button_path}")
print(f"- {theme_path}")
print("")
print("Backups:")
print(f"- BillingSettings: {billing_backup}")
print(f"- SubscriptionButton: {button_backup}")
print(f"- theme.css: {theme_backup}")
print("")
print("Next:")
print("1. Stop Vite with Control+C")
print("2. Restart: npm run dev")
print("3. Hard refresh Chrome: Cmd+Shift+R")
