import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import NotificationToast from './components/NotificationToast';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Projects from './pages/Projects';
import ProjectHome from './pages/ProjectHome';
import Profile from './pages/Profile';
import './App.css';

// ProtectedRoute ensures that only authenticated users can access certain routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading"></div>
        <span className="text-neon-magenta text-xl font-orbitron ml-4">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Main App component that sets up routing and global providers
const App = () => {
  const { theme, toggleTheme } = useContext(AuthContext);

  return (
    <AuthProvider>
      <NotificationProvider>
        {/* ErrorBoundary catches any unhandled errors in the component tree */}
        <ErrorBoundary>
          <Router>
            <div className={`app-container ${theme}`}>
              <Navbar />
              {/* Theme toggle button, persists user preference in localStorage */}
              <button
                onClick={toggleTheme}
                className="fixed top-4 right-4 z-50 btn-primary rounded-full flex items-center px-4 py-2 text-base font-inter animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              >
                {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </button>
              {/* Global notification toast displays real-time notifications */}
              <NotificationToast />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute>
                      <Projects />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:id"
                  element={
                    <ProtectedRoute>
                      <ProjectHome />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:username"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </ErrorBoundary>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;