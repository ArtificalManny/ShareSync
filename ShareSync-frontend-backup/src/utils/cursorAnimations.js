/**
 * cursorAnimations.js
 * JavaScript controllers for cursor animations
 */

// Easing functions
export const Easing = {
    linear: (t) => t,
    easeOut: (t) => t * (2 - t),
    easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  };
  
  // Confetti generator
  export class ConfettiGenerator {
    constructor() {
      this.colors = ['#8B5CF6', '#EC4899', '#6366F1', '#FCD34D', '#10B981'];
    }
  
    generate(count = 150, origin = { x: 50, y: 50 }) {
      const confetti = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 5 + Math.random() * 10;
        confetti.push({
          id: Date.now() + i,
          x: origin.x,
          y: origin.y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 5,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          size: 4 + Math.random() * 8,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          gravity: 0.5 + Math.random() * 0.5,
          birthTime: Date.now(),
        });
      }
      return confetti;
    }
  
    update(confetti) {
      const now = Date.now();
      return confetti
        .map((piece) => {
          piece.x += piece.vx * 0.1;
          piece.y += piece.vy * 0.1;
          piece.vy += piece.gravity;
          piece.rotation += piece.rotationSpeed;
          const age = (now - piece.birthTime) / 3000;
          piece.opacity = Math.max(0, 1 - age);
          return piece;
        })
        .filter((piece) => piece.y < 100 && piece.opacity > 0);
    }
  }
  
  export default { Easing, ConfettiGenerator };