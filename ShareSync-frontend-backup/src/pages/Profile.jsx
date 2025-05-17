import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { updateProfile } from '../utils/api';

const ProfileEngagementInfographic = () => {
  const [showGrokModal, setShowGrokModal] = useState(false);
  const [grokQuery, setGrokQuery] = useState('');
  const [grokResponse, setGrokResponse] = useState('');
  const [grokError, setGrokError] = useState('');

  const handleGrokQuery = async (e) => {
    e.preventDefault();
    try {
      setGrokError('');
      setGrokResponse('');
      const response = await mockGrokApi(grokQuery);
      setGrokResponse(response);
    } catch (err) {
      setGrokError('Failed to get a response from Grok. Please try again.');
      console.error('Grok API error:', err.message);
    }
  };

  const mockGrokApi = async (query) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Mock response from Grok: I analyzed the query "${query}". Here's a summary...`);
      }, 1000);
    });
  };

  const profileViews = 150;
  const postsMade = 20;

  return (
    <div className="card glassmorphic animate-fade-in mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-display text-vibrant-pink">Profile Engagement</h2>
        <button
          onClick={() => setShowGrokModal(true)}
          className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow"
        >
          Ask Grok
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform animate-pulse-glow flex flex-col items-center">
          <h3 className="text-lg text-white mb-2">Profile Views</h3>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="fill-none stroke-gray-800 stroke-2"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="fill-none stroke-neon-blue stroke-2"
                strokeDasharray={`${(profileViews / 200) * 100}, 100`} // Assuming 200 as max
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20" className="text-vibrant-pink text-sm font-bold" textAnchor="middle">{profileViews}</text>
            </svg>
          </div>
        </div>
        <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform animate-pulse-glow flex flex-col items-center">
          <h3 className="text-lg text-white mb-2">Posts Made</h3>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="fill-none stroke-gray-800 stroke-2"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="fill-none stroke-vibrant-pink stroke-2"
                strokeDasharray={`${(postsMade / 50) * 100}, 100`} // Assuming 50 as max
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20" className="text-vibrant-pink text-sm font-bold" textAnchor="middle">{postsMade}</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Grok Modal */}
      {showGrokModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowGrokModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="modal glassmorphic p-6">
              <h2 className="text-2xl font-display text-vibrant-pink mb-4">Ask Grok</h2>
              <p className="text-white text-sm mb-4">
                Powered by <a href="https://x.ai" target="_blank" rel="noopener noreferrer" className="text-vibrant-pink hover:text-neon-blue">xAI</a>.
              </p>
              <form onSubmit={handleGrokQuery} className="space-y-4">
                <textarea
                  value={grokQuery}
                  onChange={(e) => setGrokQuery(e.target.value)}
                  placeholder="Ask Grok (e.g., 'Analyze my profile engagement')"
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all h-32"
                />
                <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow">
                  Send to Grok
                </button>
              </form>
              {grokResponse && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <h3 className="text-lg text-vibrant-pink mb-2">Grok's Response</h3>
                  <p className="text-white">{grokResponse}</p>
                </div>
              )}
              {grokError && (
                <div className="mt-4 p-4 bg-red-500 rounded-lg">
                  <p className="text-white">{grokError}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || 'Manny',
    lastName: user?.lastName || '',
    email: user?.email || '',
    profilePicture: user?.profilePicture || '',
    banner: user?.banner || '',
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    if (!user) {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        if (typeof setUser === 'function') {
          setUser(storedUser);
          setProfileData({
            firstName: storedUser.firstName || 'Manny',
            lastName: storedUser.lastName || '',
            email: storedUser.email || '',
            profilePicture: storedUser.profilePicture || '',
            banner: storedUser.banner || '',
          });
        } else {
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    }
  }, [user, setUser, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    setProfilePictureFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profilePicture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    setBannerFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, banner: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('firstName', profileData.firstName);
      formData.append('lastName', profileData.lastName);
      formData.append('email', profileData.email);
      if (profilePictureFile) {
        formData.append('profilePicture', profilePictureFile);
      }
      if (bannerFile) {
        formData.append('banner', bannerFile);
      }

      const updatedUser = await updateProfile(formData);
      if (typeof setUser === 'function') {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      setError(null);
    } catch (err) {
      console.error('Update profile error:', err.message);
      setError('Failed to update profile. Please try again.');
    }
  };

  if (!user) {
    return <div className="text-white text-center mt-10">User not authenticated. Please log in.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navbar */}
      <nav className="bg-dark-navy p-4 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-display text-vibrant-pink">ShareSync</h1>
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-white hover:text-vibrant-pink transition-colors">
            Home
          </Link>
          <Link to="/profile">
            <img
              src={profileData.profilePicture || 'https://via.placeholder.com/40'}
              alt="User Avatar"
              className="w-10 h-10 rounded-full border-2 border-vibrant-pink"
              onError={(e) => (e.target.src = 'https://via.placeholder.com/40')}
            />
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Banner and Profile Picture */}
        <div className="relative">
          <img
            src={profileData.banner || 'https://via.placeholder.com/1200x300'}
            alt="Profile Banner"
            className="w-full h-64 object-cover rounded-t-lg"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/1200x300')}
          />
          <div className="absolute bottom-0 left-8 transform translate-y-1/2">
            <img
              src={profileData.profilePicture || 'https://via.placeholder.com/150'}
              alt="Profile Picture"
              className="w-32 h-32 rounded-full border-4 border-dark-navy"
              onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
            />
          </div>
        </div>

        {/* Profile Info */}
        <div className="mt-20 p-6 bg-dark-navy rounded-b-lg shadow-lg">
          <h1 className="text-3xl font-display text-vibrant-pink">{`${profileData.firstName} ${profileData.lastName}`}</h1>
          <p className="text-gray-300 mt-2">{profileData.email}</p>
        </div>

        {/* Profile Engagement Infographic */}
        <ProfileEngagementInfographic />

        {/* Tabs */}
        <div className="mt-6 flex space-x-4 border-b border-gray-600">
          <button
            onClick={() => setActiveTab('posts')}
            className={`p-3 ${activeTab === 'posts' ? 'text-vibrant-pink border-b-2 border-vibrant-pink' : 'text-white'} hover:text-neon-blue transition-colors`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`p-3 ${activeTab === 'about' ? 'text-vibrant-pink border-b-2 border-vibrant-pink' : 'text-white'} hover:text-neon-blue transition-colors`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-3 ${activeTab === 'settings' ? 'text-vibrant-pink border-b-2 border-vibrant-pink' : 'text-white'} hover:text-neon-blue transition-colors`}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <div className="mt-6">
            <h2 className="text-2xl font-display text-vibrant-pink mb-4">Your Posts</h2>
            <p className="text-white">No posts yet. Share your updates!</p>
            {/* Future implementation: Fetch and display user posts */}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="mt-6">
            <h2 className="text-2xl font-display text-vibrant-pink mb-4">About</h2>
            <p className="text-white">Name: {`${profileData.firstName} ${profileData.lastName}`}</p>
            <p className="text-white mt-2">Email: {profileData.email}</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="mt-6">
            <h2 className="text-2xl font-display text-vibrant-pink mb-4">Profile Settings</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white mb-2 font-medium">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                />
              </div>
              <div>
                <label className="block text-white mb-2 font-medium">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                />
              </div>
              <div>
                <label className="block text-white mb-2 font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                />
              </div>
              <div>
                <label className="block text-white mb-2 font-medium">Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                />
              </div>
              <div>
                <label className="block text-white mb-2 font-medium">Banner</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                />
              </div>
              {error && <div className="text-red-500">{error}</div>}
              <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow">
                Save Changes
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;