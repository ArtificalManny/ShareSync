// src/components/ErrorBoundary.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 5: Quiet Confidence
// ═══════════════════════════════════════════════════════════════════════════════
// FIXED: Removed chaotic animations (pulse, bounce, holographic)
// FIXED: Removed hardcoded colors → Design tokens
// UPDATED (Task 1.4): Injected FallbackUI for branded error handling
// ═══════════════════════════════════════════════════════════════════════════════

import React, { Component } from 'react';
import FallbackUI from './FallbackUI';

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
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#09090B] p-6">
          <div className="w-full max-w-lg">
            <FallbackUI 
              type="error" 
              message={this.state.error?.message || 'An unexpected error occurred during rendering.'}
              retryAction={() => window.location.reload()} 
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
