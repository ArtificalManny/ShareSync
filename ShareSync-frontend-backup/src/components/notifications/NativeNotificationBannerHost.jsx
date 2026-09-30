import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Flame,
  MessageCircle,
  Target,
  Trophy,
  UserPlus,
  X,
} from "lucide-react";
import OpenShareLogo from "../ui/OpenShareLogo.jsx";

// openshare-native-notification-banner-v1

const EVENT_NAME = "openshare:notification-banner";
const AUTO_DISMISS_MS = 5200;
const EXIT_MS = 220;

const TYPE_META = {
  message: {
    icon: MessageCircle,
    label: "Message",
    tone: "violet",
  },
  new_message: {
    icon: MessageCircle,
    label: "Message",
    tone: "violet",
  },
  task_assigned: {
    icon: Target,
    label: "Assignment",
    tone: "violet",
  },
  assignment: {
    icon: Target,
    label: "Assignment",
    tone: "violet",
  },
  task_completed: {
    icon: CheckCircle2,
    label: "Completed",
    tone: "emerald",
  },
  invite: {
    icon: UserPlus,
    label: "Invitation",
    tone: "indigo",
  },
  project_invite: {
    icon: UserPlus,
    label: "Invitation",
    tone: "indigo",
  },
  achievement: {
    icon: Trophy,
    label: "Achievement",
    tone: "amber",
  },
  streak_at_risk: {
    icon: Flame,
    label: "Streak alert",
    tone: "rose",
  },
  deadline_reminder: {
    icon: Calendar,
    label: "Deadline",
    tone: "orange",
  },
};

// openshare-real-notification-normalizer-v1

function safeObject(value) {
  if (!value) return {};

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      return (
        parsed &&
        typeof parsed === "object"
      )
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return typeof value === "object"
    ? value
    : {};
}

function objectId(value) {
  if (!value) return null;

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  if (typeof value === "object") {
    return value._id || value.id || null;
  }

  return null;
}

function resolveRealNotificationRoute(
  source,
  data,
  meta,
  type
) {
  const rawRoute =
    source.route ||
    source.actionUrl ||
    source.targetUrl ||
    data.route ||
    data.actionUrl ||
    data.targetUrl ||
    meta.route ||
    meta.actionUrl ||
    meta.targetUrl ||
    null;

  if (
    typeof rawRoute === "string"
  ) {
    const trimmed = rawRoute.trim();

    if (
      trimmed &&
      trimmed !== "/" &&
      trimmed.startsWith("/") &&
      !trimmed.startsWith("//")
    ) {
      return trimmed;
    }
  }

  const projectId = objectId(
    data.projectId ||
    data.project ||
    meta.projectId ||
    meta.project ||
    source.projectId
  );

  const taskId = objectId(
    data.taskId ||
    data.task ||
    meta.taskId ||
    meta.task ||
    source.taskId
  );

  const conversationId = objectId(
    data.conversationId ||
    data.conversation ||
    data.threadId ||
    meta.conversationId ||
    meta.conversation ||
    meta.threadId ||
    source.conversationId
  );

  const title = String(
    source.title || ""
  ).toLowerCase();

  const body = String(
    source.body ||
    source.message ||
    ""
  ).toLowerCase();

  const signal =
    `${type} ${title} ${body}`;

  const isInvite =
    signal.includes("invite") ||
    signal.includes("invitation");

  const isMessage =
    signal.includes("message") ||
    signal.includes("conversation");

  const isXp =
    signal.includes("xp") ||
    signal.includes("achievement") ||
    signal.includes("streak");

  // Never infer direct access into a private project from an
  // invitation. Only use an explicit safe action URL for invites.
  if (isInvite) {
    return null;
  }

  if (projectId && taskId) {
    return (
      `/projects/${encodeURIComponent(projectId)}` +
      `/tasks/${encodeURIComponent(taskId)}`
    );
  }

  if (conversationId) {
    return (
      `/messages/${encodeURIComponent(
        conversationId
      )}`
    );
  }

  if (isMessage) {
    return "/messages";
  }

  if (isXp) {
    return "/home";
  }

  if (projectId) {
    return (
      `/projects/${encodeURIComponent(
        projectId
      )}`
    );
  }

  return null;
}

function resolveActionLabel(
  source,
  type,
  route
) {
  if (source.actionLabel) {
    return source.actionLabel;
  }

  const signal =
    `${type} ${source.title || ""}`.toLowerCase();

  if (
    signal.includes("message") ||
    route?.startsWith("/messages")
  ) {
    return "View message";
  }

  if (
    signal.includes("task") ||
    signal.includes("assignment")
  ) {
    return "Open task";
  }

  if (
    signal.includes("invite") ||
    signal.includes("invitation")
  ) {
    return "View invitation";
  }

  if (
    signal.includes("achievement") ||
    signal.includes("xp") ||
    signal.includes("streak")
  ) {
    return "View progress";
  }

  if (route?.startsWith("/projects/")) {
    return "Open project";
  }

  return "Open";
}

function normalize(input) {
  const source =
    input &&
    typeof input === "object"
      ? input
      : {};

  const data =
    safeObject(source.data);

  const meta =
    safeObject(source.meta);

  const type = String(
    source.type ||
    data.type ||
    meta.type ||
    "default"
  ).toLowerCase();

  const route =
    resolveRealNotificationRoute(
      source,
      data,
      meta,
      type
    );

  return {
    id:
      source.id ||
      source._id ||
      `openshare-banner-${Date.now()}`,

    type,

    title:
      source.title ||
      data.title ||
      "New notification",

    message:
      source.message ||
      source.body ||
      data.message ||
      data.body ||
      "",

    actionLabel:
      resolveActionLabel(
        source,
        type,
        route
      ),

    route,

    urgent:
      Boolean(
        source.urgent ||
        data.urgent ||
        meta.urgent
      ),

    timeLabel:
      source.timeLabel ||
      "now",
  };
}

function safeRoute(route) {
  return (
    typeof route === "string" &&
    route.startsWith("/") &&
    !route.startsWith("//")
  );
}

function Banner({
  notification,
  leaving,
  onDismiss,
  onOpen,
}) {
  const typeKey = String(
    notification?.type || ""
  ).toLowerCase();

  const meta = notification?.urgent
    ? {
        icon: AlertTriangle,
        label: "Urgent",
        tone: "rose",
      }
    : TYPE_META[typeKey] || {
        icon: Bell,
        label: "Notification",
        tone: "violet",
      };

  const Icon = meta.icon;

  return (
    <>
      <div
        className={`openshare-native-banner ${
          leaving
            ? "is-leaving"
            : "is-entering"
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="openshare-native-banner-card">
          <button
            type="button"
            className="openshare-native-banner-main"
            onClick={onOpen}
          >
            <div className="openshare-native-banner-meta">
              <div className="openshare-native-banner-brand">
                <span className="openshare-native-banner-logo">
                  <OpenShareLogo
                    className="w-[18px] h-[18px]"
                    title="OpenShare"
                  />
                </span>

                <span className="openshare-native-banner-brand-name">
                  OpenShare
                </span>

                <span className="openshare-native-banner-separator">
                  •
                </span>

                <span className="openshare-native-banner-type">
                  {meta.label}
                </span>
              </div>

              <span className="openshare-native-banner-time">
                {notification.timeLabel}
              </span>
            </div>

            <div className="openshare-native-banner-content">
              <div
                className={`openshare-native-banner-icon tone-${meta.tone}`}
              >
                <Icon
                  size={20}
                  strokeWidth={2.25}
                />
              </div>

              <div className="openshare-native-banner-copy">
                <div className="openshare-native-banner-title">
                  {notification.title}
                </div>

                {notification.message ? (
                  <div className="openshare-native-banner-message">
                    {notification.message}
                  </div>
                ) : null}

                <div className="openshare-native-banner-action">
                  {notification.actionLabel}
                  <span>›</span>
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            className="openshare-native-banner-close"
            aria-label="Dismiss notification"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDismiss();
            }}
          >
            <X
              size={15}
              strokeWidth={2.4}
            />
          </button>

          <div
            className={`openshare-native-banner-glow tone-${meta.tone}`}
          />
        </div>
      </div>

      <style>{`
        /* openshare-native-notification-banner-v1 */
        /* openshare-native-notification-banner-polish-v2 */

        .openshare-native-banner {
          position: fixed;
          top: calc(env(safe-area-inset-top, 0px) + 8px);
          left: 12px;
          right: 12px;
          z-index: 2147483000;

          max-width: 430px;
          margin: 0 auto;

          pointer-events: none;
          transform-origin: top center;
          will-change: opacity, transform;
        }

        .openshare-native-banner.is-entering {
          animation:
            openshareBannerIn
            360ms
            cubic-bezier(.16, 1, .3, 1)
            both;
        }

        .openshare-native-banner.is-leaving {
          animation:
            openshareBannerOut
            220ms
            cubic-bezier(.4, 0, 1, 1)
            both;
        }

        /* openshare-native-banner-surface-v4 */
        .openshare-native-banner-card {
          position: relative;
          overflow: hidden;

          pointer-events: auto;

          border:
            1px solid
            rgba(255,255,255,.72);

          border-radius: 20px;

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.998),
              rgba(250,250,252,.995)
            ) !important;

          box-shadow:
            0 16px 40px rgba(15,23,42,.17),
            0 3px 10px rgba(15,23,42,.07);

          -webkit-backdrop-filter:
            blur(26px) saturate(175%);

          backdrop-filter:
            blur(26px) saturate(175%);
        }

        .dark .openshare-native-banner-card {
          border-color:
            rgba(255,255,255,.11);

          background:
            linear-gradient(
              145deg,
              rgba(24,24,29,.998),
              rgba(14,14,18,.996)
            ) !important;

          box-shadow:
            0 18px 48px rgba(0,0,0,.48),
            0 3px 14px rgba(0,0,0,.24);
        }

        .openshare-native-banner-main {
          display: block;

          width: 100%;

          padding:
            12px
            58px
            13px
            13px;

          border: 0;
          outline: 0;

          background: transparent;
          color: inherit;

          text-align: left;

          -webkit-tap-highlight-color:
            transparent;
        }

        .openshare-native-banner-main:active {
          transform: scale(.994);
        }

        .openshare-native-banner-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;

          margin-bottom: 8px;
        }

        .openshare-native-banner-brand {
          display: flex;
          align-items: center;

          min-width: 0;

          gap: 6px;
        }

        .openshare-native-banner-logo {
          display: grid;
          place-items: center;

          width: 21px;
          height: 21px;

          flex: 0 0 auto;
        }

        .openshare-native-banner-brand-name {
          color: #0f172a;

          font-size: 12px;
          font-weight: 800;
          letter-spacing: -.01em;
        }

        .dark
        .openshare-native-banner-brand-name {
          color: #fafafa;
        }

        .openshare-native-banner-separator {
          color: #94a3b8;
          font-size: 11px;
        }

        .openshare-native-banner-type {
          overflow: hidden;

          color: #64748b;

          font-size: 11px;
          font-weight: 650;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .dark
        .openshare-native-banner-type {
          color: #a1a1aa;
        }

        .openshare-native-banner-time {
          flex: 0 0 auto;

          color: #94a3b8;

          font-size: 10px;
          font-weight: 650;
        }

        .openshare-native-banner-content {
          display: grid;

          grid-template-columns:
            40px
            minmax(0,1fr);

          gap: 10px;
        }

        .openshare-native-banner-icon {
          display: grid;
          place-items: center;

          width: 40px;
          height: 40px;

          border-radius: 12px;

          color: #7c3aed;
          background:
            rgba(124,58,237,.11);
        }

        .openshare-native-banner-icon.tone-indigo {
          color: #4f46e5;
          background:
            rgba(79,70,229,.11);
        }

        .openshare-native-banner-icon.tone-emerald {
          color: #059669;
          background:
            rgba(5,150,105,.11);
        }

        .openshare-native-banner-icon.tone-amber {
          color: #d97706;
          background:
            rgba(217,119,6,.11);
        }

        .openshare-native-banner-icon.tone-rose {
          color: #e11d48;
          background:
            rgba(225,29,72,.11);
        }

        .openshare-native-banner-icon.tone-orange {
          color: #ea580c;
          background:
            rgba(234,88,12,.11);
        }

        .openshare-native-banner-copy {
          min-width: 0;
        }

        .openshare-native-banner-title {
          overflow: hidden;

          color: #0f172a;

          font-size: 14px;
          font-weight: 800;
          line-height: 1.25;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .dark
        .openshare-native-banner-title {
          color: #fafafa;
        }

        .openshare-native-banner-message {
          display: -webkit-box;
          overflow: hidden;

          margin-top: 3px;

          color: #475569;

          font-size: 12.5px;
          font-weight: 500;
          line-height: 1.4;

          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .dark
        .openshare-native-banner-message {
          color: #cbd5e1;
        }

        .openshare-native-banner-action {
          display: inline-flex;
          align-items: center;

          gap: 5px;

          margin-top: 6px;

          color: #7c3aed;

          font-size: 11px;
          font-weight: 800;
        }

        .dark
        .openshare-native-banner-action {
          color: #c4b5fd;
        }

        .openshare-native-banner-action span {
          font-size: 17px;
          line-height: .7;
        }

        /* openshare-native-banner-close-lock-v3 */
        .openshare-native-banner-close {
          position: absolute;

          width: 25px !important;
          height: 25px !important;
          min-width: 25px !important;
          min-height: 25px !important;
          max-width: 25px !important;
          max-height: 25px !important;

          padding: 0 !important;
          margin: 0 !important;

          flex: 0 0 25px;

          appearance: none;
          -webkit-appearance: none;

          box-shadow: none !important;

          top: 9px;
          right: 9px;

          display: grid;
          place-items: center;

          width: 25px;
          height: 25px;

          border: 0;
          border-radius: 999px;

          color: #64748b;

          background:
            rgba(148,163,184,.08);

          -webkit-tap-highlight-color:
            transparent;
        }

        .dark
        .openshare-native-banner-close {
          color: #d4d4d8;

          background:
            rgba(255,255,255,.055);
        }

        .openshare-native-banner-glow {
          position: absolute;

          left: 20px;
          right: 20px;
          bottom: 0;

          height: 1.5px;

          background:
            linear-gradient(
              90deg,
              transparent,
              #8b5cf6,
              transparent
            );
        }

        .openshare-native-banner-glow.tone-indigo {
          background:
            linear-gradient(
              90deg,
              transparent,
              #6366f1,
              transparent
            );
        }

        .openshare-native-banner-glow.tone-emerald {
          background:
            linear-gradient(
              90deg,
              transparent,
              #10b981,
              transparent
            );
        }

        .openshare-native-banner-glow.tone-amber {
          background:
            linear-gradient(
              90deg,
              transparent,
              #f59e0b,
              transparent
            );
        }

        .openshare-native-banner-glow.tone-rose {
          background:
            linear-gradient(
              90deg,
              transparent,
              #f43f5e,
              transparent
            );
        }

        .openshare-native-banner-glow.tone-orange {
          background:
            linear-gradient(
              90deg,
              transparent,
              #f97316,
              transparent
            );
        }

        @keyframes openshareBannerIn {
          from {
            opacity: 0;

            transform:
              translateY(-24px)
              scale(.975);
          }

          to {
            opacity: 1;

            transform:
              translateY(0)
              scale(1);
          }
        }

        @keyframes openshareBannerOut {
          from {
            opacity: 1;

            transform:
              translateY(0)
              scale(1);
          }

          to {
            opacity: 0;

            transform:
              translateY(-18px)
              scale(.985);
          }
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .openshare-native-banner {
            animation-duration:
              1ms !important;
          }
        }
      `}</style>
    </>
  );
}

export default function NativeNotificationBannerHost() {
  const navigate = useNavigate();

  const [notification, setNotification] =
    useState(null);

  const [leaving, setLeaving] =
    useState(false);

  const dismissTimer =
    useRef(null);

  const exitTimer =
    useRef(null);

  const clearTimers =
    useCallback(() => {
      if (dismissTimer.current) {
        window.clearTimeout(
          dismissTimer.current
        );
        dismissTimer.current = null;
      }

      if (exitTimer.current) {
        window.clearTimeout(
          exitTimer.current
        );
        exitTimer.current = null;
      }
    }, []);

  const dismiss =
    useCallback(() => {
      clearTimers();

      setLeaving(true);

      exitTimer.current =
        window.setTimeout(() => {
          setNotification(null);
          setLeaving(false);
        }, EXIT_MS);
    }, [clearTimers]);

  const show =
    useCallback((payload) => {
      clearTimers();

      const next =
        normalize(payload);

      setLeaving(false);
      setNotification(next);

      dismissTimer.current =
        window.setTimeout(() => {
          setLeaving(true);

          exitTimer.current =
            window.setTimeout(() => {
              setNotification(null);
              setLeaving(false);
            }, EXIT_MS);
        }, AUTO_DISMISS_MS);
    }, [clearTimers]);

  useEffect(() => {
    const listener = (event) => {
      show(event?.detail);
    };

    window.addEventListener(
      EVENT_NAME,
      listener
    );

    window.openShareShowBanner =
      show;

    return () => {
      window.removeEventListener(
        EVENT_NAME,
        listener
      );

      if (
        window.openShareShowBanner ===
        show
      ) {
        delete window.openShareShowBanner;
      }

      clearTimers();
    };
  }, [clearTimers, show]);

  const openNotification =
    useCallback(() => {
      const route =
        notification?.route;

      dismiss();

      if (!safeRoute(route)) {
        return;
      }

      window.setTimeout(() => {
        navigate(route);
      }, 80);
    }, [
      dismiss,
      navigate,
      notification,
    ]);

  if (
    !notification ||
    typeof document === "undefined"
  ) {
    return null;
  }

  return createPortal(
    <Banner
      notification={notification}
      leaving={leaving}
      onDismiss={dismiss}
      onOpen={openNotification}
    />,
    document.body
  );
}
