import React, { Component } from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  state = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <h1 className="text-3xl font-orbitron font-bold text-neon-magenta mb-4">Something Went Wrong</h1>
          <p className="text-cyber-teal text-lg font-inter mb-4">An unexpected error occurred. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-holo-silver"
            aria-label="Refresh page"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;