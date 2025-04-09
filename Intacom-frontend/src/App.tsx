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

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
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
          if (!['/login', '/register', '/recover', '/reset-password', '/verify-email'].includes(location.pathname)) {
            console.log('Redirecting to /login from:', location.pathname);
            navigate('/login', { replace: true });
          }
        }
      } else {
        setUser(null);
        if (!['/login', '/register', '/recover', '/reset-password', '/verify-email'].includes(location.pathname)) {
          console.log('Redirecting to /login from:', location.pathname);
          navigate('/login', { replace: true });
        }
      }
      setLoadingUser(false);
    };
    fetchUser();
  }, [navigate]); // Only depend on navigate to avoid redirect loops

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