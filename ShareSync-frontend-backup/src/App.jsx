import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from './context/AuthContext.jsx';
import { UserContext } from './context/UserContext.jsx';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import ResetPassword from './components/ResetPassword.jsx';
import Profile from './components/Profile.jsx';
import Projects from './components/Projects.jsx';
import ProjectHome from './components/ProjectHome.jsx';
import CreateProject from './components/CreateProject.jsx';
import Notifications from './components/Notifications.jsx'; // New component for notifications
import TeamActivity from './components/TeamActivity.jsx'; // New component for team activity

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useContext(UserContext) || {};
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'loading:', loading);
  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>Loading...</div>;
  }
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const { user } = useContext(AuthContext) || {};
  console.log('App - user:', user);

  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/projects" element={<Projects />} />
        <Route path="/project/:id" element={<ProjectHome />} />
        <Route
          path="/create-project"
          element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team-activity"
          element={
            <ProtectedRoute>
              <TeamActivity />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;