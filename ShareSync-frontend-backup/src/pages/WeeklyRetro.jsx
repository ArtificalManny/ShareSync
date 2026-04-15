// src/pages/WeeklyRetro.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.4: Weekly Retro - Dedicated Page
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WeeklyRetro from '../components/retro/WeeklyRetro';
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function WeeklyRetroPage() {
  useDocumentTitle("Weekly Retro");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-0 p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="
            flex items-center gap-2 mb-6
            text-text-tertiary hover:text-text-primary
            transition-colors
          "
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        {/* Retro content (non-modal mode) */}
        <div className="p-6 rounded-2xl bg-surface-1 border border-white/[0.06]">
          <WeeklyRetro isOpen={true} isModal={false} />
        </div>
      </div>
    </div>
  );
}
