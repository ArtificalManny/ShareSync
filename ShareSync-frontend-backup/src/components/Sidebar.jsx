import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      setUser(null);
    }

    const handleStorageChange = () => {
      try {
        const updatedUser = localStorage.getItem('user');
        setUser(updatedUser ? JSON.parse(updatedUser) : null);
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="sidebar">
      <Link to="/" className="sidebar-link">
        <svg className="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM1.5 12C1.5 6.201 6.201 1.5 12 1.5S22.5 6.201 22.5 12 17.799 22.5 12 22.5 1.5 17.799 1.5 12zM12 6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1zm0 10a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
        </svg>
        <span>Home</span>
      </Link>
      <Link to="/projects" className="sidebar-link">
        <svg className="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2z" />
        </svg>
        <span>Projects</span>
      </Link>
      {user && (
        <div className="sidebar-profile-pic">
          <img
            src={user.profilePicture || 'default-profile-pic.jpg'}
            alt="Profile"
            className="sidebar-pic"
          />
        </div>
      )}
      <Link to="/messages" className="sidebar-link">
        <svg className="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14h-1v6l5.2 3.2.8-1.3-4-2.4V6z" />
        </svg>
        <span>Messages</span>
      </Link>
    </div>
  );
};

export default Sidebar;