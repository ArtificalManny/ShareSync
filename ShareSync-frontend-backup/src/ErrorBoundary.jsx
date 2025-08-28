// src/components/util/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // Optional: send to telemetry
    console.error("[ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <main className="p-6">
          <div className="max-w-xl mx-auto rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 p-4">
            <div className="font-semibold">Something went wrong.</div>
            <div className="text-sm mt-1 opacity-80">
              {String(this.state.error?.message || this.state.error || "Unknown error")}
            </div>
            <button
              className="mt-3 inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-white text-sm"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}