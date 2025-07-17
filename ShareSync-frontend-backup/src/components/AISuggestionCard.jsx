///Users/artificalmanny/Portfolio/ShareSync/ShareSync-frontend-backup/src/components/AISuggestionCard.jsx
import React from 'react';

export default function AISuggestionCard({ message }) {
  return (
    <div className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100 p-4 rounded-xl shadow-md mt-6">
      <h3 className="text-lg font-semibold">🔮 AI Suggestion</h3>
      <p className="text-sm mt-1">{message || "Coming soon: smart tips based on your momentum."}</p>
    </div>
  );
}
