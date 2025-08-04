// src/utils/confetti.js
import confetti from 'canvas-confetti';

// Function to call when you want confetti
export const launchConfetti = () => {
  const duration = 2 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    const particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, {
      particleCount,
      origin: { x: Math.random(), y: Math.random() - 0.2 },
    }));
  }, 250);
};

// Since there's no actual React component, return null
export default function ConfettiExplosion() {
  return null; // placeholder for now — won't break anything
}