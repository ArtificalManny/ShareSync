// Returns { isFresh } for an item that carries a `freshUntil` timestamp.
// If absent or in the past, isFresh=false. The hook self-expires at the right time.
import { useEffect, useMemo, useState } from "react";

export default function useFreshHighlight(freshUntil) {
  const untilMs = useMemo(() => {
    if (!freshUntil) return 0;
    if (typeof freshUntil === "number") return freshUntil;
    const parsed = Date.parse(freshUntil);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [freshUntil]);

  const now = Date.now();
  const initial = untilMs > now;
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!untilMs) return;
    const remaining = Math.max(0, untilMs - Date.now());
    if (remaining === 0) {
      // ensure we render once more to drop the highlight
      setTick((t) => t + 1);
      return;
    }
    const t = setTimeout(() => setTick((x) => x + 1), remaining + 5);
    return () => clearTimeout(t);
  }, [untilMs]);

  return { isFresh: initial && Date.now() < untilMs };
}
