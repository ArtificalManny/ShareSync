// src/utils/celebrate.js
export default function celebrate() {
    try {
      // Add a transient class on <body> for a subtle glow or confetti CSS hook
      const cls = "win-glow";
      document.body.classList.add(cls);
      setTimeout(() => document.body.classList.remove(cls), 900);
    } catch {}
  }
  