import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

// Design principles from "Don't Make Me Think" and "Designing Interfaces":
// - Navigation should be intuitive, with clear labels and immediate feedback.
// - Use visual hierarchy (from "Thinking with Type" and "The Graphic Design Bible") to make navigation elements stand out.
// - Apply "Hooked" and Freud's Id/Ego/Superego: Provide a dopamine hit by making navigation rewarding (e.g., subtle animations or notifications).
function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  console.log('App.jsx: Current location:', location.pathname);
  console.log('App.jsx: Routes defined:', [
    '/',
    '/projects',
    '/project/:id',
    '/profile',
    '/notifications',
    '/leaderboard',
    '/login',
    '/register',
    '/verify-email',
    '/reset-password',
    '/recover',
  ]);

  // Check if user is logged in on mount.
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // From "The Effortless Experience": Ensure a seamless experience by redirecting logged-out users to login.
      if (!['/login', '/register', '/recover', '/reset-password', '/verify-email'].includes(location.pathname)) {
        console.log('App.jsx: User not logged in, redirecting to /login');
        navigate('/login', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    console.log('App.jsx: Logging out');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
  };

  // From "The Effortless Experience" and "Delivering Happiness":
  // - Make navigation effortless by providing clear, predictable paths.
  // - Enhance user delight with subtle animations (dopamine hit).
  const handleNavigation = (path) => {
    console.log(`App.jsx: Navigating to ${path}`);
    if (!user && !['/login', '/register', '/recover', '/reset-password', '/verify-email'].includes(path)) {
      console.log('App.jsx: User not logged in, redirecting to /login');
      navigate('/login', { replace: true });
      return;
    }
    navigate(path);
    // Simulate a dopamine hit with a subtle notification or animation (from "Hooked").
    alert(`Navigating to ${path} - Great choice!`); // Placeholder for a more engaging UI effect.
  };

  return (
    <div className="App">
      <nav className="navbar fixed-top">
        <div className="navbar-links">
          <Link
            to="/"
            onClick={() => handleNavigation('/')}
            className={location.pathname === '/' ? 'active-link' : ''}
          >
            Home
          </Link>
          <Link
            to="/profile"
            onClick={() => handleNavigation('/profile')}
            className={location.pathname === '/profile' ? 'active-link' : ''}
          >
            Profile
          </Link>
          <Link
            to="/projects"
            onClick={() => handleNavigation('/projects')}
            className={location.pathname === '/projects' ? 'active-link' : ''}
          >
            Projects
          </Link>
          <Link
            to="/notifications"
            onClick={() => handleNavigation('/notifications')}
            className={location.pathname === '/notifications' ? 'active-link' : ''}
          >
            Notifications
          </Link>
          <Link
            to="/leaderboard"
            onClick={() => handleNavigation('/leaderboard')}
            className={location.pathname === '/leaderboard' ? 'active-link' : ''}
          >
            Leaderboard
          </Link>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
        {/* Move INTACOM logo to the top right. */}
        <div className="navbar-brand">
          INTACOM
        </div>
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
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  console.log('AppWrapper: Rendering Router');
  return (
    <Router>
      <App />
    </Router>
  );
}