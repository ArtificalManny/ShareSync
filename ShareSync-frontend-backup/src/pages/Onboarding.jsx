// src/pages/Onboarding.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9: Onboarding Page Route
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import useOnboarding from '../hooks/useOnboarding';
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function Onboarding() {
  useDocumentTitle("Onboarding");
  const { user, loading } = useAuth();
  const { isCompleted } = useOnboarding();
  
  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to home if already completed
  if (isCompleted) {
    return <Navigate to="/home" replace />;
  }
  
  return <OnboardingFlow />;
}
