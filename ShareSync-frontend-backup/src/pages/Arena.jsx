// src/pages/Arena.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.1: Live Arena - Light Theme & Dark Mode Adapted
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useNavigate } from 'react-router-dom';
import LiveArena from '../components/arena/LiveArena';
import { PresenceProvider } from '../contexts/PresenceContext';
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function Arena() {
  useDocumentTitle("Arena");
  const navigate = useNavigate();

  const handleCoworkRequest = (member) => {
    // TODO: Open co-work modal or navigate to co-work page
    console.log('Co-work requested with:', member.name);
  };

  const handleMessageRequest = (member) => {
    // Navigate to messages with this user
    navigate(`/messages?to=${member.userId}`);
  };

  return (
    <PresenceProvider enabled={true}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] p-6 lg:p-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <LiveArena 
            onCoworkRequest={handleCoworkRequest}
            onMessageRequest={handleMessageRequest}
          />
        </div>
      </div>
    </PresenceProvider>
  );
}
