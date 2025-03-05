// src/components/Sidebar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css'; // Optional: Component-specific styles

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      {/* Search Bar */}
      <div className="search-bar">
        <input type="text" placeholder="Search..." />
      </div>

      {/* Quick Links */}
      <nav className="quick-links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/my-projects">My Projects</Link>
          </li>
          <li>
            <Link to="/create-project">Create New Project</Link>
          </li>
          <li>
            <Link to="/global-feed">Global Feed</Link>
          </li>
          <li>
            <Link to="/calendar">Calendar</Link>
          </li>
          <li>
            <Link to="/tasks">Tasks</Link>
          </li>
        </ul>
      </nav>

      {/* Teams List */}
      <div className="teams-list">
        <h3>Teams</h3>
        <ul>
          <li>
            <Link to="/teams/team1">Team 1</Link>
          </li>
          <li>
            <Link to="/teams/team2">Team 2</Link>
          </li>
          {/* Dynamically populate teams */}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
