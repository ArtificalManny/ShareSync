import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserDetails, updateProfile, getUserProjects } from '../utils/api';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState({ School: [], Job: [], Personal: [] });
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    profilePicture: '',
    bannerPicture: '',
    school: '',
    job: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user details
        try {
          console.log('Fetching user details...');
          const userData = await getUserDetails();
          setUser(userData);
          setFormData({
            profilePicture: userData.profilePicture || '',
            bannerPicture: userData.bannerPicture || '',
            school: userData.school || '',
            job: userData.job || '',
          });
        } catch (err) {
          console.error('Failed to fetch user details:', err.message);
          setError(prev => prev ? `${prev}; User details failed: ${err.message}` : `User details failed: ${err.message}`);
        }

        // Fetch user projects
        try {
          console.log('Fetching user projects...');
          const projectsData = await getUserProjects();
          setProjects(projectsData);
        } catch (err) {
          console.error('Failed to fetch user projects:', err.message);
          setError(prev => prev ? `${prev}; User projects failed: ${err.message}` : `User projects failed: ${err.message}`);
          setProjects({ School: [], Job: [], Personal: [] });
        }
      } catch (err) {
        setError(`Unexpected error: ${err.message}`);
        console.error('Profile page unexpected error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      const updatedUser = await getUserDetails();
      setUser(updatedUser);
      setEditMode(false);
    } catch (err) {
      setError(`Failed to update profile: ${err.message}`);
      console.error('Update profile error:', err.message);
    }
  };

  if (loading) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="card mb-6 animate-fade-in">
        <div className="relative">
          <img
            src={user?.bannerPicture || 'https://via.placeholder.com/1200x300'}
            alt="Banner"
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <img
            src={user?.profilePicture || 'https://via.placeholder.com/150'}
            alt="Profile"
            className="absolute bottom-0 left-4 transform translate-y-1/2 w-32 h-32 rounded-full border-4 border-dark-navy animate-pulse-glow"
          />
        </div>
        <div className="pt-16 p-6">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <h1 className="text-3xl font-display text-vibrant-pink">{user ? `${user.firstName} ${user.lastName}` : 'User'}</h1>
          <p className="text-gray-300">{user ? `@${user.username}` : ''}</p>
          <p className="text-white mt-2">Job: {user?.job || 'Not specified'}</p>
          <p className="text-white">School: {user?.school || 'Not specified'}</p>
          <button
            onClick={() => setEditMode(!editMode)}
            className="mt-4 btn-primary"
          >
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
          {editMode && (
            <form onSubmit={handleSubmit} className="mt-6">
              <div className="mb-4">
                <label className="block text-white mb-2">Profile Picture URL</label>
                <input
                  type="text"
                  name="profilePicture"
                  value={formData.profilePicture}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-4">
                <label className="block text-white mb-2">Banner Picture URL</label>
                <input
                  type="text"
                  name="bannerPicture"
                  value={formData.bannerPicture}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-4">
                <label className="block text-white mb-2">School</label>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-4">
                <label className="block text-white mb-2">Job</label>
                <input
                  type="text"
                  name="job"
                  value={formData.job}
                  onChange={handleChange}
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Save Changes
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="card animate-fade-in">
        <h2 className="text-xl font-display text-vibrant-pink mb-4">Your Projects</h2>
        {['School', 'Job', 'Personal'].map(category => (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-display text-vibrant-pink">{category}</h3>
            {projects[category].length === 0 ? (
              <p className="text-white">No {category} projects yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {projects[category].map(project => (
                  <div
                    key={project._id}
                    className="card transform hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => navigate(`/project/${project._id}`)}
                  >
                    <h4 className="text-lg font-display text-vibrant-pink">{project.title}</h4>
                    <p className="text-gray-300">{project.description}</p>
                    <p className="text-sm mt-2 text-white">Status: {project.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;