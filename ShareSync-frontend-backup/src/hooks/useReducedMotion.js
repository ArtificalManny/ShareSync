// Simple hook to read user preference for reduced motion.
import { useEffect, useState } from "react";

export default function useReducedMotion() {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return; // SSR / very old browsers
    const update = () => setPrefers(!!mq.matches);
    update();
    mq.addEventListener ? mq.addEventListener("change", update) : mq.addListener(update);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", update) : mq.removeListener(update);
    };
  }, []);

  return prefers;
}
