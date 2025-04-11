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

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  console.log('App.tsx: Current location:', location.pathname);
  console.log('App.tsx: Routes defined:', [
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
    console.log('App.tsx: Logging out');
    navigate('/login', { replace: true });
  };

  return (
    <div className="App">
      <nav className="navbar fixed-top">
        <div className="navbar-brand">INTACOM</div>
        <div className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/recover">Recover</Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="content">
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