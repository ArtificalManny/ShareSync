import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Project from './pages/Project';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', color: '#000000', sharedWith: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/by-username/ArtificalManny`);
        setUser(response.data.data);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const handleCreateProject = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects`, {
        name: newProject.name,
        description: newProject.description,
        admin: user._id,
        color: newProject.color,
        sharedWith: newProject.sharedWith,
      });
      console.log('Project created:', response.data);
      setShowCreateProjectModal(false);
      setNewProject({ name: '', description: '', color: '#000000', sharedWith: [] });
      navigate(`/project/${response.data.data._id}`);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-brand">INTACOM</div>
        <div className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/profile">Profile</Link>
          <button onClick={() => setShowCreateProjectModal(true)}>Create Project</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
        {user && (
          <div className="profile-circle">
            <img
              src={user.profilePic || 'https://via.placeholder.com/40'}
              alt="Profile"
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
        )}
      </nav>

      {showCreateProjectModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create a New Project</h2>
            <input
              type="text"
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
            <input
              type="color"
              value={newProject.color}
              onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
            />
            <button onClick={handleCreateProject}>Create</button>
            <button onClick={() => setShowCreateProjectModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/project/:id" element={<Project />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}