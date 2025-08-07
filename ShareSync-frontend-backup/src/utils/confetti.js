import confetti from 'canvas-confetti';

let hasFired = {};

export const fireConfetti = (key = 'default') => {
  if (hasFired[key]) return;

  hasFired[key] = true;

  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });

  // Reset trigger after 5 seconds so it can be used again
  setTimeout(() => {
    hasFired[key] = false;
  }, 5000);
};