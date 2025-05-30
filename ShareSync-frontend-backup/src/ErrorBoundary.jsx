import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends Component {
  state = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary - Caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0d0d1a] to-[#1a1a2e] text-holo-gray">
          <AlertCircle className="w-16 h-16 text-holo-pink mb-4 animate-pulse" />
          <h1 className="text-3xl font-inter text-holo-blue mb-4">Something Went Wrong</h1>
          <p className="text-lg mb-4">An unexpected error occurred. Please try again later.</p>
          <p className="text-sm mb-6">{this.state.error?.message || 'Unknown error'}</p>
          <Link to="/" className="btn-primary rounded-full flex items-center animate-glow">
            Return to Home
          </Link>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;