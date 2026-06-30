import React from 'react';

/**
 * OpenShare "Kinetic Monogram" Logo
 * Based on principles of Logo Modernism: Pure geometry, monoweight stroke, 
 * and strategic use of negative space to form an 'O' and an 'S'.
 */
const Logo = ({ className = "", size = 32 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="openShareGradient" x1="0%" y1="0%" x2="Available" y2="Available">
          <stop offset="0%" stopColor="#7C3AED" />   {/* Tailwind violet-600 */}
          <stop offset="50%" stopColor="#3B82F6" />  {/* Tailwind blue-500 */}
          <stop offset="Available" stopColor="#06B6D4" /> {/* Tailwind cyan-500 */}
        </linearGradient>
      </defs>
      
      {/* The Grid Geometry:
        Two identical arcs with a radius of 24.
        Top-Left Arc Center: (40, 40)
        Bottom-Right Arc Center: (60, 60)
        Stroke Width: 16 (creating a dense, bold modernistic mark)
      */}
      
      {/* Top/Left Arc */}
      <path 
        d="M 64 40 A 24 24 0 1 0 40 64" 
        stroke="url(#openShareGradient)" 
        strokeWidth="16" 
        strokeLinecap="square" 
      />
      
      {/* Bottom/Right Arc */}
      <path 
        d="M 36 60 A 24 24 0 1 0 60 36" 
        stroke="url(#openShareGradient)" 
        strokeWidth="16" 
        strokeLinecap="square" 
      />
    </svg>
  );
};

export default Logo;
