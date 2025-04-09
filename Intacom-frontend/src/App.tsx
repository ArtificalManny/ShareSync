import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
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
import Recover from './pages/Recover';
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
  const [loadingUser, setLoadingUser] = useState(true);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [newProject, setNewProject] = useState<Project>({
    name: '',
    description: '',
    admin: '',
    color: '#00C4B4',
    sharedWith: [],
  });
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('Current location:', location.pathname);
    const fetchUser = async () => {
      setLoadingUser(true);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        try {
          console.log('Fetching user with username:', parsedUser.username);
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/by-username/${parsedUser.username}`);
          console.log('User fetch response:', response.data);
          const fetchedUser = response.data.data;
          setUser(fetchedUser);
          localStorage.setItem('user', JSON.stringify(fetchedUser));
        } catch (error: any) {
          console.error('Error fetching user in App:', error.response?.data || error.message);
          localStorage.removeItem('user');
          setUser(null);
          // Only redirect to /login if not already on an auth-related page
          if (!['/login', '/register', '/recover', '/reset-password', '/verify-email'].includes(location.pathname)) {
            console.log('Redirecting to /login from:', location.pathname);
            navigate('/login', { replace: true });
          }
        }
      } else {
        setUser(null);
        // Only redirect to /login if not already on an auth-related page
        if (!['/login', '/register', '/recover', '/reset-password', '/verify-email'].includes(location.pathname)) {
          console.log('Redirecting to /login from:', location.pathname);
          navigate('/login', { replace: true });
        }
      }
      setLoadingUser(false);
    };
    fetchUser();
  }, [navigate, location.pathname]);

  const handleCreateProject = async () => {
    if (!user) {
      setLoginPrompt(true);
      return;
    }
    try {
      setCreateProjectError(null);
      setLoginPrompt(false);
      console.log('Creating project with data:', { ...newProject, admin: user._id });
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects`, {
        name: newProject.name,
        description: newProject.description,
        admin: user._id,
        color: newProject.color,
        sharedWith: newProject.sharedWith,
      });
      console.log('Project creation response:', response.data);
      setShowCreateProjectModal(false);
      setNewProject({ name: '', description: '', admin: '', color: '#00C4B4', sharedWith: [] });
      navigate(`/project/${response.data.data._id}`);
      alert('Project created successfully!');
    } catch (error: any) {
      console.error('Error creating project:', error.response?.data || error.message);
      if (error.response?.status === 400) {
        setCreateProjectError('Invalid project data. Please check your inputs.');
      } else if (error.response?.status === 500) {
        setCreateProjectError('Server error. Please try again later.');
      } else {
        setCreateProjectError('Failed to create project. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    console.log('Logging out user:', user?.email);
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
  };

  if (loadingUser) {
    return <div>Loading user data...</div>;
  }

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
              className="profile-pic"
            />
          </div>
        )}
      </nav>

      <div className="content">
        {showCreateProjectModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Create a New Project</h2>
              {loginPrompt && (
                <p className="error" style={{ color: '#FF4444' }}>
                  Please log in to create a project. <Link to="/login" onClick={() => setShowCreateProjectModal(false)}>Login</Link>
                </p>
              )}
              {createProjectError && (
                <p className="error" style={{ color: '#FF4444' }}>{createProjectError}</p>
              )}
              {!loginPrompt && (
                <>
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
                </>
              )}
              <button onClick={() => { setShowCreateProjectModal(false); setLoginPrompt(false); }}>Cancel</button>
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
          <Route path="/recover" element={<Recover />} />
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