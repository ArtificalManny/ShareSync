import React, { Component, ReactNode } from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #121212;
  color: #ff5555;
  text-align: center;
  padding: 20px;
`;

const ErrorMessage = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
`;

const Details = styled.p`
  font-size: 16px;
  color: #e0e0e0;
`;

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorMessage>Something went wrong.</ErrorMessage>
          <Details>
            {this.state.error && this.state.error.message}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </Details>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;