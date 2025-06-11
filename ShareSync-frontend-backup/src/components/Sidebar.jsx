import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      setUser(null);
    }
    const handleStorageChange = () => {
      try {
        const updatedUser = localStorage.getItem('user');
        setUser(updatedUser ? JSON.parse(updatedUser) : null);
      } catch (error) {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="sidebar gradient-bg">
      <div className="sidebar-profile">
        {user && (
          <>
            <Link to="/profile">
              <img
                src={user.profilePicture || 'https://via.placeholder.com/80'}
                alt="Profile"
                className="sidebar-profile-pic"
              />
            </Link>
            <div className="sidebar-profile-name">
              {user.firstName} {user.lastName}
            </div>
          </>
        )}
      </div>
      <nav className="sidebar-nav">
        <Link to="/home" className={`sidebar-link ${location.pathname === '/home' ? 'active' : ''}`}>
          <span>Home</span>
        </Link>
        <Link to="/projects" className={`sidebar-link ${location.pathname.startsWith('/projects') ? 'active' : ''}`}>
          <span>Projects</span>
        </Link>
        <Link to="/settings" className={`sidebar-link ${location.pathname === '/settings' ? 'active' : ''}`}>
          <span>Settings</span>
        </Link>
        <Link to="/profile" className={`sidebar-link ${location.pathname === '/profile' ? 'active' : ''}`}>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;