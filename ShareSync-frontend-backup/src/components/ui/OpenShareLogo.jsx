import React from 'react';

/**
 * OpenShare "Aperture" Logo
 * @param {string} className - Tailwind classes to control size and text color (which affects the brackets). 
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
        <linearGradient id="aperture-core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      {/* Structural Brackets - Inherits color from text utilities via 'currentColor' */}
      <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="miter" fill="none">
        <path d="M 12 5 L 4 13 L 4 19 L 12 27" />
        <path d="M 20 5 L 28 13 L 28 19 L 20 27" />
      </g>
      {/* Glowing Core */}
      <path d="M 16 9 L 23 16 L 16 23 L 9 16 Z" fill="url(#aperture-core-grad)" />
    </svg>
  );
}
