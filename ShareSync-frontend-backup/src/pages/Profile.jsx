import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProjects, updateProfile } from '../utils/api';

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    profilePicture: user?.profilePicture || 'https://via.placeholder.com/150',
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(profileForm.profilePicture);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('Fetching user projects...');
        const userProjects = await getUserProjects();
        console.log('User projects:', userProjects);
        setProjects(userProjects);
      } catch (err) {
        console.error('Failed to fetch user projects:', err.message);
        setError(`Failed to load projects: ${err.message}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      let updatedProfile = { ...profileForm };

      // If a new profile picture is selected, upload it
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append('profilePicture', profilePictureFile);
        formData.append('firstName', profileForm.firstName);
        formData.append('lastName', profileForm.lastName);
        formData.append('username', profileForm.username);
        formData.append('email', profileForm.email);
        formData.append('bio', profileForm.bio);

        const response = await updateProfile(formData);
        updatedProfile = response;
      } else {
        updatedProfile = await updateProfile(profileForm);
      }

      setUser({ ...user, ...updatedProfile });
      localStorage.setItem('user', JSON.stringify({ ...user, ...updatedProfile }));
      setEditProfile(false);
      setProfilePictureFile(null);
      setPreviewUrl(updatedProfile.profilePicture);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Update profile error:', err.message);
      setError('Failed to update profile. Please try again.');
    }
  };

  const handleCreateProject = () => {
    navigate('/projects/create');
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`, { state: { user } });
  };

  if (loading) {
    return <div className="text-white text-center mt-10 animate-shimmer">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Cover Photo Section (Facebook-inspired) */}
      <div className="relative">
        <div className="h-64 bg-gray-700 rounded-t-lg">
          {/* Placeholder for cover photo */}
          <div className="w-full h-full bg-gradient-to-r from-vibrant-pink to-neon-blue opacity-50"></div>
        </div>
        {/* Profile Picture Section */}
        <div className="absolute bottom-0 left-8 transform translate-y-1/2">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Profile"
              className="w-40 h-40 rounded-full border-4 border-dark-navy shadow-lg"
              onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
            />
            {editProfile && (
              <label className="absolute bottom-2 right-2 bg-vibrant-pink text-white rounded-full p-2 cursor-pointer hover:bg-neon-blue transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0017.07 7H18a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Main Profile Content */}
      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Sidebar (LinkedIn-inspired: Bio, Details) */}
        <div className="md:col-span-1">
          <div className="card glassmorphic mb-6 animate-fade-in">
            <h3 className="text-xl font-display text-vibrant-pink mb-4">About Me</h3>
            {editProfile ? (
              <textarea
                name="bio"
                value={profileForm.bio}
                onChange={handleProfileChange}
                className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all h-32"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-white">{user?.bio || 'No bio yet.'}</p>
            )}
          </div>

          <div className="card glassmorphic mb-6 animate-fade-in">
            <h3 className="text-xl font-display text-vibrant-pink mb-4">Profile Information</h3>
            {editProfile ? (
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
                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary neumorphic hover:scale-105 transition-transform">
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditProfile(false);
                      setProfileForm({
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        username: user?.username || '',
                        email: user?.email || '',
                        bio: user?.bio || '',
                        profilePicture: user?.profilePicture || 'https://via.placeholder.com/150',
                      });
                      setPreviewUrl(user?.profilePicture || 'https://via.placeholder.com/150');
                      setProfilePictureFile(null);
                    }}
                    className="btn-secondary neumorphic hover:scale-105 transition-transform"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <p className="text-white"><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
                <p className="text-white"><strong>Username:</strong> {user?.username || 'N/A'}</p>
                <p className="text-white"><strong>Email:</strong> {user?.email || 'N/A'}</p>
                <button
                  onClick={() => setEditProfile(true)}
                  className="btn-primary mt-4 neumorphic hover:scale-105 transition-transform"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content (Projects Section: LinkedIn-inspired) */}
        <div className="md:col-span-2">
          <div className="card glassmorphic mb-8 animate-fade-in">
            <h3 className="text-xl font-display text-vibrant-pink mb-4">My Projects</h3>
            {error && (
              <div className="bg-red-500 text-white p-3 rounded-lg mb-6 animate-shimmer">
                {error}
              </div>
            )}
            <button
              onClick={handleCreateProject}
              className="btn-primary mb-6 neumorphic hover:scale-105 transition-transform"
            >
              Create New Project
            </button>
            {projects.length === 0 ? (
              <p className="text-white">No projects yet.</p>
            ) : (
              <div className="space-y-4">
                {projects.map(project => (
                  <div
                    key={project._id}
                    className="card glassmorphic transform hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => handleProjectClick(project._id)}
                  >
                    <h4 className="text-lg font-display text-vibrant-pink">{project.title}</h4>
                    <p className="text-gray-300 mt-2">{project.description}</p>
                    <p className="text-sm text-white mt-2">Status: {project.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;