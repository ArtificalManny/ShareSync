import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getUserData, logout } from '../services/auth';
import { User, Mail, Folder } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        console.log('Profile - Access token before fetch:', accessToken);
        const userData = await getUserData();
        console.log('Profile - Fetched user data:', userData);
        setUser(userData);

        const response = await axios.get('http://localhost:3000/api/projects', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('Profile - Fetched projects:', response.data);
        setProjects(response.data || []);
      } catch (err) {
        console.error('Profile - Error fetching data:', err.message);
        setError('Failed to load profile: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const inProgressProjects = projects.filter(p => p.status === 'In Progress').length;
  const completedPercentage = totalProjects ? (completedProjects / totalProjects) * 100 : 0;
  const inProgressPercentage = totalProjects ? (inProgressProjects / totalProjects) * 100 : 0;

  if (loading) {
    return <div className="profile-container"><p className="text-secondary">Loading...</p></div>;
  }

  if (error) {
    return (
      <div className="profile-container">
        <p className="text-error">{error}</p>
        {(error.includes('No access token found') || error.includes('Invalid token') || error.includes('Session expired')) && (
          <div>
            <p className="text-secondary">Please log in to access your profile.</p>
            <button onClick={handleLogout} className="btn-primary">Log In</button>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return <div className="profile-container"><p className="text-secondary">No user data available.</p></div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header gradient-bg">
        <img
          src={user.banner || 'https://via.placeholder.com/800x200'}
          alt="Banner"
          className="banner-image"
        />
        <div className="profile-pic-container">
          <img
            src={user.profilePicture || 'https://via.placeholder.com/150'}
            alt="Profile"
            className="profile-pic"
          />
        </div>
      </div>
      <div className="profile-content card">
        <div className="profile-info">
          <h1>
            <User className="icon" /> {user.firstName || ''} {user.lastName || ''}
          </h1>
          <p className="text-secondary">
            <Mail className="icon" /> Email: {user.email || 'N/A'}
          </p>
        </div>
        <div className="project-stats">
          <h2>Project Statistics</h2>
          <div className="stats-infographic">
            <div className="stat-bar">
              <span>Completed Projects: {completedProjects}</span>
              <div className="progress-bar">
                <div
                  className="progress-fill gradient-bg"
                  style={{ width: `${completedPercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="stat-bar">
              <span>In Progress Projects: {inProgressProjects}</span>
              <div className="progress-bar">
                <div
                  className="progress-fill gradient-bg"
                  style={{ width: `${inProgressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="projects-section">
        <h2><Folder className="icon" /> My Projects</h2>
        {projects.length === 0 ? (
          <p className="text-secondary">No projects available.</p>
        ) : (
          <div className="projects-list">
            {projects.map(project => (
              <div key={project.id || Math.random()} className="project-card card">
                <h4>{project.title || 'Untitled'}</h4>
                <p className="text-secondary">{project.description || 'No description'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;