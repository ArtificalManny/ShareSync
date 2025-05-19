import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getUserData } from '../services/auth';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showProfilePicInput, setShowProfilePicInput] = useState(false);
  const [showBannerInput, setShowBannerInput] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUserData();
      setUser(userData);
      setLoading(false);
      if (userData) {
        const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
        setIsOwner(loggedInUser && userData.id === loggedInUser.id);
      }
    };
    fetchUser();
  }, []);

  const handleProfilePicChange = async () => {
    try {
      await axios.put('http://localhost:3000/api/users/profile-picture', { profilePicture: profilePicUrl });
      const updatedUser = await getUserData();
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setShowProfilePicInput(false);
    } catch (error) {
      console.error('Failed to update profile picture:', error);
    }
  };

  const handleBannerChange = async () => {
    try {
      await axios.put('http://localhost:3000/api/users/banner-picture', { bannerPicture: bannerUrl });
      const updatedUser = await getUserData();
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setShowBannerInput(false);
    } catch (error) {
      console.error('Failed to update banner picture:', error);
    }
  };

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  if (!user) {
    return <div className="text-white">Unable to load user data. Please log in again.</div>;
  }

  return (
    <div className="profile-container">
      <div
        className="banner"
        style={{ backgroundImage: `url(${user.bannerPicture || 'default-banner.jpg'})` }}
        onMouseEnter={() => isOwner && setShowBannerInput(true)}
        onMouseLeave={() => isOwner && setShowBannerInput(false)}
      >
        {showBannerInput && (
          <div className="banner-input">
            <input
              type="text"
              placeholder="Enter banner image URL"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
            />
            <button className="btn-primary" onClick={handleBannerChange}>Update Banner</button>
          </div>
        )}
      </div>
      <div className="profile-pic-container">
        <img
          src={user.profilePicture || 'default-profile-pic.jpg'}
          alt="Profile"
          className="profile-pic"
          onMouseEnter={() => isOwner && setShowProfilePicInput(true)}
          onMouseLeave={() => isOwner && setShowProfilePicInput(false)}
        />
        {showProfilePicInput && (
          <div className="profile-pic-input">
            <input
              type="text"
              placeholder="Enter profile picture URL"
              value={profilePicUrl}
              onChange={(e) => setProfilePicUrl(e.target.value)}
            />
            <button className="btn-primary" onClick={handleProfilePicChange}>Update Picture</button>
          </div>
        )}
      </div>
      <h1 className="text-white">{user.firstName || ''} {user.lastName || ''}</h1>
      <p className="text-gray">Email: {user.email || 'Not specified'}</p>
      <p className="text-gray">School: {user.school || 'Not specified'}</p>
      <p className="text-gray">Job: {user.job || 'Not specified'}</p>
    </div>
  );
};

export default Profile;