import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Login from './components/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Projects from './pages/Projects';
import Notifications from './pages/Notifications';
import Leaderboard from './pages/Leaderboard';
import ProjectPage from './pages/Project'; // Renamed to avoid conflict
import ProjectCreate from './pages/ProjectCreate';
import ProjectEdit from './pages/ProjectEdit';
import Register from './pages/Register';
import Recover from './pages/Recover';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Upload from './pages/Upload';
import axios from 'axios';

interface Project {
  _id: string;
  name: string;
  description: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
}

const AppRoutes: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${user.username}`);
        setProjects(response.data.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [user]);

  return (
    <Router>
      <Header />
      <Routes>
        <Route
          path="/login"
          element={<Login setUser={setUser} />}
        />
        <Route
          path="/register"
          element={<Register />}
        />
        <Route
          path="/recover"
          element={<Recover />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />
        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />
        <Route
          path="/"
          element={
            user ? (
              <Home user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            user ? (
              <Profile user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile/edit"
          element={
            user ? (
              <ProjectEdit />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/projects"
          element={
            user ? (
              <Projects user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/project/create"
          element={
            user ? (
              <ProjectCreate user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/project/:id"
          element={
            user ? (
              <ProjectPage user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/project/:id/edit"
          element={
            user ? (
              <ProjectEdit />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/notifications"
          element={
            user ? (
              <Notifications user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/leaderboard"
          element={
            user ? (
              <Leaderboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/upload"
          element={
            user ? (
              <Upload user={user} projects={projects} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/logout"
          element={
            user ? (
              <Logout setUser={setUser} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

interface LogoutProps {
  setUser: (user: { _id: string; username: string; email: string } | null) => void;
}

const Logout: React.FC<LogoutProps> = ({ setUser }) => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Logout</h1>
      <button
        onClick={() => {
          localStorage.removeItem('user');
          setUser(null);
          navigate('/login');
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default AppRoutes;