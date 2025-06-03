import React, { Component } from 'react';
import { Link } from 'react-router-dom';

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
        <div className="error-boundary flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-orbitron font-bold text-primary-blue mb-4">Something Went Wrong</h1>
            <p className="text-accent-teal text-lg font-inter mb-4">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <Link
              to="/"
              className="text-primary-blue hover:underline text-base font-orbitron focus:outline-none focus:ring-2 focus:ring-neutral-gray"
            >
              Return to Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;