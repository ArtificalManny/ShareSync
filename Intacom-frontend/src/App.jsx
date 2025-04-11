import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
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

  const handleLogout = () => {
    console.log('App.jsx: Logging out');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  // From "The Effortless Experience" and "Delivering Happiness":
  // - Make navigation effortless by providing clear, predictable paths.
  // - Enhance user delight with subtle animations (dopamine hit).
  const handleNavigation = (path) => {
    console.log(`App.jsx: Navigating to ${path}`);
    navigate(path);
    // Simulate a dopamine hit with a subtle notification or animation (from "Hooked").
    alert(`Navigating to ${path} - Great choice!`); // Placeholder for a more engaging UI effect.
  };

  return (
    <div className="App">
      <nav className="navbar fixed-top" style={{ backgroundColor: '#1a2a44', padding: '10px 20px' }}>
        <div className="navbar-brand" style={{ color: '#00c4b4', fontSize: '24px', fontWeight: 'bold' }}>
          INTACOM
        </div>
        <div className="navbar-links" style={{ display: 'flex', gap: '15px' }}>
          {/* From "Refactoring UI": Use clear, contrasting colors for links to make them stand out. */}
          <Link
            to="/"
            onClick={() => handleNavigation('/')}
            style={{
              color: location.pathname === '/' ? '#00c4b4' : '#fff',
              textDecoration: 'none',
              fontSize: '16px',
              transition: 'color 0.3s ease',
            }}
          >
            Home
          </Link>
          <Link
            to="/profile"
            onClick={() => handleNavigation('/profile')}
            style={{
              color: location.pathname === '/profile' ? '#00c4b4' : '#fff',
              textDecoration: 'none',
              fontSize: '16px',
              transition: 'color 0.3s ease',
            }}
          >
            Profile
          </Link>
          <Link
            to="/projects"
            onClick={() => handleNavigation('/projects')}
            style={{
              color: location.pathname === '/projects' ? '#00c4b4' : '#fff',
              textDecoration: 'none',
              fontSize: '16px',
              transition: 'color 0.3s ease',
            }}
          >
            Projects
          </Link>
          <Link
            to="/notifications"
            onClick={() => handleNavigation('/notifications')}
            style={{
              color: location.pathname === '/notifications' ? '#00c4b4' : '#fff',
              textDecoration: 'none',
              fontSize: '16px',
              transition: 'color 0.3s ease',
            }}
          >
            Notifications
          </Link>
          <Link
            to="/leaderboard"
            onClick={() => handleNavigation('/leaderboard')}
            style={{
              color: location.pathname === '/leaderboard' ? '#00c4b4' : '#fff',
              textDecoration: 'none',
              fontSize: '16px',
              transition: 'color 0.3s ease',
            }}
          >
            Leaderboard
          </Link>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#00c4b4',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              padding: '5px 10px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background-color 0.3s ease',
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#009a8a')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#00c4b4')}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="content" style={{ paddingTop: '60px' }}>
        <Routes>
          <Route path="/" element={<Home user={null} />} />
          <Route path="/projects" element={<Projects user={null} />} />
          <Route path="/project/:id" element={<Project user={null} />} />
          <Route path="/profile" element={<Profile user={null} />} />
          <Route path="/notifications" element={<Notifications user={null} />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/login" element={<Login setUser={() => {}} />} />
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