import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectHome from './pages/ProjectHome';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import './App.css';

const App = () => {
  console.log('App.jsx - Rendering App component');

  useEffect(() => {
    // Initialize particles.js
    if (window.particlesJS) {
      window.particlesJS('particles-js', {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: '#FF00FF' }, // Neon magenta particles
          shape: { type: 'circle' },
          opacity: { value: 0.5, random: false },
          size: { value: 3, random: true },
          line_linked: { enable: true, distance: 150, color: '#00FFFF', opacity: 0.4, width: 1 }, // Cyber teal links
          move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
        },
        interactivity: {
          detect_on: 'canvas',
          events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
          modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
        },
        retina_detect: true
      });
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <div id="particles-js" className="particles-background"></div>
          <Navbar />
          <Suspense fallback={<div className="text-light-text">Loading page...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectHome />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="*" element={<div className="text-light-text text-center mt-8">404 - Page Not Found</div>} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;