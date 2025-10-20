import React from "react";
import { Plus, Check } from "lucide-react";
import { track } from "../../utils/telemetry";

/**
 * FollowButton
 * Minimal follow/unfollow with count.
 *
 * Props:
 * - isFollowing: boolean
 * - count?: number
 * - onToggle?: (next: boolean) => void
 * - size?: "sm" | "md" (default "md")
 * - entity?: { id: string, type?: "user" | "project", name?: string }
 */
export default function FollowButton({
  isFollowing = false,
  count,
  onToggle,
  size = "md",
  entity,
}) {
  const [busy, setBusy] = React.useState(false);
  const [localFollowing, setLocalFollowing] = React.useState(isFollowing);
  const [localCount, setLocalCount] = React.useState(count ?? 0);

  React.useEffect(() => setLocalFollowing(isFollowing), [isFollowing]);
  React.useEffect(() => setLocalCount(count ?? 0), [count]);

  const click = async () => {
    if (busy) return;
    const next = !localFollowing;
    // optimistic
    setLocalFollowing(next);
    setLocalCount((c) => c + (next ? 1 : -1));
    setBusy(true);
    try {
      track(next ? "follow_clicked" : "unfollow_clicked", {
        id: entity?.id,
        type: entity?.type || "project",
      });
      await onToggle?.(next);
    } catch {
      // revert on error
      setLocalFollowing(!next);
      setLocalCount((c) => c - (next ? 1 : -1));
    } finally {
      setBusy(false);
    }
  };

  const cls =
    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors";
  const isOn = localFollowing;

  return (
    <button
      type="button"
      disabled={busy}
      onClick={click}
      className={cls}
      style={{
        opacity: busy ? 0.75 : 1,
        borderColor: isOn ? "rgba(34,211,238,.45)" : "rgba(255,255,255,.14)",
        background: isOn
          ? "linear-gradient(90deg, rgba(124,58,237,.25), rgba(34,211,238,.25))"
          : "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))",
        paddingInline: size === "sm" ? 8 : 12,
        paddingBlock: size === "sm" ? 4 : 6,
      }}
      title={isOn ? "Unfollow" : "Follow"}
      aria-pressed={isOn ? "true" : "false"}
    >
      {isOn ? <Check size={14} /> : <Plus size={14} />}
      {isOn ? "Following" : "Follow"}
      {typeof localCount === "number" ? (
        <span className="tabular-nums opacity-75">· {localCount}</span>
      ) : null}
    </button>
  );
}
