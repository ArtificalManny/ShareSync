import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import CreateProject from './components/CreateProject';
import Profile from './components/Profile';
import Projects from './components/Projects';
import { logout } from './services/auth.service';
// Import other components as needed

const Header = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#1a2b3c', color: 'white' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', padding: '5px 10px', border: '1px solid #00d1b2', borderRadius: '5px' }}>ShareSync</Link>
        <Link to="/home" style={{ color: 'white', textDecoration: 'none', padding: '5px 10px', border: '1px solid #00d1b2', borderRadius: '5px' }}>Home</Link>
        {!user && (
          <>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none', padding: '5px 10px', border: '1px solid #00d1b2', borderRadius: '5px' }}>Login</Link>
            <Link to="/register" style={{ color: 'white', textDecoration: 'none', padding: '5px 10px', border: '1px solid #00d1b2', borderRadius: '5px' }}>Register</Link>
          </>
        )}
        <Link to="/projects" style={{ color: 'white', textDecoration: 'none', padding: '5px 10px', border: '1px solid #00d1b2', borderRadius: '5px' }}>Projects</Link>
        <Link to="/profile" style={{ color: 'white', textDecoration: 'none', padding: '5px 10px', border: '1px solid #00d1b2', borderRadius: '5px' }}>Profile</Link>
        {user && (
          <button onClick={handleLogout} style={{ color: 'white', padding: '5px 10px', border: '1px solid #00d1b2', borderRadius: '5px', background: 'none', cursor: 'pointer' }}>
            Logout
          </button>
        )}
      </div>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/profile">
            <img
              src={user.profilePicture || 'https://via.placeholder.com/40'}
              alt="Profile"
              style={{ width: '40px', height: '40px', borderRadius: '50%' }}
            />
          </Link>
          <span>{user.firstName} {user.lastName}</span>
        </div>
      )}
    </nav>
  );
};

const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/projects" element={<Projects />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-project" element={<CreateProject />} />
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  );
};

export default App;