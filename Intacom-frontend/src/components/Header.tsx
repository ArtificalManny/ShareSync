// src/components/Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

interface HeaderProps {
  toggleDarkMode?: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleDarkMode }) => {
  return (
    <header className="user-bar">
      {/* Left Section: Logo */}
      <div className="left-section">
        <Link to="/" className="logo">
          <img src="/logo.png" alt="Intacom Logo" className="logo-img" />
          <span>Intacom</span>
        </Link>
      </div>

      {/* Middle Section: Search */}
      <div className="middle-section">
        <div className="search-container">
          <input type="text" placeholder="Search..." />
          <select>
            <option value="projects">Projects</option>
            <option value="teams">Teams</option>
            <option value="documents">Documents</option>
          </select>
          <button type="button">Search</button>
        </div>
      </div>

      {/* Right Section: Icons and Profile */}
      <div className="right-section">
        {/* Notification Bell */}
        <div className="notification-bell">
          <i className="icon fas fa-bell"></i>
          <div className="notification-dropdown">
            <p>No new notifications</p>
            {/* Populate with dynamic notifications */}
          </div>
        </div>

        {/* Settings Icon */}
        <div className="settings-icon">
          <a href="/settings">
            <i className="icon fas fa-cog"></i>
          </a>
        </div>

        {/* Dark Mode Toggle */}
        <IconButton onClick={toggleDarkMode} color="inherit">
          <Brightness4Icon />
        </IconButton>

        {/* Profile Picture */}
        <div className="profile-pic">
          <img src="/profile.jpg" alt="Profile" className="profile-img" />
        </div>
      </div>
    </header>
  );
};

export default Header;
