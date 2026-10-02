import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  getApplePurchaseContext,
  verifyAppleTransaction,
} from "../../api/subscriptions";
import OpenShareStore, {
  OPENSHARE_APPLE_SUBSCRIPTIONS_MANAGE_URL,
  OPENSHARE_TEAM_STOREKIT_PRODUCTS,
} from "../../native/openShareStore";
import { useProjectUsageCount } from "../../hooks/useProjectUsageCount";
import DowngradeManager from "./DowngradeManager";

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
    membersPerProject: 10,
    aiCallsPerMonth: 100,
    storageBytes: 1024 * 1024 * 1024,
  },
};

const PLAN_LIMIT_DEFAULTS = {
  free: {
    projects: 10,
    membersPerProject: 10,
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

function firstPositiveNumber(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return 0;
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

export default function BillingSettings({
  forceShowDowngradeManager = false,
}) {
  const [subscription, setSubscription] = useState(FALLBACK_SUBSCRIPTION);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // openshare-billing-acquisition-v1
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutInterval, setCheckoutInterval] = useState("monthly");
  const [checkoutError, setCheckoutError] = useState("");

  // openshare-storekit-restore-ui-v1
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");

  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const mountedRef = useRef(false);

  const {
    projectCount,
    refresh: refreshProjectCount,
  } = useProjectUsageCount({ refreshMs: REFRESH_INTERVAL_MS });

  const loadSubscription = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      // openshare-effective-downgrade-ui-v1
      //
      // /subscriptions/current remains the source for normal billing/usage
      // display, while /subscriptions/entitlements supplies the effective
      // lifecycle state used by backend enforcement. This prevents an expired
      // persisted GRACE state from being shown after the server has already
      // transitioned effective access to RESTRICTED.
      const [
        currentResult,
        entitlementsResult,
      ] = await Promise.allSettled([
        api.get("/subscriptions/current"),
        api.get("/subscriptions/entitlements"),
      ]);

      if (currentResult.status !== "fulfilled") {
        throw currentResult.reason;
      }

      const current =
        mergeSubscription(
          currentResult.value
        );

      let next = current;

      if (
        entitlementsResult.status ===
        "fulfilled"
      ) {
        const entitlementPayload =
          entitlementsResult.value?.data
            ?.data ??
          entitlementsResult.value?.data ??
          null;

        const downgrade =
          entitlementPayload?.downgrade ??
          null;

        if (downgrade) {
          next = {
            ...(current || {}),

            // Effective server-authoritative lifecycle state.
            downgradeState:
              downgrade.state ??
              current?.downgradeState ??
              "none",

            // Preserve the persisted value separately for diagnostics.
            downgradePersistedState:
              downgrade.persistedState ??
              current?.downgradeState ??
              "none",

            downgradeTargetPlan:
              downgrade.targetPlan ??
              null,

            downgradeEffectiveAt:
              downgrade.effectiveAt ??
              null,

            downgradeGraceEndsAt:
              downgrade.graceEndsAt ??
              null,

            downgradeGraceActive:
              Boolean(
                downgrade.graceActive
              ),

            downgradeRestricted:
              Boolean(
                downgrade.restricted
              ),
          };
        }
      } else {
        /*
         * Do not take the entire Billing page down if the entitlement
         * endpoint is temporarily unavailable. /current still provides the
         * existing billing experience; the next periodic refresh will retry.
         */
        console.warn(
          "Failed to load server-authoritative subscription entitlements:",
          entitlementsResult.reason
        );
      }

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

  // openshare-storekit-server-activation-v1
  const billingProvider =
    String(
      subscription?.billingProvider || ""
    )
      .trim()
      .toLowerCase();

  const isAppleBilling =
    billingProvider === "apple";

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

  // openshare-workspace-member-metric-v1
  const membersUsed = firstPositiveNumber(
    usage.acceptedWorkspaceMemberCount,
    usage.membersPerProject,
    usage.maxMembersInProject,
    usage.activeMembers,
    subscription?.activeMembers,
    subscription?.membersPerProject,
    subscription?.memberCount
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

  const isNativeIOS =
    typeof window !== "undefined" &&
    window.Capacitor?.isNativePlatform?.() === true &&
    window.Capacitor?.getPlatform?.() === "ios";

  const handleStartCheckout = async () => {
    setCheckoutError("");

    // openshare-storekit-purchase-ui-v1
    // Native iOS purchases through StoreKit. Web continues through Stripe.
    if (isNativeIOS) {
      setCheckoutLoading(true);

      try {
        // openshare-storekit-server-activation-v1
        //
        // The backend generates the appAccountToken for the authenticated
        // OpenShare account. StoreKit writes that UUID into the transaction,
        // and the backend requires the same token before granting Team.
        const purchaseContext =
          await getApplePurchaseContext();

        const appAccountToken =
          String(
            purchaseContext?.appAccountToken ||
              ""
          ).trim();

        const productKey =
          checkoutInterval === "yearly"
            ? "yearly"
            : "monthly";

        const expectedProductId =
          OPENSHARE_TEAM_STOREKIT_PRODUCTS[
            productKey
          ];

        const productId =
          String(
            purchaseContext?.products?.[
              productKey
            ] || ""
          ).trim();

        if (!appAccountToken) {
          throw new Error(
            "OpenShare could not prepare your Apple purchase account."
          );
        }

        if (!productId) {
          throw new Error(
            "OpenShare could not resolve the Apple subscription product."
          );
        }

        // Both sides must agree on the exact App Store product before
        // presenting Apple's purchase sheet.
        if (
          productId !==
          expectedProductId
        ) {
          throw new Error(
            "Apple subscription configuration is out of sync."
          );
        }

        const result =
          await OpenShareStore.purchase({
            productId,
            appAccountToken,
          });

        if (
          result?.status ===
          "cancelled"
        ) {
          setCheckoutError("");
          return;
        }

        if (
          result?.status ===
          "pending"
        ) {
          setCheckoutError(
            "Your Apple subscription purchase is pending approval."
          );
          return;
        }

        if (
          result?.status ===
          "purchased"
        ) {
          const signedTransaction =
            String(
              result?.jwsRepresentation ||
                ""
            ).trim();

          const transactionId =
            String(
              result?.transactionId ||
                ""
            ).trim();

          if (
            !signedTransaction ||
            !transactionId
          ) {
            throw new Error(
              "Apple returned an incomplete subscription transaction."
            );
          }

          // Security boundary:
          // Never finish the StoreKit transaction before OpenShare's
          // backend verifies Apple's JWS and persists Team entitlement.
          const verification =
            await verifyAppleTransaction(
              signedTransaction
            );

          if (
            verification?.verified !==
              true ||
            verification?.billingProvider !==
              "apple"
          ) {
            throw new Error(
              "OpenShare could not verify the Apple subscription."
            );
          }

          const verifiedTransactionId =
            String(
              verification?.transactionId ||
                ""
            ).trim();

          if (
            verifiedTransactionId !==
            transactionId
          ) {
            throw new Error(
              "Apple transaction verification returned a different transaction."
            );
          }

          let finishConfirmed = false;

          try {
            const finishResult =
              await OpenShareStore
                .finishTransaction({
                  transactionId,
                });

            finishConfirmed =
              finishResult?.finished ===
              true;
          } catch (finishError) {
            console.warn(
              "Team activated, but StoreKit transaction acknowledgement failed:",
              finishError
            );
          }

          if (!finishConfirmed) {
            console.warn(
              "Team entitlement is active, but the StoreKit transaction was not confirmed as finished:",
              transactionId
            );
          }

          // Refresh this panel and the rest of the app only after the
          // authoritative backend entitlement has been persisted.
          await loadSubscription({
            silent: true,
          });

          await Promise.resolve(
            refreshProjectCount()
          );

          window.dispatchEvent(
            new Event(
              "subscription:changed"
            )
          );

          window.dispatchEvent(
            new Event(
              "subscription:refresh"
            )
          );

          setCheckoutError(
            finishConfirmed
              ? ""
              : "Your Team subscription is active, but Apple purchase acknowledgement could not be confirmed."
          );

          return;
        }

        setCheckoutError(
          "Apple did not return a completed subscription purchase."
        );
      } catch (error) {
        console.error(
          "Failed to activate Apple subscription:",
          error
        );

        setCheckoutError(
          error?.response?.data?.message ||
            error?.message ||
            "Could not complete the Apple subscription purchase."
        );
      } finally {
        setCheckoutLoading(false);
      }

      return;
    }

    setCheckoutLoading(true);

    try {
      const response = await api.post("/subscriptions/checkout", {
        plan: "team",
        interval: checkoutInterval,
      });

      const url = response?.data?.data?.url || response?.data?.url;

      if (!url) {
        throw new Error("Checkout URL was not returned.");
      }

      window.location.href = url;
    } catch (error) {
      console.error("Failed to start subscription checkout:", error);

      setCheckoutError(
        error?.response?.data?.message ||
          error?.message ||
          "Could not start checkout."
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!isNativeIOS || restoreLoading) {
      return;
    }

    setRestoreLoading(true);
    setRestoreMessage("");
    setCheckoutError("");

    try {
      // openshare-storekit-restore-ui-v1
      //
      // AppStore.sync() runs inside the native restore method.
      // The returned entitlement JWS is still sent to OpenShare's backend;
      // the client never grants Team access by itself.
      const result =
        await OpenShareStore.restore();

      const entitlements =
        Array.isArray(result?.entitlements)
          ? result.entitlements
          : [];

      const allowedProductIds =
        new Set(
          Object.values(
            OPENSHARE_TEAM_STOREKIT_PRODUCTS
          )
        );

      const teamEntitlements =
        entitlements
          .filter((entitlement) => {
            const productId =
              String(
                entitlement?.productId ||
                  ""
              ).trim();

            const signedTransaction =
              String(
                entitlement?.jwsRepresentation ||
                  ""
              ).trim();

            return (
              allowedProductIds.has(
                productId
              ) &&
              Boolean(
                signedTransaction
              )
            );
          })
          .sort((a, b) => {
            const toTime = (value) => {
              const parsed =
                Date.parse(
                  String(
                    value || ""
                  )
                );

              return Number.isFinite(
                parsed
              )
                ? parsed
                : 0;
            };

            return (
              toTime(
                b?.expirationDate ||
                  b?.purchaseDate
              ) -
              toTime(
                a?.expirationDate ||
                  a?.purchaseDate
              )
            );
          });

      if (
        teamEntitlements.length === 0
      ) {
        setRestoreMessage(
          "No active OpenShare Team purchase was found for this Apple ID."
        );

        return;
      }

      let restoredEntitlement =
        null;

      let restoredVerification =
        null;

      let lastVerificationError =
        null;

      for (
        const entitlement
        of teamEntitlements
      ) {
        const signedTransaction =
          String(
            entitlement
              ?.jwsRepresentation ||
              ""
          ).trim();

        const transactionId =
          String(
            entitlement
              ?.transactionId ||
              ""
          ).trim();

        if (
          !signedTransaction ||
          !transactionId
        ) {
          continue;
        }

        try {
          const verification =
            await verifyAppleTransaction(
              signedTransaction
            );

          const verifiedTransactionId =
            String(
              verification
                ?.transactionId ||
                ""
            ).trim();

          if (
            verification?.verified !==
              true ||
            verification
              ?.billingProvider !==
              "apple"
          ) {
            throw new Error(
              "OpenShare could not verify this restored Apple subscription."
            );
          }

          if (
            verifiedTransactionId !==
            transactionId
          ) {
            throw new Error(
              "Apple restore verification returned a different transaction."
            );
          }

          restoredEntitlement =
            entitlement;

          restoredVerification =
            verification;

          break;
        } catch (error) {
          lastVerificationError =
            error;
        }
      }

      if (
        !restoredEntitlement ||
        !restoredVerification
      ) {
        throw (
          lastVerificationError ||
          new Error(
            "No OpenShare Team purchase could be restored for this account."
          )
        );
      }

      const transactionId =
        String(
          restoredEntitlement
            ?.transactionId ||
            ""
        ).trim();

      if (transactionId) {
        try {
          const finishResult =
            await OpenShareStore
              .finishTransaction({
                transactionId,
              });

          // finished:false is valid for restore: this transaction may
          // already have been acknowledged during the original purchase.
          if (
            finishResult?.finished !==
            true
          ) {
            console.info(
              "Restored Apple entitlement was already finished or had no outstanding StoreKit transaction:",
              transactionId
            );
          }
        } catch (finishError) {
          // Server verification already restored the entitlement.
          // Acknowledgement retry is not the authority for Team access.
          console.warn(
            "Apple subscription restored, but StoreKit acknowledgement could not be retried:",
            finishError
          );
        }
      }

      await loadSubscription({
        silent: true,
      });

      await Promise.resolve(
        refreshProjectCount()
      );

      window.dispatchEvent(
        new Event(
          "subscription:changed"
        )
      );

      window.dispatchEvent(
        new Event(
          "subscription:refresh"
        )
      );

      setRestoreMessage(
        "Your Apple Team subscription has been restored."
      );
    } catch (error) {
      console.error(
        "Failed to restore Apple purchases:",
        error
      );

      setRestoreMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Could not restore Apple purchases."
      );
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);

    try {
      // openshare-storekit-server-activation-v1
      // Apple-billed subscriptions are managed by Apple, never Stripe.
      if (isAppleBilling) {
        window.open(
          OPENSHARE_APPLE_SUBSCRIPTIONS_MANAGE_URL,
          "_blank",
          "noopener,noreferrer"
        );

        return;
      }

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
              <FeaturePill>{membersLimit === -1 ? "Unlimited" : formatNumber(membersLimit)} workspace members</FeaturePill>
              <FeaturePill>{storageLimit === -1 ? "Unlimited" : formatBytes(storageLimit)} storage</FeaturePill>
              <FeaturePill>{aiLimit === -1 ? "Unlimited" : formatNumber(aiLimit)} AI calls/mo</FeaturePill>
            </div>
          </div>
        )}
      </div>

      {!isPremium && (
        <div className="rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-sm dark:border-violet-400/20 dark:from-violet-500/10 dark:via-white/[0.04] dark:to-fuchsia-500/10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black text-slate-950 dark:text-white dark:[text-shadow:0_1px_1px_rgba(0,0,0,0.72)]">
                  Upgrade to Team
                </h3>

                {checkoutInterval === "yearly" && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Save 2 months
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-zinc-200 dark:[text-shadow:0_1px_1px_rgba(0,0,0,0.62)]">
                50 projects, 25 workspace members, 10GB storage, 1,000 AI calls/month,
                priority support, org dashboard, and custom branding.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <FeaturePill>50 projects</FeaturePill>
                <FeaturePill>25 members</FeaturePill>
                <FeaturePill>10GB storage</FeaturePill>
                <FeaturePill>1,000 AI calls/mo</FeaturePill>
              </div>
            </div>

            <div className="w-full shrink-0 lg:w-[290px]">
              <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.05]">
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutInterval("monthly");
                    setCheckoutError("");
                  }}
                  className={
                    "rounded-xl px-3 py-2 text-xs font-black transition " +
                    (checkoutInterval === "monthly"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-violet-700 dark:text-zinc-400")
                  }
                >
                  Monthly
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCheckoutInterval("yearly");
                    setCheckoutError("");
                  }}
                  className={
                    "rounded-xl px-3 py-2 text-xs font-black transition " +
                    (checkoutInterval === "yearly"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-violet-700 dark:text-zinc-400")
                  }
                >
                  Annual
                </button>
              </div>

              <div className="mt-4">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black text-slate-950 dark:text-white">
                    {checkoutInterval === "yearly" ? "$390" : "$39"}
                  </span>

                  <span className="pb-1 text-sm font-bold text-slate-400 dark:text-zinc-500">
                    /{checkoutInterval === "yearly" ? "year" : "month"}
                  </span>
                </div>

                {checkoutInterval === "yearly" && (
                  <div className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                    Equivalent to $32.50/month
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleStartCheckout}
                disabled={checkoutLoading}
                className="openshare-subscribe-cta mt-4 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkoutLoading
                  ? isNativeIOS
                    ? "Contacting Apple..."
                    : "Opening checkout..."
                  : isNativeIOS
                    ? "Subscribe with Apple"
                    : checkoutInterval === "yearly"
                      ? "Upgrade — $390/year"
                      : "Upgrade — $39/month"}
              </button>

              {isNativeIOS && (
                <p className="mt-2 text-center text-[11px] font-semibold leading-relaxed text-slate-500 dark:text-zinc-400">
                  Apple In-App Purchase will handle subscriptions in the iOS app.
                </p>
              )}

              {checkoutError && (
                <p className="mt-2 text-center text-xs font-bold text-amber-600 dark:text-amber-300">
                  {checkoutError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isNativeIOS && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                Apple purchases
              </div>

              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500 dark:text-zinc-400">
                Already subscribed through Apple? Restore your current OpenShare Team purchase.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRestorePurchases}
              disabled={
                restoreLoading ||
                checkoutLoading
              }
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-black text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-200 dark:hover:bg-violet-400/15"
            >
              {restoreLoading
                ? "Restoring..."
                : "Restore Purchases"}
            </button>
          </div>

          {restoreMessage && (
            <p className="mt-3 text-xs font-bold text-slate-600 dark:text-zinc-300">
              {restoreMessage}
            </p>
          )}
        </div>
      )}

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
          label="Workspace Members"
          used={membersUsed}
          limit={membersLimit}
          premium={isPremium}
        />
      </div>

      <DowngradeManager
        subscription={subscription}
        isPremium={isPremium}
        forceShow={forceShowDowngradeManager}
      />

      {/* openshare-billing-manage-paid-only-v1 */}
      {/* openshare-ios-subscribe-button-visibility-v1 */}
      <style>{`
        .settings-billing-live-sync button.openshare-subscribe-cta {
            -webkit-appearance: none !important;
            appearance: none !important;
            background-color: #7c3aed !important;
            background-image: linear-gradient(
              90deg,
              #7c3aed 0%,
              #d946ef 100%
            ) !important;
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            border-color: transparent !important;
            min-height: 48px !important;
            opacity: 1 !important;
          }

        .settings-billing-live-sync button.openshare-subscribe-cta:disabled {
          opacity: 0.65 !important;
        }
      `}</style>

      {isPremium && (
        <button
          type="button"
          onClick={handleManageBilling}
          disabled={portalLoading}
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-300 dark:hover:text-violet-300"
        >
          <CreditCard className="h-4 w-4" />
          <span>
            {portalLoading
              ? "Opening billing..."
              : isAppleBilling
                ? "Manage in Apple"
                : "Manage Billing"}
          </span>
          <ExternalLink className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
