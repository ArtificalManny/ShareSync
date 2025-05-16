import React, { useState, useEffect } from 'react';
import { updateProfile, updateNotificationPreferences } from '../utils/api';

const Profile = ({ user, setUser }) => {
  const [profile, setProfile] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    profilePicture: user?.profilePicture || '',
    banner: user?.banner || '',
  });
  const [notificationPrefs, setNotificationPrefs] = useState(user?.notificationPreferences || { email: true, sms: false, push: true });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        profilePicture: user.profilePicture || '',
        banner: user.banner || '',
      });
      setNotificationPrefs(user.notificationPreferences || { email: true, sms: false, push: true });
    }
  }, [user]);

  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === 'profilePicture') {
      setProfilePicFile(file);
      setProfile({ ...profile, profilePicture: URL.createObjectURL(file) }); // Preview
    } else if (type === 'banner') {
      setBannerFile(file);
      setProfile({ ...profile, banner: URL.createObjectURL(file) }); // Preview
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('username', profile.username);
      formData.append('email', profile.email);
      formData.append('bio', profile.bio);
      if (profilePicFile) {
        formData.append('profilePicture', profilePicFile);
      }
      if (bannerFile) {
        formData.append('banner', bannerFile);
      }

      const updatedUser = await updateProfile(formData);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSuccess('Profile updated successfully!');
      setError(null);
      setProfilePicFile(null);
      setBannerFile(null);
    } catch (err) {
      console.error('Profile update error:', err.message);
      setError('Failed to update profile. Please try again.');
      setSuccess(null);
    }
  };

  const handleUpdateNotificationPrefs = async () => {
    try {
      await updateNotificationPreferences(notificationPrefs);
      setUser({ ...user, notificationPreferences: notificationPrefs });
      localStorage.setItem('user', JSON.stringify({ ...user, notificationPreferences: notificationPrefs }));
      setSuccess('Notification preferences updated successfully!');
      setError(null);
    } catch (err) {
      console.error('Update notification preferences error:', err.message);
      setError('Failed to update notification preferences. Please try again.');
      setSuccess(null);
    }
  };

  if (!user) {
    return <div className="text-white text-center mt-10">User not authenticated. Please log in.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-display text-vibrant-pink mb-6 animate-fade-in">Your Profile</h2>
      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg mb-6 animate-shimmer">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500 text-white p-3 rounded-lg mb-6 animate-shimmer">
          {success}
        </div>
      )}

      <div className="card glassmorphic mb-8 animate-fade-in relative">
        <div className="relative">
          <img
            src={profile.banner || 'https://via.placeholder.com/1200x300?text=Banner'}
            alt="Banner"
            className="w-full h-48 object-cover rounded-t-lg"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/1200x300?text=Banner')}
          />
          <label className="absolute top-4 right-4 bg-dark-navy text-white p-2 rounded-lg cursor-pointer hover:bg-vibrant-pink transition-all">
            Change Banner
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'banner')}
              className="hidden"
            />
          </label>
        </div>
        <div className="relative -mt-16 ml-6">
          <img
            src={profile.profilePicture || 'https://via.placeholder.com/120?text=Profile'}
            alt="Profile Picture"
            className="w-32 h-32 rounded-full border-4 border-dark-navy object-cover"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/120?text=Profile')}
          />
          <label className="absolute bottom-0 right-0 bg-dark-navy text-white p-2 rounded-full cursor-pointer hover:bg-vibrant-pink transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'profilePicture')}
              className="hidden"
            />
          </label>
        </div>
        <div className="mt-6 p-6">
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-white mb-2 font-medium">Username</label>
              <input
                type="text"
                name="username"
                value={profile.username}
                onChange={handleInputChange}
                required
                className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
              />
            </div>
            <div>
              <label className="block text-white mb-2 font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleInputChange}
                required
                className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
              />
            </div>
            <div>
              <label className="block text-white mb-2 font-medium">Bio</label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleInputChange}
                className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all h-32"
              />
            </div>
            <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow">
              Update Profile
            </button>
          </form>
        </div>
      </div>

      <div className="card glassmorphic animate-fade-in">
        <h3 className="text-xl font-display text-vibrant-pink mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={notificationPrefs.email}
              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email: e.target.checked })}
              className="mr-2"
            />
            <label className="text-white">Email Notifications</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={notificationPrefs.sms}
              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, sms: e.target.checked })}
              className="mr-2"
            />
            <label className="text-white">SMS Notifications</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={notificationPrefs.push}
              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, push: e.target.checked })}
              className="mr-2"
            />
            <label className="text-white">Push Notifications</label>
          </div>
          <button onClick={handleUpdateNotificationPrefs} className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow">
            Save Notification Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;