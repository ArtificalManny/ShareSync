import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, updateNotificationPreferences } from '../utils/api';

const Settings = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
  });
  const [notificationPrefs, setNotificationPrefs] = useState(user?.notificationPreferences || []);
  const [projectVisibility, setProjectVisibility] = useState(user?.projectVisibility || 'public');
  const [error, setError] = useState(null);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      setUser({ ...user, ...profileForm });
      localStorage.setItem('user', JSON.stringify({ ...user, ...profileForm }));
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Update profile error:', err.message);
      setError('Failed to update profile. Please try again.');
    }
  };

  const handleNotificationPrefsSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateNotificationPreferences(notificationPrefs);
      setUser({ ...user, notificationPreferences: notificationPrefs });
      localStorage.setItem('user', JSON.stringify({ ...user, notificationPreferences: notificationPrefs }));
      alert('Notification preferences updated successfully!');
    } catch (err) {
      console.error('Update notification preferences error:', err.message);
      setError('Failed to update notification preferences. Please try again.');
    }
  };

  const handleProjectVisibilitySubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ projectVisibility });
      setUser({ ...user, projectVisibility });
      localStorage.setItem('user', JSON.stringify({ ...user, projectVisibility }));
      alert('Project visibility updated successfully!');
    } catch (err) {
      console.error('Update project visibility error:', err.message);
      setError('Failed to update project visibility. Please try again.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-display text-vibrant-pink mb-6 animate-fade-in">Settings</h2>
      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg mb-6 animate-shimmer">
          {error}
        </div>
      )}

      {/* Profile Settings */}
      <div className="card glassmorphic mb-8 animate-fade-in">
        <h3 className="text-xl font-display text-vibrant-pink mb-4">Profile Settings</h3>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2 font-medium">First Name</label>
            <input
              type="text"
              name="firstName"
              value={profileForm.firstName}
              onChange={handleProfileChange}
              className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label className="block text-white mb-2 font-medium">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={profileForm.lastName}
              onChange={handleProfileChange}
              className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
              placeholder="Enter your last name"
            />
          </div>
          <div>
            <label className="block text-white mb-2 font-medium">Username</label>
            <input
              type="text"
              name="username"
              value={profileForm.username}
              onChange={handleProfileChange}
              className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-white mb-2 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={profileForm.email}
              onChange={handleProfileChange}
              className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
              placeholder="Enter your email"
            />
          </div>
          <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform">
            Save Profile
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="card glassmorphic mb-8 animate-fade-in">
        <h3 className="text-xl font-display text-vibrant-pink mb-4">Notification Preferences</h3>
        <form onSubmit={handleNotificationPrefsSubmit} className="space-y-4">
          {['email', 'sms', 'push'].map(type => (
            <div key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={notificationPrefs.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setNotificationPrefs([...notificationPrefs, type]);
                  } else {
                    setNotificationPrefs(notificationPrefs.filter(pref => pref !== type));
                  }
                }}
                className="mr-2 h-5 w-5 text-vibrant-pink focus:ring-vibrant-pink rounded"
              />
              <label className="text-white">{type.charAt(0).toUpperCase() + type.slice(1)} Notifications</label>
            </div>
          ))}
          <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform">
            Save Notification Preferences
          </button>
        </form>
      </div>

      {/* Project Visibility */}
      <div className="card glassmorphic mb-8 animate-fade-in">
        <h3 className="text-xl font-display text-vibrant-pink mb-4">Project Visibility</h3>
        <form onSubmit={handleProjectVisibilitySubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2 font-medium">Project Visibility</label>
            <select
              value={projectVisibility}
              onChange={(e) => setProjectVisibility(e.target.value)}
              className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="team">Team Only</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform">
            Save Project Visibility
          </button>
        </form>
      </div>

      {/* Back to Profile */}
      <div className="text-center">
        <button
          onClick={() => navigate('/profile')}
          className="btn-secondary neumorphic hover:scale-105 transition-transform"
        >
          Back to Profile
        </button>
      </div>
    </div>
  );
};

export default Settings;