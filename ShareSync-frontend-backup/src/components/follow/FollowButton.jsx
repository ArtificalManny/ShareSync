// src/components/follow/FollowButton.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, Settings2 } from "lucide-react";
import { toast } from "../ui/toast";
import {
  followProject,
  unfollowProject,
  getFollowStatus,
} from "../../api/follows";
import FollowPrefsModal from "./FollowPrefsModal";

export default function FollowButton({
  projectId,
  projectName = "this project",
  size = "sm", // "sm" | "md"
  variant = "emerald", // "emerald" | "blue"
  className = "",
}) {
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const btnSize = useMemo(() => {
    if (size === "md") return "px-4 py-2.5 text-sm";
    return "px-3 py-2 text-xs";
  }, [size]);

  const palette = useMemo(() => {
    if (variant === "blue") {
      return {
        base: "bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30",
        on: "bg-blue-600/30 hover:bg-blue-600/35 border-blue-400/40",
        icon: "text-blue-200",
      };
    }
    return {
      base: "bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/30",
      on: "bg-emerald-600/30 hover:bg-emerald-600/35 border-emerald-400/40",
      icon: "text-emerald-200",
    };
  }, [variant]);

  useEffect(() => {
    let alive = true;

    async function loadStatus() {
      try {
        setStatusLoading(true);
        const res = await getFollowStatus(projectId);
        if (!alive) return;

        const nextFollowing = Boolean(res?.isFollowing);
        setIsFollowing(nextFollowing);
        setPreferences(res?.preferences || null);
      } catch (e) {
        // Safe: treat as not following if endpoint fails (prevents Discover from breaking)
        if (!alive) return;
        setIsFollowing(false);
        setPreferences(null);
      } finally {
        if (!alive) return;
        setStatusLoading(false);
      }
    }

    if (projectId) loadStatus();

    return () => {
      alive = false;
    };
  }, [projectId]);

  async function onToggleFollow(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!projectId) return;

    try {
      setLoading(true);

      if (isFollowing) {
        await unfollowProject(projectId);
        setIsFollowing(false);
        setPreferences(null);
        toast({ title: `Unfollowed ${projectName}`, variant: "success" });
      } else {
        const res = await followProject(projectId);
        setIsFollowing(true);
        setPreferences(res?.preferences || preferences || null);
        toast({ title: `Now following ${projectName}`, variant: "success" });

        // Open prefs right after following (nice UX, optional)
        setPrefsOpen(true);
      }
    } catch (err) {
      toast({
        title: err?.message || "Follow action failed",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  function onOpenPrefs(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setPrefsOpen(true);
  }

  const disabled = loading || statusLoading;

  const label = statusLoading
    ? "…"
    : isFollowing
      ? "Following"
      : "Follow";

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          disabled={disabled}
          onClick={onToggleFollow}
          className={[
            "rounded-lg font-semibold transition-all active:scale-95 border",
            btnSize,
            "flex flex-col items-center justify-center gap-1",
            isFollowing ? palette.on : palette.base,
            disabled ? "opacity-70 cursor-not-allowed" : "",
          ].join(" ")}
          title={isFollowing ? `Unfollow ${projectName}` : `Follow ${projectName}`}
        >
          {isFollowing ? (
            <Bell className={`w-4 h-4 ${palette.icon}`} />
          ) : (
            <BellOff className={`w-4 h-4 ${palette.icon}`} />
          )}
          <span>{label}</span>
        </button>

        {/* Prefs gear (only visible when following) */}
        {isFollowing && (
          <button
            type="button"
            disabled={disabled}
            onClick={onOpenPrefs}
            className={[
              "h-10 w-10 rounded-lg border",
              "bg-slate-900/40 hover:bg-slate-900/55 border-white/10",
              "flex items-center justify-center transition-all active:scale-95",
              disabled ? "opacity-70 cursor-not-allowed" : "",
            ].join(" ")}
            title="Follow preferences"
          >
            <Settings2 className="w-4 h-4 text-slate-200" />
          </button>
        )}
      </div>

      <FollowPrefsModal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        projectId={projectId}
        projectName={projectName}
        initialPreferences={preferences}
        onSaved={(nextPrefs) => {
          setPreferences(nextPrefs);
          toast({ title: "Follow preferences saved", variant: "success" });
        }}
      />
    </>
  );
}
