// Given a lastActivityAt and a window (default 5 minutes), returns { hasRecent }.
// Auto-expires exactly when the window elapses to avoid polling.
import { useEffect, useMemo, useState } from "react";

export default function useRecentFlag(lastActivityAt, windowMs = 5 * 60 * 1000) {
  const lastMs = useMemo(() => {
    if (!lastActivityAt) return 0;
    if (typeof lastActivityAt === "number") return lastActivityAt;
    const parsed = Date.parse(lastActivityAt);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [lastActivityAt]);

  const [, setTick] = useState(0);

  const hasRecent = lastMs > 0 && Date.now() - lastMs <= windowMs;

  useEffect(() => {
    if (!lastMs) return;
    const elapsed = Date.now() - lastMs;
    const remaining = Math.max(0, windowMs - elapsed);
    if (remaining === 0) {
      setTick((t) => t + 1);
      return;
    }
    const t = setTimeout(() => setTick((x) => x + 1), remaining + 5);
    return () => clearTimeout(t);
  }, [lastMs, windowMs]);

  return { hasRecent };
}
