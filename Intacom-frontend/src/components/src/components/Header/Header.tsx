import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; //Optional: Component specific styles

const Header: React.FC = () => {
  return (
    <header className="user-bar">
      {/* Left Section: Logo */}
      <div className="left-section">
        <Link to="/" className="logo">
          <img src="/logo.png" alt="Intacom Logo" className="logo-img" />
          <span>Intacom</span>
        </Link>
      </div>

      {/*Middle Section: Search */}
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

      {/*Right Section: Icon and Profile */}
      <div className="right-section">
        {/*Notification Bell */}
        <div className="notification-bell">
          <i className="icon fas fa-bell"></i>
          <div className="notification-dropdown">
            <p>No new notification</p>
            {/*Populate with dynamic notifications */}
          </div>
        </div>

        {/*Setting Icon*/}
        <div className="settings-icon">
          <a href="/settings">
            <i className="icon fas fa-cog"></i>
          </a>
        </div>

        {/*Profile Picture */}
        <div className="profile-pic">
          <img src="/profile.jpg" alt="Profile" className="profile-img" />
        </div>
      </div>
    </header>
  );
};

export default Header;
