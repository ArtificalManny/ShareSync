import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProjects, updateProfile } from '../utils/api';

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState({ School: [], Job: [], Personal: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    job: user?.job || '',
    school: user?.school || '',
  });
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [bannerPicture, setBannerPicture] = useState(user?.bannerPicture || '');
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState(user?.profilePicture || '');
  const [bannerPicturePreview, setBannerPicturePreview] = useState(user?.bannerPicture || '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        try {
          console.log('Fetching user projects...');
          const projectsData = await getUserProjects();
          setProjects(projectsData);
        } catch (err) {
          console.error('Failed to fetch user projects:', err.message);
          if (err.message.includes('401') || err.message.includes('Unauthorized')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            navigate('/login');
          } else {
            setError('Failed to load projects. Please try again later.');
            setProjects({ School: [], Job: [], Personal: [] });
          }
        }
      } catch (err) {
        console.error('Profile page unexpected error:', err.message);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, setUser]);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      setUser({ ...user, ...profileForm });
      localStorage.setItem('user', JSON.stringify({ ...user, ...profileForm }));
      setEditMode(false);
    } catch (err) {
      console.error('Update profile error:', err.message);
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
      } else {
        setUser({ ...user, ...profileForm });
        localStorage.setItem('user', JSON.stringify({ ...user, ...profileForm }));
        setEditMode(false);
      }
    }
  };

  const handleProfilePictureChange = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ profilePicture });
      setUser({ ...user, profilePicture });
      localStorage.setItem('user', JSON.stringify({ ...user, profilePicture }));
      setShowProfilePictureModal(false);
    } catch (err) {
      console.error('Update profile picture error:', err.message);
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
      } else {
        setUser({ ...user, profilePicture });
        localStorage.setItem('user', JSON.stringify({ ...user, profilePicture }));
        setShowProfilePictureModal(false);
      }
    }
  };

  const handleBannerChange = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ bannerPicture });
      setUser({ ...user, bannerPicture });
      localStorage.setItem('user', JSON.stringify({ ...user, bannerPicture }));
      setShowBannerModal(false);
    } catch (err) {
      console.error('Update banner picture error:', err.message);
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
      } else {
        setUser({ ...user, bannerPicture });
        localStorage.setItem('user', JSON.stringify({ ...user, bannerPicture }));
        setShowBannerModal(false);
      }
    }
  };

  const handleFileSelect = (e, setPicture, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setPicture(fileUrl);
      setPreview(fileUrl);
    }
  };

  if (loading) {
    return <div className="text-white text-center mt-10 animate-shimmer">Loading...</div>;
  }

  if (error) {
    return <div className="text-white text-center mt-10">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="card glassmorphic mb-8 animate-fade-in">
        <div className="relative">
          <img
            src={bannerPicturePreview || 'https://via.placeholder.com/1200x300?text=Banner'}
            alt="Banner"
            className="w-full h-64 object-cover rounded-t-lg animate-pulse-glow"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/1200x300?text=Banner')}
          />
          <button
            onClick={() => setShowBannerModal(true)}
            className="absolute top-4 right-4 btn-primary neumorphic text-sm hover:scale-105 transition-transform"
          >
            Change Banner
          </button>
          <div className="absolute bottom-0 left-6 transform translate-y-1/2">
            <img
              src={profilePicturePreview || 'https://via.placeholder.com/150?text=Profile'}
              alt="Profile"
              className="w-32 h-32 rounded-full border-4 border-dark-navy animate-pulse-glow"
              onError={(e) => (e.target.src = 'https://via.placeholder.com/150?text=Profile')}
            />
            <button
              onClick={() => setShowProfilePictureModal(true)}
              className="absolute bottom-0 right-0 bg-vibrant-pink text-white rounded-full p-2 hover:bg-neon-blue transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </button>
          </div>
        </div>
        <div className="pt-20 p-6">
          <h1 className="text-4xl font-display text-vibrant-pink animate-fade-in">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Manny Rivas'}</h1>
          <p className="text-gray-300 text-lg mt-2">{user?.username ? `@${user.username}` : '@MannyRivas'}</p>
          {editMode ? (
            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-white mb-2 font-medium">Job</label>
                <input
                  type="text"
                  name="job"
                  value={profileForm.job}
                  onChange={handleProfileChange}
                  className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                  placeholder="Enter your job"
                />
              </div>
              <div>
                <label className="block text-white mb-2 font-medium">School</label>
                <input
                  type="text"
                  name="school"
                  value={profileForm.school}
                  onChange={handleProfileChange}
                  className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                  placeholder="Enter your school"
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary neumorphic hover:scale-105 transition-transform">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setProfileForm({
                      job: user?.job || '',
                      school: user?.school || '',
                    });
                  }}
                  className="btn-secondary neumorphic hover:scale-105 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6">
              <p className="text-white text-lg">Job: {user?.job || 'Not specified'}</p>
              <p className="text-white text-lg">School: {user?.school || 'Not specified'}</p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => setEditMode(true)}
                  className="btn-primary neumorphic hover:scale-105 transition-transform"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="btn-secondary neumorphic hover:scale-105 transition-transform"
                >
                  Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card glassmorphic animate-fade-in">
        <h2 className="text-2xl font-display text-vibrant-pink mb-6">Your Projects</h2>
        {['School', 'Job', 'Personal'].map(category => (
          <div key={category} className="mb-8">
            <h3 className="text-xl font-display text-vibrant-pink mb-4">{category}</h3>
            {projects[category].length === 0 ? (
              <p className="text-white">No {category} projects yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects[category].map(project => (
                  <div
                    key={project._id}
                    className="card glassmorphic transform hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => navigate(`/project/${project._id}`)}
                  >
                    <h4 className="text-lg font-display text-vibrant-pink">{project.title}</h4>
                    <p className="text-gray-300 mt-2">{project.description}</p>
                    <p className="text-sm mt-3 text-white">Status: {project.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Profile Picture Modal */}
      {showProfilePictureModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowProfilePictureModal(false)}></div>
          <div className="modal glassmorphic">
            <h2 className="text-2xl font-display text-vibrant-pink mb-6">Change Profile Picture</h2>
            <form onSubmit={handleProfilePictureChange}>
              <div className="mb-6">
                <label className="block text-white mb-3 font-medium">Select a Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, setProfilePicture, setProfilePicturePreview)}
                  className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                />
              </div>
              {profilePicturePreview && (
                <div className="mb-6 flex justify-center">
                  <img
                    src={profilePicturePreview}
                    alt="Profile Preview"
                    className="w-48 h-48 rounded-full object-cover animate-pulse-glow"
                    onError={(e) => (e.target.src = 'https://via.placeholder.com/150?text=Profile')}
                  />
                </div>
              )}
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary neumorphic hover:scale-105 transition-transform">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfilePictureModal(false);
                    setProfilePicture(user?.profilePicture || '');
                    setProfilePicturePreview(user?.profilePicture || '');
                  }}
                  className="btn-secondary neumorphic hover:scale-105 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Banner Modal */}
      {showBannerModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowBannerModal(false)}></div>
          <div className="modal glassmorphic">
            <h2 className="text-2xl font-display text-vibrant-pink mb-6">Change Banner</h2>
            <form onSubmit={handleBannerChange}>
              <div className="mb-6">
                <label className="block text-white mb-3 font-medium">Select a Banner Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, setBannerPicture, setBannerPicturePreview)}
                  className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                />
              </div>
              {bannerPicturePreview && (
                <div className="mb-6">
                  <img
                    src={bannerPicturePreview}
                    alt="Banner Preview"
                    className="w-full h-48 object-cover rounded-lg animate-pulse-glow"
                    onError={(e) => (e.target.src = 'https://via.placeholder.com/1200x300?text=Banner')}
                  />
                </div>
              )}
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary neumorphic hover:scale-105 transition-transform">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBannerModal(false);
                    setBannerPicture(user?.bannerPicture || '');
                    setBannerPicturePreview(user?.bannerPicture || '');
                  }}
                  className="btn-secondary neumorphic hover:scale-105 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;