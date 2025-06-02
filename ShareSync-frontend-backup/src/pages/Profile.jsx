import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import axios from 'axios';
import { Edit, X, Folder } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError, updateUserProfile } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    job: '',
    school: '',
    profilePicture: '',
    bannerPicture: '',
  });
  const [retryCount, setRetryCount] = useState(0);
  const [hasFailed, setHasFailed] = useState(false);
  const maxRetries = 2;
  const timeoutDuration = 5000;

  console.log('Profile.jsx - Rendering, username:', username, 'isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user);

  useEffect(() => {
    const fetchProfile = async () => {
      console.log('Profile - useEffect triggered');
      if (isLoading) {
        console.log('Profile - Waiting for AuthContext to finish loading');
        return;
      }

      if (!isAuthenticated) {
        console.log('Profile - User not authenticated, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }

      if (!username) {
        console.log('Profile - No username provided');
        setError('No username provided.');
        setHasFailed(true);
        return;
      }

      // Use authenticated user data if viewing own profile
      if (user && user.username.toLowerCase() === username.toLowerCase()) {
        console.log('Profile - Using authenticated user data as initial profile');
        setProfile(user);
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          job: user.job || '',
          school: user.school || '',
          profilePicture: user.profilePicture || 'https://via.placeholder.com/150',
          bannerPicture: user.bannerPicture || 'https://via.placeholder.com/1200x300',
        });
        return;
      }

      // Fetch profile data for other users
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
        setHasFailed(true);
        setError('Profile loading timed out. Please try again later.');
        console.log('Profile - Fetch request timed out after', timeoutDuration, 'ms');
      }, timeoutDuration);

      try {
        console.log('Profile - Fetching profile for username:', username);
        const response = await axios.get(`http://localhost:3000/api/auth/profile/${username}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        console.log('Profile - Backend response:', response.data);
        setProfile(response.data);
        setFormData({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          job: response.data.job || '',
          school: response.data.school || '',
          profilePicture: response.data.profilePicture || 'https://via.placeholder.com/150',
          bannerPicture: response.data.bannerPicture || 'https://via.placeholder.com/1200x300',
        });
        console.log('Profile - Profile fetched:', response.data.email);
      } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
          console.log('Profile - Fetch request timed out after', timeoutDuration, 'ms');
          setHasFailed(true);
          setError('Profile loading timed out. Please try again later.');
        } else if (retryCount < maxRetries) {
          console.log('Profile - Retrying fetch, attempt:', retryCount + 1, 'Error:', err.message);
          setTimeout(() => setRetryCount(retryCount + 1), 500);
        } else {
          console.log('Profile - Max retries reached. Error:', err.message);
          setError('Failed to load profile after multiple attempts. The user may not exist or you may not have access.');
          setHasFailed(true);
        }
      }
    };

    fetchProfile();
  }, [username, isAuthenticated, isLoading, navigate, user, retryCount]);

  const handleEdit = () => {
    console.log('Profile - Entering edit mode');
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      console.log('Profile - Saving profile updates:', formData);
      await updateUserProfile(formData);
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      alert('Profile updated successfully!');
      console.log('Profile - Profile updated successfully');
    } catch (err) {
      console.error('Profile - Failed to update profile:', err.message);
      setError('Failed to update profile: ' + (err.message || 'Please try again.'));
    }
  };

  const handleCancel = () => {
    console.log('Profile - Cancelling edit mode');
    setIsEditing(false);
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      job: profile.job || '',
      school: profile.school || '',
      profilePicture: profile.profilePicture || 'https://via.placeholder.com/150',
      bannerPicture: profile.bannerPicture || 'https://via.placeholder.com/1200x300',
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isLoading) {
    console.log('Profile - Rendering loading state');
    return (
      <div className="profile-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading profile"></div>
        <span className="text-coral-pink text-xl font-poppins ml-4">Loading...</span>
      </div>
    );
  }

  if (authError || hasFailed) {
    console.log('Profile - Rendering error state, authError:', authError, 'hasFailed:', hasFailed);
    return (
      <div className="profile-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg font-poppins mb-4">{authError || error}</p>
          <Link to="/" className="text-coral-pink hover:underline text-base font-poppins focus:outline-none focus:ring-2 focus:ring-golden-yellow">Return to Home</Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    console.log('Profile - No profile data, rendering loading state');
    return (
      <div className="profile-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading profile"></div>
        <span className="text-deep-teal text-xl font-poppins ml-4">Loading profile...</span>
      </div>
    );
  }

  const isOwner = user && user.username.toLowerCase() === username.toLowerCase();
  const projectsByCategory = {
    School: (profile.projects || []).filter(p => p.category === 'School') || [],
    Job: (profile.projects || []).filter(p => p.category === 'Job') || [],
    Personal: (profile.projects || []).filter(p => p.category === 'Personal') || [],
  };

  console.log('Profile - Rendering main content for profile:', profile.email);
  return (
    <div className="profile-container min-h-screen">
      <div className="profile-header relative">
        <img
          src={isEditing ? formData.bannerPicture : profile.bannerPicture}
          alt="Profile banner"
          className="w-full h-48 object-cover rounded-b-3xl shadow-lg"
        />
        <div className="absolute bottom-0 left-6 transform translate-y-1/2">
          <img
            src={isEditing ? formData.profilePicture : profile.profilePicture}
            alt="Profile picture"
            className="w-32 h-32 rounded-full border-4 border-golden-yellow shadow-lg"
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 mt-16">
        {error && <p className="text-red-500 mb-4 text-center text-lg font-poppins">{error}</p>}
        <div className="profile-details card p-6 glassmorphic shadow-lg">
          <div className="flex justify-between items-start mb-6">
            <div>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input-field text-2xl font-poppins font-bold text-coral-pink mb-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                    placeholder="First Name"
                    aria-label="First Name"
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input-field text-2xl font-poppins font-bold text-coral-pink mb-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                    placeholder="Last Name"
                    aria-label="Last Name"
                  />
                </>
              ) : (
                <h1 className="text-2xl font-poppins font-bold text-coral-pink mb-2 animate-text-glow">
                  {profile.firstName} {profile.lastName}
                </h1>
              )}
              <p className="text-deep-teal mb-2 text-base font-poppins">@{profile.username}</p>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="job"
                    value={formData.job}
                    onChange={handleInputChange}
                    className="input-field w-full mb-2 rounded-lg text-deep-teal focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                    placeholder="Job"
                    aria-label="Job"
                  />
                  <input
                    type="text"
                    name="school"
                    value={formData.school}
                    onChange={handleInputChange}
                    className="input-field w-full mb-2 rounded-lg text-deep-teal focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                    placeholder="School"
                    aria-label="School"
                  />
                  <input
                    type="text"
                    name="profilePicture"
                    value={formData.profilePicture}
                    onChange={handleInputChange}
                    className="input-field w-full mb-2 rounded-lg text-deep-teal focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                    placeholder="Profile Picture URL"
                    aria-label="Profile Picture URL"
                  />
                  <input
                    type="text"
                    name="bannerPicture"
                    value={formData.bannerPicture}
                    onChange={handleInputChange}
                    className="input-field w-full mb-2 rounded-lg text-deep-teal focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                    placeholder="Banner Picture URL"
                    aria-label="Banner Picture URL"
                  />
                </>
              ) : (
                <>
                  <p className="text-deep-teal mb-1 text-base font-poppins">Job: {profile.job || 'Not specified'}</p>
                  <p className="text-deep-teal mb-1 text-base font-poppins">School: {profile.school || 'Not specified'}</p>
                </>
              )}
            </div>
            {isOwner && (
              <div className="flex gap-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="btn-primary rounded-full animate-glow px-4 py-2 text-base font-poppins focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                      aria-label="Save profile changes"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn-primary rounded-full bg-deep-teal px-4 py-2 text-base font-poppins focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                      aria-label="Cancel editing"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="btn-primary rounded-full animate-glow flex items-center px-4 py-2 text-base font-poppins focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                    aria-label="Edit profile"
                  >
                    <Edit className="w-5 h-5 mr-2" aria-hidden="true" /> Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="projects-section">
            <h2 className="text-2xl font-poppins font-semibold text-coral-pink mb-4 flex items-center">
              <Folder className="w-5 h-5 mr-2 text-golden-yellow animate-pulse" aria-hidden="true" /> Projects
            </h2>
            {(profile.projects || []).length === 0 ? (
              <p className="text-deep-teal text-base font-poppins">No projects yet.</p>
            ) : (
              <div className="space-y-6">
                {['School', 'Job', 'Personal'].map(category => (
                  projectsByCategory[category].length > 0 && (
                    <div key={category}>
                      <h3 className="text-xl font-poppins font-medium text-coral-pink mb-2">{category} Projects</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectsByCategory[category].map(project => (
                          <Link
                            key={project.id}
                            to={`/projects/${project.id}`}
                            className="project-card card p-4 glassmorphic holographic-effect shadow-md focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                            aria-label={`View project ${project.title}`}
                          >
                            <h4 className="text-lg font-poppins font-semibold text-coral-pink">{project.title || 'Untitled Project'}</h4>
                            <p className="text-deep-teal text-sm mb-1 font-poppins">{project.description || 'No description'}</p>
                            <p className="text-deep-teal text-sm font-poppins">Status: {project.status || 'Not Started'}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
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