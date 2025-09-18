// Dev-only-ish FPS meter using requestAnimationFrame.
// Usage: const h = start('shine-hover', { overlay: true }); h.stop()

const isDev =
  (typeof importMeta !== "undefined" && importMeta?.env?.DEV) ||
  (typeof import.meta !== "undefined" && import.meta?.env?.DEV) ||
  (typeof process !== "undefined" && process?.env?.NODE_ENV !== "production");

function makeOverlay(position = "tr") {
  const el = document.createElement("div");
  el.setAttribute("data-fps-overlay", "true");
  el.style.position = "fixed";
  el.style.zIndex = "2147483647";
  el.style.padding = "6px 8px";
  el.style.borderRadius = "8px";
  el.style.font = "12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  el.style.background = "rgba(0,0,0,.55)";
  el.style.color = "white";
  el.style.pointerEvents = "none";
  el.style.backdropFilter = "saturate(1.2) blur(4px)";
  el.style.boxShadow = "0 2px 8px rgba(0,0,0,.25)";
  const pad = "8px";
  if (position === "tr") { el.style.top = pad; el.style.right = pad; }
  if (position === "tl") { el.style.top = pad; el.style.left = pad; }
  if (position === "br") { el.style.bottom = pad; el.style.right = pad; }
  if (position === "bl") { el.style.bottom = pad; el.style.left = pad; }
  el.textContent = "FPS —";
  document.body.appendChild(el);
  return el;
}

export function start(label = "fps", opts = {}) {
  if (typeof window === "undefined") {
    return { stop() {} };
  }

  const { overlay = false, position = "tr" } = opts;
  const overlayEl = overlay && isDev ? makeOverlay(position) : null;

  let running = true;
  let rafId = 0;
  let frames = 0;
  let lastTs = performance.now();
  let lastLog = lastTs;
  let lastFps = 0;

  const loop = (ts) => {
    if (!running) return;
    frames++;

    // Log/flush every ~1000ms
    if (ts - lastLog >= 1000) {
      const diff = ts - lastLog;
      lastFps = (frames * 1000) / diff;
      frames = 0;
      lastLog = ts;

      if (isDev) {
        // eslint-disable-next-line no-console
        console.debug(`[fps] ${label}: ${lastFps.toFixed(1)}`);
      }
      if (overlayEl) overlayEl.textContent = `FPS ${lastFps.toFixed(0)} · ${label}`;
    }

    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);

  return {
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
    },
    get value() {
      return lastFps;
    },
  };
}
