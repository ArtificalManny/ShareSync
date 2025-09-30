import { useEffect, useState } from "react";

/**
 * useDebounce(value, delayMs)
 * Returns a debounced copy of `value` that only updates after `delayMs` of inactivity.
 */
export default function useDebounce(value, delayMs = 200) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      if (alive) setDebounced(value);
    }, Math.max(0, delayMs));
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [value, delayMs]);

  return debounced;
}
