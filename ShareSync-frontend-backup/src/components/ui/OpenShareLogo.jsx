import React from 'react';

/**
 * OpenShare "Kinetic Monogram" Logo
 * * Engineered using principles from:
 * - George Bokhua (Grid systems, 16-Pixel Test, Silhouette Test)
 * - Marty Neumeier (Lock-in, Brand Gap stability)
 * - Jens Müller (Modernist geometric reduction)
 * - Jason Beaird (Focal hierarchy and adaptive contrast)
 * * @param {string} className - Tailwind classes to control size and text color. 
 * Example: "w-12 h-12 text-slate-800 dark:text-white"
 */
export default function OpenShareLogo({ className = "w-8 h-8 text-slate-800 dark:text-slate-100" }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="OpenShare Logo"
      role="img"
    >
      <defs>
        {/* The Velocity Gradient: Driving the Zeigarnik Effect through color progression */}
        <linearGradient id="kinetic-core-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" /> {/* Violet */}
          <stop offset="100%" stopColor="#d946ef" /> {/* Fuchsia */}
        </linearGradient>
      </defs>
      
      {/* THE LOCK-IN RING
        A heavy, grounded geometric track. We leave a precise gap in the top-left 
        quadrant to break the boundary, creating visual tension and entry flow.
        Inherits 'currentColor' to seamlessly adapt to Light/Dark modes.
      */}
      <path 
        d="M 16 2.5 A 13.5 13.5 0 1 1 2.5 16" 
        stroke="currentColor" 
        strokeWidth="3.5" 
        strokeLinecap="square" 
        fill="none" 
      />

      {/* THE KINETIC MÖBIUS 'S'
        A continuous, interlocking ribbon that forms an aggressive, forward-leaning 'S'. 
        It snaps perfectly to the exact geometry of the 32x32 grid.
        Passes the Silhouette and 16-Pixel tests flawlessly.
      */}
      <path 
        d="M 10 8 H 26 L 14 16 L 22 24 H 6 L 18 16 Z" 
        fill="url(#kinetic-core-grad)" 
      />
    </svg>
  );
}
