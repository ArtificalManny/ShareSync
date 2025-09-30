import React, { useEffect, useRef } from "react";

/**
 * ConfettiBurst
 * Lightweight, motion-safe celebration effect.
 *
 * Props:
 * - fire: boolean          → when true, runs once (edge-triggered)
 * - count?: number         → particle count (default 80)
 * - duration?: number      → ms (default 900)
 * - onDone?: () => void
 *
 * Respects prefers-reduced-motion (no-op when reduced).
 */
export default function ConfettiBurst({ fire, count = 80, duration = 900, onDone }) {
  const canvasRef = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!fire || firedRef.current) return;
    firedRef.current = true;

    // motion a11y
    const motionReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (motionReduced) { onDone?.(); return; }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    let raf = 0;
    let start = 0;
    const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    function resize() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    // particles
    const colors = [
      "#f97316", "#fb923c", // orange CTA
      "#22c55e", "#16a34a", // green success
      "#ef4444", "#b91c1c", // red error
      "#a855f7", "#ec4899", // purple-pink XP
      "#60a5fa", "#4f46e5", // blue/indigo
    ];
    const rand = (min, max) => Math.random() * (max - min) + min;

    const particles = Array.from({ length: Math.max(10, count | 0) }).map(() => ({
      x: canvas.clientWidth / 2 + rand(-40, 40),
      y: canvas.clientHeight / 2 + rand(-10, 10),
      vx: rand(-4, 4),
      vy: rand(-6, -2),
      g: rand(0.05, 0.12),
      s: rand(2, 4),
      a: rand(0, Math.PI * 2),
      color: colors[(Math.random() * colors.length) | 0],
      life: rand(0.8, 1.2), // 0..1 normalized lifespan
    }));

    function step(ts) {
      if (!start) start = ts;
      const t = ts - start;
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      particles.forEach((p) => {
        // integrate
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.a += 0.05;
        const alpha = Math.max(0, 1 - t / duration) * p.life;

        // draw
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.fillRect(-p.s, -p.s, p.s * 2, p.s * 2);
        ctx.restore();
      });

      if (t < duration) {
        raf = requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        onDone?.();
      }
    }

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [fire, count, duration, onDone]);

  // Keep the canvas overlay dormant until fired.
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70]"
      style={{ contain: "layout paint size" }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
