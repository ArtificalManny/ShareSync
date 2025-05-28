import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Projects from './pages/Projects';
import CreateProject from './pages/CreateProject';
import ProjectHome from './pages/ProjectHome';
import Profile from './pages/Profile';
import './App.css';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    console.error('ErrorBoundary - Caught an error during rendering:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary - Error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  console.log('App.jsx - Rendering App component...');
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <Navigation />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/create" element={<CreateProject />} />
              <Route path="/projects/:id" element={<ProjectHome />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="*" element={<h1>404 - Page Not Found</h1>} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;