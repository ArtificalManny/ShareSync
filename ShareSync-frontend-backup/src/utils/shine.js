// Binds a cursor-follow glow to any element with [data-shine] inside a scope.
// Perf: throttled with rAF, writes only CSS vars (--shine-x/--shine-y/--shine-op).
// Also mirrors legacy vars (--sx/--sy/--sop) for backward compatibility.
export function bindShine(scope = document) {
    if (typeof window === "undefined" || !scope) return () => {};
  
    // Respect prefers-reduced-motion: bail out early
    try {
      const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
      if (mq && mq.matches) return () => {};
    } catch {}
  
    const els = Array.from(scope.querySelectorAll("[data-shine]"));
    if (els.length === 0) return () => {};
  
    // Per-element state
    const states = new Map();
  
    function setOpacity(el, v) {
      el.style.setProperty("--shine-op", String(v));
      el.style.setProperty("--sop", String(v)); // legacy
    }
    function writeXY(el, x, y) {
      // New tokens
      el.style.setProperty("--shine-x", `${x}px`);
      el.style.setProperty("--shine-y", `${y}px`);
      // Legacy mirrors
      el.style.setProperty("--sx", `${x}px`);
      el.style.setProperty("--sy", `${y}px`);
    }
  
    function onEnter(e) {
      const el = e.currentTarget;
      const st = states.get(el);
      st.rect = el.getBoundingClientRect();
      setOpacity(el, 1);
    }
  
    function onLeave(e) {
      const el = e.currentTarget;
      const st = states.get(el);
      setOpacity(el, 0);
      st.lastX = st.lastY = 0;
      if (st.raf) {
        cancelAnimationFrame(st.raf);
        st.raf = 0;
      }
    }
  
    function onMove(e) {
      const el = e.currentTarget;
      const st = states.get(el);
      if (!st.rect) st.rect = el.getBoundingClientRect();
  
      const x = e.clientX - st.rect.left;
      const y = e.clientY - st.rect.top;
  
      // Clamp once (no layout reads)
      const cx = x < 0 ? 0 : x > st.rect.width ? st.rect.width : x;
      const cy = y < 0 ? 0 : y > st.rect.height ? st.rect.height : y;
  
      st.lastX = cx;
      st.lastY = cy;
  
      if (st.raf) return; // frame already scheduled
      st.raf = requestAnimationFrame(() => {
        writeXY(el, st.lastX, st.lastY);
        st.raf = 0;
      });
    }
  
    // Keep rects fresh on resize/scroll (throttled)
    let rectRaf = 0;
    const refreshAllRects = () => {
      if (rectRaf) return;
      rectRaf = requestAnimationFrame(() => {
        els.forEach((el) => {
          const st = states.get(el);
          if (st) st.rect = el.getBoundingClientRect();
        });
        rectRaf = 0;
      });
    };
    window.addEventListener("resize", refreshAllRects, { passive: true });
    window.addEventListener("scroll", refreshAllRects, { passive: true });
  
    // Bind
    els.forEach((el) => {
      states.set(el, { rect: null, lastX: 0, lastY: 0, raf: 0 });
      setOpacity(el, 0); // default hidden
      // Only pointer events; passive to keep main thread free
      el.addEventListener("pointerenter", onEnter, { passive: true });
      el.addEventListener("pointerleave", onLeave, { passive: true });
      el.addEventListener("pointermove", onMove, { passive: true });
      el.addEventListener("pointercancel", onLeave, { passive: true });
    });
  
    // Cleanup
    return () => {
      window.removeEventListener("resize", refreshAllRects);
      window.removeEventListener("scroll", refreshAllRects);
      els.forEach((el) => {
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointerleave", onLeave);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointercancel", onLeave);
      });
      states.clear();
      if (rectRaf) cancelAnimationFrame(rectRaf);
    };
  }
  