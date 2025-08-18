// Simple hook to read user preference (works without Framer Motion)
import { useEffect, useState } from "react";

export default function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return; // SSR or very old browsers
    const handle = () => setPrefers(!!mq.matches);
    handle();
    mq.addEventListener ? mq.addEventListener("change", handle) : mq.addListener(handle);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", handle) : mq.removeListener(handle);
    };
  }, []);

  return prefers;
}
