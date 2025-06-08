// ─────────────────────────────────────────────────────────────────────────────
// src/components/StoryCarousel.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

const StoryCarousel = ({ projects }) => (
  <div className="flex space-x-4 overflow-x-auto pb-2 no-scrollbar">
    {projects.map((p) => (
      <div key={p.id} className="relative">
        <img
          src={p.avatarUrl}
          alt={p.name}
          className={`w-16 h-16 rounded-full border-2 ${
            p.hasRecentUpdate ? 'border-indigo-500 animate-pulse' : 'border-gray-300'
          }`}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
          {p.name}
        </span>
      </div>
    ))}
  </div>
);

export default StoryCarousel;
