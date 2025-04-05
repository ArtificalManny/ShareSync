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

interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthday: { month: string; day: string; year: string };
  points: number;
  profilePic?: string;
  followers?: string[];
  following?: string[];
}

interface Project {
  name: string;
  description: string;
  admin: string;
  color: string;
  sharedWith: { userId: string; role: string }[];
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProject, setNewProject] = useState<Project>({
    name: '',
    description: '',
    admin: '',
    color: '#000000',
    sharedWith: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/by-username/${parsedUser.username}`);
          const fetchedUser = response.data.data;
          setUser(fetchedUser);
          localStorage.setItem('user', JSON.stringify(fetchedUser));
        } catch (error) {
          console.error('Error fetching user in App:', error);
          localStorage.removeItem('user');
          setUser(null);
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleCreateProject = async () => {
    if (!user) {
      alert('Please log in to create a project');
      navigate('/login');
      return;
    }
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
      setNewProject({ name: '', description: '', admin: '', color: '#000000', sharedWith: [] });
      navigate(`/project/${response.data.data._id}`);
      // Provide a dopamine hit with a success notification
      alert('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="App">
      <nav className="navbar fixed-top">
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

      <div className="content">
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
              <input
                type="text"
                placeholder="Share with (email)"
                onChange={(e) => {
                  const email = e.target.value;
                  setNewProject({
                    ...newProject,
                    sharedWith: email ? [{ userId: email, role: 'viewer' }] : [],
                  });
                }}
              />
              <button onClick={handleCreateProject}>Create</button>
              <button onClick={() => setShowCreateProjectModal(false)}>Cancel</button>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/projects" element={<Projects user={user} />} />
          <Route path="/project/:id" element={<Project user={user} />} />
          <Route path="/profile" element={<Profile user={user} />} />
          <Route path="/notifications" element={<Notifications user={user} />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
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