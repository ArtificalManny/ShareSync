// src/components/ui/Confetti.jsx
import React, { useEffect } from "react";

/**
 * Enhanced confetti burst with sound + haptics
 * Imperative API: call fireConfetti() to spawn a burst.
 */
export function fireConfetti({
  particles = 80,
  spread = 90,
  decay = 0.92,
  scalar = 1.2,
  duration = 1200,
  sound = true,
  haptic = true,
} = {}) {
  // Respect reduced motion
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  } catch {}

  // Haptics (PWA only)
  if (haptic && "vibrate" in navigator) {
    navigator.vibrate([50, 30, 50]);
  }

  // Sound (tiny pop)
  if (sound) {
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZ");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
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

  const colors = [
    "#22c55e", "#10b981", "#14b8a6", "#0ea5e9",
    "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
    "#d946ef", "#ec4899", "#f43f5e", "#ef4444",
    "#f97316", "#f59e0b", "#eab308", "#ca8a04",
  ];

  for (let i = 0; i < particles; i++) {
    const el = document.createElement("div");
    const size = (Math.random() * 7 + 5) * scalar;
    const angle = -90 + (Math.random() - 0.5) * spread;
    const velocity = (Math.random() * 10 + 14) * scalar;
    const color = colors[i % colors.length];
    const rotation = Math.random() * 360;

    Object.assign(el.style, {
      position: "absolute",
      left: `${45 + (Math.random() - 0.5) * 10}vw`,
      bottom: "0",
      width: `${size}px`,
      height: `${size * 0.7}px`,
      background: color,
      borderRadius: "3px",
      transform: `rotate(${rotation}deg)`,
      willChange: "transform, opacity",
      opacity: "1",
    });

    container.appendChild(el);

    let x = 0, y = 0, velX = Math.cos(angle * Math.PI / 180) * velocity, velY = Math.sin(angle * Math.PI / 180) * velocity;
    let rot = rotation;

    const start = performance.now();
    const tick = (now) => {
      const t = (now - start) / 1000;
      velY += 25 * t * 0.15;
      x += velX; y += velY;
      velX *= decay; velY *= decay;
      rot += velocity * 3;

      el.style.transform = `translate(${x}px, ${-y}px) rotate(${rot}deg)`;
      el.style.opacity = String(Math.max(0, 1 - (now - start) / duration));

      if (now - start < duration) {
        requestAnimationFrame(tick);
      } else {
        el.remove();
      }
    };
    requestAnimationFrame(tick);
  }

  setTimeout(() => container.remove(), duration + 300);
}

/**
 * React wrapper for declarative use
 */
export default function Confetti({ trigger = false, onComplete }) {
  useEffect(() => {
    if (trigger) {
      fireConfetti();
      onComplete?.();
    }
  }, [trigger, onComplete]);

  return null;
}