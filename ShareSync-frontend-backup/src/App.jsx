import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navbar from './Navbar';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectsCreate from './pages/ProjectsCreate';
import ProjectHome from './pages/ProjectHome';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import './App.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container dark">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/create" element={<ProjectsCreate />} />
            <Route path="/projects/:id" element={<ProjectHome />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;