import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navbar from './components/Navbar';
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
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <Suspense fallback={<div className="text-holo-gray">Loading page...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectHome />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="*" element={<div className="text-holo-gray text-center mt-8">404 - Page Not Found</div>} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;