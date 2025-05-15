import React, { useState } from 'react';
import { updateProfile, updateNotificationPreferences } from '../utils/api';

const Settings = ({ user, setUser }) => {
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || 'Manny',
    lastName: user?.lastName || 'Rivas',
    username: user?.username || '',
    email: user?.email || '',
    profilePicture: user?.profilePicture || '',
    bannerPicture: user?.bannerPicture || '',
    school: user?.school || '',
    job: user?.job || '',
  });
  const [notificationPrefs, setNotificationPrefs] = useState(user?.notificationPreferences || []);
  const [accountForm, setAccountForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profilePicturePreview, setProfilePicturePreview] = useState(user?.profilePicture || '');
  const [bannerPicturePreview, setBannerPicturePreview] = useState(user?.bannerPicture || '');

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfilePictureChange = (e) => {
    const url = e.target.value;
    setProfileForm({ ...profileForm, profilePicture: url });
    setProfilePicturePreview(url);
  };

  const handleBannerPictureChange = (e) => {
    const url = e.target.value;
    setProfileForm({ ...profileForm, bannerPicture: url });
    setBannerPicturePreview(url);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      setUser({ ...user, ...profileForm });
    } catch (err) {
      console.error('Update profile error:', err.message);
      // Fallback: Update local state if API fails
      setUser({ ...user, ...profileForm });
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateNotificationPreferences(notificationPrefs);
      setUser({ ...user, notificationPreferences: notificationPrefs });
    } catch (err) {
      console.error('Update notification preferences error:', err.message);
      // Fallback: Update local state if API fails
      setUser({ ...user, notificationPreferences: notificationPrefs });
    }
  };

  const handleAccountChange = (e) => {
    setAccountForm({ ...accountForm, [e.target.name]: e.target.value });
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (accountForm.newPassword !== accountForm.confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }
    try {
      // Simulate password update (requires backend integration)
      console.log('Password update simulated:', accountForm);
      setAccountForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Update account error:', err.message);
    }
  };

  const toggleNotificationPref = (pref) => {
    setNotificationPrefs(
      notificationPrefs.includes(pref)
        ? notificationPrefs.filter(p => p !== pref)
        : [...notificationPrefs, pref]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-display text-vibrant-pink mb-6 animate-fade-in">Settings</h1>

      {/* Profile Settings */}
      <div className="card glassmorphic mb-6 animate-fade-in">
        <div className="settings-section">
          <h3 className="text-xl font-display">Profile Settings</h3>
          <div className="relative mb-6">
            <img
              src={bannerPicturePreview || 'https://via.placeholder.com/1200x300'}
              alt="Banner Preview"
              className="w-full h-48 object-cover rounded-t-lg animate-pulse-glow"
            />
            <img
              src={profilePicturePreview || 'https://via.placeholder.com/150'}
              alt="Profile Preview"
              className="absolute bottom-0 left-4 transform translate-y-1/2 w-32 h-32 rounded-full border-4 border-dark-navy animate-pulse-glow"
            />
          </div>
          <form onSubmit={handleProfileSubmit} className="pt-16">
            <div className="mb-4">
              <label className="block text-white mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={profileForm.firstName}
                onChange={handleProfileChange}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-white mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={profileForm.lastName}
                onChange={handleProfileChange}
                placeholder="Enter your last name"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-white mb-2">Profile Picture URL</label>
              <input
                type="text"
                name="profilePicture"
                value={profileForm.profilePicture}
                onChange={handleProfilePictureChange}
                placeholder="Enter profile picture URL"
              />
            </div>
            <div className="mb-4">
              <label className="block text-white mb-2">Banner Picture URL</label>
              <input
                type="text"
                name="bannerPicture"
                value={profileForm.bannerPicture}
                onChange={handleBannerPictureChange}
                placeholder="Enter banner picture URL"
              />
            </div>
            <div className="mb-4">
              <label className="block text-white mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={profileForm.username}
                onChange={handleProfileChange}
                placeholder="Enter your username"
              />
            </div>
            <div className="mb-4">
              <label className="block text-white mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                placeholder="Enter your email"
              />
            </div>
            <div className="mb-4">
              <label className="block text-white mb-2">School</label>
              <input
                type="text"
                name="school"
                value={profileForm.school}
                onChange={handleProfileChange}
                placeholder="Enter your school"
              />
            </div>
            <div className="mb-4">
              <label className="block text-white mb-2">Job</label>
              <input
                type="text"
                name="job"
                value={profileForm.job}
                onChange={handleProfileChange}
                placeholder="Enter your job"
              />
            </div>
            <button type="submit" className="btn-primary w-full neumorphic">
              Save Profile Changes
            </button>
          </form>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card glassmorphic mb-6 animate-fade-in">
        <div className="settings-section">
          <h3 className="text-xl font-display">Notification Preferences</h3>
          <form onSubmit={handleNotificationSubmit}>
            <div className="mb-4">
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={notificationPrefs.includes('email_task_completion')}
                  onChange={() => toggleNotificationPref('email_task_completion')}
                  className="mr-2"
                />
                Email on Task Completion
              </label>
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={notificationPrefs.includes('email_new_post')}
                  onChange={() => toggleNotificationPref('email_new_post')}
                  className="mr-2"
                />
                Email on New Post
              </label>
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={notificationPrefs.includes('email_file_request')}
                  onChange={() => toggleNotificationPref('email_file_request')}
                  className="mr-2"
                />
                Email on File Request (Admins Only)
              </label>
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={notificationPrefs.includes('email_share_request')}
                  onChange={() => toggleNotificationPref('email_share_request')}
                  className="mr-2"
                />
                Email on Share Request (Admins Only)
              </label>
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={notificationPrefs.includes('email_team_update')}
                  onChange={() => toggleNotificationPref('email_team_update')}
                  className="mr-2"
                />
                Email on Team Updates
              </label>
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={notificationPrefs.includes('email_activity_log')}
                  onChange={() => toggleNotificationPref('email_activity_log')}
                  className="mr-2"
                />
                Email on Activity Log Updates
              </label>
            </div>
            <button type="submit" className="btn-primary w-full neumorphic">
              Save Notification Preferences
            </button>
          </form>
        </div>
      </div>

      {/* Account Settings */}
      <div className="card glassmorphic animate-fade-in">
        <div className="settings-section">
          <h3 className="text-xl font-display">Account Settings</h3>
          <form onSubmit={handleAccountSubmit}>
            <div className="mb-4">
              <label className="block text-white mb-2">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={accountForm.currentPassword}
                onChange={handleAccountChange}
                placeholder="Enter current password"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-white mb-2">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={accountForm.newPassword}
                onChange={handleAccountChange}
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-white mb-2">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={accountForm.confirmPassword}
                onChange={handleAccountChange}
                placeholder="Confirm new password"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full neumorphic">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;