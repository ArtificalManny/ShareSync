import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ErrorBoundary from './ErrorBoundary';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Projects from './pages/Projects';
import ProjectHome from './pages/ProjectHome';
import ProjectCreate from './pages/ProjectCreate';
import Profile from './pages/Profile';
import './App.css';

const App = () => {
  console.log('App - Starting render');

  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className={`app-container ${theme}`}>
            <Navbar toggleTheme={toggleTheme} theme={theme} />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectHome />} />
              <Route path="/projects/create" element={<ProjectCreate />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;