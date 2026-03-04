// src/components/ErrorBoundary.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 5: Quiet Confidence
// ⭐ PHASE 9.2: Pitch Mode - Silent UI failures instead of red crashes
// ═══════════════════════════════════════════════════════════════════════════════
// FIXED: Removed chaotic animations (pulse, bounce, holographic)
// FIXED: Removed hardcoded colors → Design tokens
// ═══════════════════════════════════════════════════════════════════════════════

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // ⭐ PHASE 9.2: Check Pitch Mode via localStorage to keep it synchronous
      let isPitchMode = false;
      try {
        isPitchMode = localStorage.getItem('ss.pitchMode') === 'true';
      } catch(e) {}

      // If in Pitch Mode, fail silently so the demo doesn't stop
      if (isPitchMode) {
        return <div className="p-4 opacity-0 pointer-events-none" aria-hidden="true">Component temporarily unavailable</div>;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-surface-0 p-6">
          <div className="text-center max-w-md">
            {/* Icon */}
            <div className="w-14 h-14 bg-danger/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-danger" />
            </div>
            
            {/* Title */}
            <h1 className="text-xl font-semibold text-text-primary mb-2">
              Something Went Wrong
            </h1>
            
            {/* Error message */}
            <p className="text-sm text-text-secondary mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            
            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-surface-2 hover:bg-surface-3 text-text-primary text-sm font-medium rounded-lg transition-colors"
              >
                Reload Page
              </button>
              <Link
                to="/"
                className="px-4 py-2 bg-brand hover:bg-brand/80 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
