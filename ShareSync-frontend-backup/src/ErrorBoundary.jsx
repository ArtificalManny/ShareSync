// src/ErrorBoundary.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 5: Quiet Confidence
// ═══════════════════════════════════════════════════════════════════════════════
// FIXED: Hardcoded rose/indigo colors → Design tokens
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="p-6">
          <div className="max-w-xl mx-auto rounded-xl border border-danger/20 bg-danger/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-text-primary">Something went wrong</div>
                <div className="text-sm mt-1 text-text-secondary">
                  {String(this.state.error?.message || this.state.error || "Unknown error")}
                </div>
                <button
                  className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-danger hover:bg-danger/80 text-white text-sm font-medium rounded-lg transition-colors"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reload
                </button>
              </div>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
