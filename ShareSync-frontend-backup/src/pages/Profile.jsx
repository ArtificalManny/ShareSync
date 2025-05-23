import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserData, logout } from '../services/auth';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        console.log('Profile - Access token:', accessToken);
        if (!accessToken) {
          throw new Error('No access token found');
        }
        const userData = await getUserData();
        console.log('Profile - Fetched user data:', userData);
        setUser(userData);
      } catch (err) {
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
          <h1>{user.firstName || ''} {user.lastName || ''}</h1>
          <p className="text-secondary">Email: {user.email || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;