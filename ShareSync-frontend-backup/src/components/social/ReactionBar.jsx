import React from "react";
import { ThumbsUp, Flame } from "lucide-react";
import { track } from "../../utils/telemetry";

/**
 * ReactionBar
 * Lightweight social reactions for cards/LIs (👏 👍 🔥).
 *
 * Props:
 * - entity: { id: string, type?: "project" | "update" | "task", name?: string }
 * - counts?: { clap?: number, like?: number, fire?: number }
 * - mine?: { clap?: boolean, like?: boolean, fire?: boolean } // current user toggles
 * - onChange?: (payload: { name: "clap"|"like"|"fire", next: boolean, counts: object }) => Promise<void>|void
 * - size?: "sm" | "md" (default "sm")
 * - disabled?: boolean
 */
export default function ReactionBar({
  entity,
  counts = {},
  mine = {},
  onChange,
  size = "sm",
  disabled = false,
}) {
  const [localCounts, setLocalCounts] = React.useState({
    clap: counts.clap ?? 0,
    like: counts.like ?? 0,
    fire: counts.fire ?? 0,
  });
  const [localMine, setLocalMine] = React.useState({
    clap: !!mine.clap,
    like: !!mine.like,
    fire: !!mine.fire,
  });
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setLocalCounts({
      clap: counts.clap ?? 0,
      like: counts.like ?? 0,
      fire: counts.fire ?? 0,
    });
  }, [counts.clap, counts.like, counts.fire]);

  React.useEffect(() => {
    setLocalMine({
      clap: !!mine.clap,
      like: !!mine.like,
      fire: !!mine.fire,
    });
  }, [mine.clap, mine.like, mine.fire]);

  const toggle = async (name) => {
    if (busy || disabled) return;
    const next = !localMine[name];
    // optimistic UI
    setBusy(true);
    setLocalMine((m) => ({ ...m, [name]: next }));
    setLocalCounts((c) => ({ ...c, [name]: c[name] + (next ? 1 : -1) }));

    try {
      track("reaction_clicked", {
        reaction: name,
        next,
        entityId: entity?.id,
        entityType: entity?.type || "project",
      });
      await onChange?.({ name, next, counts: { ...localCounts, [name]: localCounts[name] + (next ? 1 : -1) } });
    } catch {
      // revert on error
      setLocalMine((m) => ({ ...m, [name]: !next }));
      setLocalCounts((c) => ({ ...c, [name]: c[name] + (next ? -1 : 1) }));
    } finally {
      setBusy(false);
    }
  };

  const sz = size === "sm" ? { pad: "px-2 py-1", gap: "gap-1", text: "text-[11px]" } : { pad: "px-3 py-1.5", gap: "gap-1.5", text: "text-xs" };

  return (
    <div className={`inline-flex items-center ${sz.gap}`} aria-label="Reactions">
      {/* Clap uses an emoji to avoid extra icon deps */}
      <button
        type="button"
        disabled={busy || disabled}
        onClick={() => toggle("clap")}
        className={`${sz.pad} ${sz.text} rounded-full border transition-colors inline-flex items-center ${sz.gap}`}
        style={{
          borderColor: localMine.clap ? "rgba(124,58,237,.45)" : "rgba(255,255,255,.14)",
          background: localMine.clap
            ? "linear-gradient(90deg, rgba(124,58,237,.22), rgba(34,211,238,.22))"
            : "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))",
        }}
        title={localMine.clap ? "Remove clap" : "Clap"}
      >
        <span aria-hidden>👏</span>
        <span className="tabular-nums opacity-80">{localCounts.clap}</span>
      </button>

      <button
        type="button"
        disabled={busy || disabled}
        onClick={() => toggle("like")}
        className={`${sz.pad} ${sz.text} rounded-full border transition-colors inline-flex items-center ${sz.gap}`}
        style={{
          borderColor: localMine.like ? "rgba(59,130,246,.45)" : "rgba(255,255,255,.14)",
          background: localMine.like
            ? "linear-gradient(90deg, rgba(59,130,246,.22), rgba(34,197,94,.18))"
            : "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))",
        }}
        title={localMine.like ? "Remove like" : "Like"}
      >
        <ThumbsUp size={14} />
        <span className="tabular-nums opacity-80">{localCounts.like}</span>
      </button>

      <button
        type="button"
        disabled={busy || disabled}
        onClick={() => toggle("fire")}
        className={`${sz.pad} ${sz.text} rounded-full border transition-colors inline-flex items-center ${sz.gap}`}
        style={{
          borderColor: localMine.fire ? "rgba(251,146,60,.5)" : "rgba(255,255,255,.14)",
          background: localMine.fire
            ? "linear-gradient(90deg, rgba(251,146,60,.24), rgba(244,63,94,.18))"
            : "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))",
        }}
        title={localMine.fire ? "Remove fire" : "Fire"}
      >
        <Flame size={14} />
        <span className="tabular-nums opacity-80">{localCounts.fire}</span>
      </button>
    </div>
  );
}
