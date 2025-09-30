import React from "react";

/**
 * Tiny, dependency-free confetti burst.
 * Imperative API: call fireConfetti() to spawn a short burst.
 * Motion-aware: no-op when prefers-reduced-motion is set.
 */

export function fireConfetti({
  particles = 60,
  spread = 80,
  decay = 0.9,
  scalar = 1,
  duration = 900,
} = {}) {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return; // respect reduced motion
    }
  } catch {
    /* ignore */
  }

  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  Object.assign(container.style, {
    position: "fixed",
    inset: "0",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: 9999,
  });
  document.body.appendChild(container);

  const angleBase = -90; // upwards
  const colors = ["#22c55e", "#f59e0b", "#ef4444", "#6366f1", "#06b6d4", "#eab308"];

  for (let i = 0; i < particles; i++) {
    const el = document.createElement("div");
    const size = (Math.random() * 6 + 6) * scalar;
    const left = 50; // center-ish
    const angle = angleBase + (Math.random() - 0.5) * spread;
    const velocity = (Math.random() * 8 + 12) * scalar;
    const color = colors[i % colors.length];

    Object.assign(el.style, {
      position: "absolute",
      left: `${left}vw`,
      bottom: "0",
      width: `${size}px`,
      height: `${size * 0.6}px`,
      background: color,
      transform: "translate3d(0,0,0) rotate(0deg)",
      borderRadius: "2px",
      willChange: "transform, opacity",
      opacity: "1",
    });

    container.appendChild(el);

    // simple physics
    let x = 0;
    let y = 0;
    let velX = Math.cos((angle * Math.PI) / 180) * velocity;
    let velY = Math.sin((angle * Math.PI) / 180) * velocity;
    let rot = Math.random() * 360;

    const start = performance.now();
    const tick = (now) => {
      const t = (now - start) / 1000;
      // gravity-ish
      velY += 20 * t * 0.12;
      x += velX;
      y += velY;
      velX *= decay;
      velY *= decay;
      rot += velocity * 2;

      el.style.transform = `translate3d(${x}px, ${y * -1}px, 0) rotate(${rot}deg)`;
      el.style.opacity = String(Math.max(0, 1 - (now - start) / duration));

      if (now - start < duration) {
        requestAnimationFrame(tick);
      } else {
        el.remove();
      }
    };
    requestAnimationFrame(tick);
  }

  // cleanup container after a beat
  setTimeout(() => {
    try { container.remove(); } catch {}
  }, duration + 200);
}

/**
 * Optional React component if you prefer declarative usage later.
 * For now, we export only fireConfetti() and this component does nothing.
 */
export default function Confetti() {
  return null;
}
